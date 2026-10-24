// SPDX-License-Identifier: AGPL-3.0-only
//
// The renderer of the network map: a small WebGL 2 engine written for this one picture.
//
// Why custom and not three.js: the picture is 2D, a few hundred line segments and a few dozen
// discs, so a general 3D library would add ~150 KB for nothing. Everything is instanced quads whose
// shapes are signed distance functions in the fragment shader, so the whole frame is two draw calls
// (plus one full-screen pass for the dithered style) and the cost is dominated by pixels, which the
// caller caps. The engine knows nothing about React or the page: it gets a canvas, a scene and a
// style, and it draws frames when asked.
//
// Three looks share one pipeline (see styles.ts): "glow" blends with MAX so overlapping segments
// never double up; "ink" draws opaque crisp lines for a light page; "dither" renders the glow into
// a texture and quantises it with an 8x8 Bayer matrix to a single colour.

import type { Scene } from "./scene";
import type { MapStyle } from "./styles";

export type Rgb = [number, number, number];

export interface Palette {
  line: Rgb;
  player: Rgb;
  relay: Rgb;
  relayCore: Rgb;
  pulse: Rgb;
}

export interface EngineStats {
  /** Backing-store size in device pixels. */
  width: number;
  height: number;
  pixels: number;
  /** Device pixels per CSS pixel after the pixel cap. */
  scale: number;
  frames: number;
  /** Time spent submitting the last frames, ms (CPU side, rolling mean over 60 frames). */
  submitMs: number;
  /** Submit plus waiting for the GPU (gl.finish), only measured when `measure` is on. */
  gpuMs: number | null;
  renderer: string;
}

const VERT_SEG = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aSeg;
layout(location=2) in vec4 aMeta;
layout(location=3) in vec2 aKind;
uniform vec2 uCanvas;
uniform vec3 uCover;
uniform float uPad;
out vec2 vP;
flat out vec4 vSeg;
flat out vec4 vMeta;
flat out vec2 vKind;
void main() {
  vec2 a = aSeg.xy * uCover.x + uCover.yz;
  vec2 b = aSeg.zw * uCover.x + uCover.yz;
  vec2 dir = b - a;
  float len = length(dir);
  vec2 d = len > 0.0001 ? dir / len : vec2(1.0, 0.0);
  vec2 n = vec2(-d.y, d.x);
  float t = aCorner.x * 0.5 + 0.5;
  vec2 p = mix(a, b, t) + d * aCorner.x * uPad + n * aCorner.y * uPad;
  vP = p;
  vSeg = vec4(a, b);
  vMeta = vec4(aMeta.x * uCover.x, aMeta.y * uCover.x, aMeta.z, aMeta.w);
  vKind = aKind;
  vec2 clip = (p / uCanvas) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const COMMON = `
uniform float uTime;
uniform float uPx;
uniform float uMode;
uniform vec4 uQuiet;
uniform float uQuietStrength;
float quiet(vec2 p) {
  vec2 c = (uQuiet.xy + uQuiet.zw) * 0.5;
  vec2 hs = max((uQuiet.zw - uQuiet.xy) * 0.5, vec2(1.0));
  vec2 q = abs(p - c) / hs;
  float m = 1.0 - smoothstep(0.82, 1.12, max(q.x, q.y));
  return 1.0 - uQuietStrength * m;
}`;

const FRAG_SEG = `#version 300 es
precision highp float;
${COMMON}
uniform vec3 uLineCol;
uniform vec3 uPulseCol;
uniform vec4 uLine; // half width px, glow px, core alpha, glow alpha
uniform vec2 uPulseP; // tail px, pulse half width px
in vec2 vP;
flat in vec4 vSeg;
flat in vec4 vMeta;
flat in vec2 vKind;
out vec4 o;
void main() {
  vec2 a = vSeg.xy;
  vec2 ba = vSeg.zw - a;
  float l2 = dot(ba, ba);
  float h = l2 > 0.0 ? clamp(dot(vP - a, ba) / l2, 0.0, 1.0) : 0.0;
  float d = length(vP - a - ba * h);
  float along = vMeta.x + h * sqrt(l2);
  float aa = 1.0 / uPx;
  float hw = uLine.x;
  float core = 1.0 - smoothstep(hw - aa, hw + aa, d);
  float glow = uLine.y > 0.0 ? exp(-(d * d) / (2.0 * uLine.y * uLine.y)) : 0.0;
  float w = vKind.y * quiet(vP);
  float dash = vKind.x > 1.5 ? step(fract(along / 14.0), 0.55) : 1.0;
  float base = (core * dash * uLine.z + glow * uLine.w) * w;

  float tail = uPulseP.x;
  float head = fract(uTime * vMeta.w + vMeta.z) * (vMeta.y + tail);
  float behind = head - along;
  float trail = (behind > 0.0 && behind < tail) ? exp(-behind / (tail * 0.32)) * smoothstep(0.0, 3.0, behind) : 0.0;
  float pcore = 1.0 - smoothstep(uPulseP.y - aa, uPulseP.y + aa, d);
  float pulse = trail * (pcore + glow * 0.28) * w;

  if (uMode > 0.5) {
    // ink: opaque route, the pulse paints over it
    float a1 = clamp(base, 0.0, 1.0);
    float pa = clamp(pulse, 0.0, 1.0);
    vec3 rgb = uLineCol * a1 * (1.0 - pa) + uPulseCol * pa;
    o = vec4(rgb, a1 * (1.0 - pa) + pa);
  } else {
    // glow: light on dark; the pulse is the brighter colour
    float pa = clamp(pulse, 0.0, 1.0);
    vec3 rgb = uLineCol * base + uPulseCol * pa;
    o = vec4(min(rgb, vec3(1.0)), clamp(base + pa, 0.0, 1.0));
  }
}`;

const VERT_NODE = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aNode; // x y kind phase
layout(location=2) in vec2 aSize; // radius css px, weight
uniform vec2 uCanvas;
uniform vec3 uCover;
out vec2 vL;
flat out vec4 vNode;
flat out vec2 vSize;
flat out vec2 vPos;
void main() {
  vec2 c = aNode.xy * uCover.x + uCover.yz;
  float pad = aSize.x * 4.2 + 6.0;
  vec2 p = c + aCorner * pad;
  vL = aCorner * pad;
  vNode = aNode;
  vSize = aSize;
  vPos = c;
  vec2 clip = (p / uCanvas) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAG_NODE = `#version 300 es
precision highp float;
${COMMON}
uniform vec3 uPlayerCol;
uniform vec3 uRelayCol;
uniform vec3 uCoreCol;
uniform vec3 uPulseCol;
uniform vec3 uLineCol;
uniform vec2 uHalo; // halo strength for players, relays
in vec2 vL;
flat in vec4 vNode;
flat in vec2 vSize;
flat in vec2 vPos;
out vec4 o;
void main() {
  float r = vSize.x;
  float d = length(vL);
  float aa = 1.0 / uPx;
  float w = vSize.y * quiet(vPos);
  bool relay = vNode.z > 0.5;
  float breathe = 0.5 + 0.5 * sin(uTime * 1.3 + vNode.w * 6.2831);
  if (uMode > 0.5) {
    // ink: a station. A relay is an interchange (paper disc, thick ink ring, a brand centre), a player is a dot.
    if (relay) {
      float ring = (1.0 - smoothstep(r - aa, r + aa, d)) - (1.0 - smoothstep(r * 0.62 - aa, r * 0.62 + aa, d));
      float disc = 1.0 - smoothstep(r * 0.62 - aa, r * 0.62 + aa, d);
      float centre = 1.0 - smoothstep(r * 0.3 - aa, r * 0.3 + aa, d);
      vec3 rgb = uRelayCol * ring + uCoreCol * disc * (1.0 - centre) + uPulseCol * centre;
      float al = ring + disc;
      o = vec4(rgb, clamp(al, 0.0, 1.0) * w);
      o.rgb *= w;
    } else {
      float dot1 = 1.0 - smoothstep(r - aa, r + aa, d);
      o = vec4(uPlayerCol * dot1 * w, dot1 * w);
    }
    return;
  }
  // glow
  float core = 1.0 - smoothstep(r - aa, r + aa, d);
  float halo = exp(-(d * d) / (2.0 * r * r * 2.8)) * (relay ? uHalo.y : uHalo.x);
  vec3 rgb;
  float al;
  if (relay) {
    float ring = (1.0 - smoothstep(r - aa, r + aa, d)) - (1.0 - smoothstep(r * 0.7 - aa, r * 0.7 + aa, d));
    float ping = fract(uTime * 0.22 + vNode.w);
    float pr = r * (1.2 + 3.2 * ping);
    float pring = exp(-pow((d - pr) / (0.9 + r * 0.12), 2.0)) * (1.0 - ping) * 0.55;
    float inner = (1.0 - smoothstep(r * 0.36 - aa, r * 0.36 + aa, d)) * (0.55 + 0.45 * breathe);
    float a1 = clamp(ring + inner + pring + halo, 0.0, 1.0);
    rgb = uRelayCol * clamp(ring + pring + halo, 0.0, 1.0) + uPulseCol * inner;
    al = a1;
  } else {
    float a1 = clamp(core * 0.95 + halo, 0.0, 1.0);
    rgb = uPlayerCol * a1;
    al = a1;
  }
  o = vec4(min(rgb * w, vec3(1.0)), clamp(al * w, 0.0, 1.0));
}`;

const VERT_FS = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG_DITHER = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform float uCell;
uniform vec3 uOn;
uniform vec3 uHot;
out vec4 o;
float bayer8(ivec2 p) {
  int x = p.x & 7;
  int y = p.y & 7;
  int xy = x ^ y;
  int v = 0;
  // The low bits of the cell decide the high bits of the threshold: the classic Bayer order.
  for (int i = 0; i < 3; i++) {
    v = (v << 2) | (((xy >> i) & 1) << 1) | ((y >> i) & 1);
  }
  return float(v) / 64.0;
}
void main() {
  vec4 s = texelFetch(uScene, ivec2(gl_FragCoord.xy), 0);
  ivec2 cell = ivec2(floor(gl_FragCoord.xy / uCell));
  float t = bayer8(cell) + 0.5 / 64.0;
  float v = s.a;
  // Below 0.14 the glow tails would speckle the quiet side with stray dots: cut them.
  float on = step(t, max(v - 0.14, 0.0) * 1.12);
  vec3 col = v > 0.93 ? uHot : uOn;
  o = vec4(col * on, on);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`shader: ${log}`);
  }
  return sh;
}

function program(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`program: ${gl.getProgramInfoLog(p)}`);
  return p;
}

export interface EngineOptions {
  scene: Scene;
  style: MapStyle;
  palette: Palette;
  /** Keep the drawing buffer so the canvas can be read back (the still renderer). */
  preserve?: boolean;
  /** Wait for the GPU after every frame to measure real frame cost. */
  measure?: boolean;
  /** Quiet zone in world units: x0 y0 x1 y1, and how much it dims. */
  quiet: { rect: [number, number, number, number]; strength: number };
}

export interface MapEngine {
  /** Sets the size in CSS pixels and returns the pixel scale actually used. */
  resize(cssW: number, cssH: number, dpr: number): number;
  frame(timeSeconds: number): void;
  stats: EngineStats;
  lost: boolean;
  dispose(): void;
}

/** Returns null when WebGL 2 is not available: the caller keeps the poster. */
export function createMapEngine(canvas: HTMLCanvasElement, opts: EngineOptions): MapEngine | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: opts.preserve ?? false,
  });
  if (!gl) return null;

  const { scene, style, palette } = opts;
  const dither = style.render === "dither";
  const ink = style.render === "ink";

  let segProg: WebGLProgram;
  let nodeProg: WebGLProgram;
  let ditherProg: WebGLProgram | null = null;
  try {
    segProg = program(gl, VERT_SEG, FRAG_SEG);
    nodeProg = program(gl, VERT_NODE, FRAG_NODE);
    if (dither) ditherProg = program(gl, VERT_FS, FRAG_DITHER);
  } catch (e) {
    console.warn("network map: shader failed, keeping the still image", e);
    return null;
  }

  // ── geometry ─────────────────────────────────────────────────────────────────────
  const quad = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  // segments: a(2) b(2) | s0 L phase speed | kind weight
  const segs: number[] = [];
  const kindOf = { backbone: 0, access: 1, direct: 2 } as const;
  for (const e of scene.edges) {
    let s0 = 0;
    const weight = e.kind === "backbone" ? 1 : e.kind === "access" ? 0.8 : 0.9;
    for (let i = 1; i < e.points.length; i++) {
      const a = e.points[i - 1]!;
      const b = e.points[i]!;
      segs.push(a[0], a[1], b[0], b[1], s0, e.length, e.phase, e.speed, kindOf[e.kind], weight);
      s0 += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
  }
  const segCount = segs.length / 10;
  const segBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, segBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(segs), gl.STATIC_DRAW);

  const nodes: number[] = [];
  for (const n of scene.nodes) {
    const relay = n.kind === "relay";
    nodes.push(n.x, n.y, relay ? 1 : 0, n.phase, relay ? style.node.relayPx : style.node.playerPx, 1);
  }
  const nodeCount = nodes.length / 6;
  const nodeBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nodes), gl.STATIC_DRAW);

  const vaoSeg = gl.createVertexArray()!;
  gl.bindVertexArray(vaoSeg);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, segBuf);
  const sStride = 40;
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, sStride, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, sStride, 16);
  gl.vertexAttribDivisor(2, 1);
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 2, gl.FLOAT, false, sStride, 32);
  gl.vertexAttribDivisor(3, 1);

  const vaoNode = gl.createVertexArray()!;
  gl.bindVertexArray(vaoNode);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuf);
  const nStride = 24;
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, nStride, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, nStride, 16);
  gl.vertexAttribDivisor(2, 1);
  gl.bindVertexArray(null);

  const vaoEmpty = gl.createVertexArray()!;

  // ── uniforms ─────────────────────────────────────────────────────────────────────
  const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
  const us = {
    canvas: U(segProg, "uCanvas"),
    cover: U(segProg, "uCover"),
    pad: U(segProg, "uPad"),
    time: U(segProg, "uTime"),
    px: U(segProg, "uPx"),
    mode: U(segProg, "uMode"),
    quiet: U(segProg, "uQuiet"),
    quietS: U(segProg, "uQuietStrength"),
    lineCol: U(segProg, "uLineCol"),
    pulseCol: U(segProg, "uPulseCol"),
    line: U(segProg, "uLine"),
    pulseP: U(segProg, "uPulseP"),
  };
  const un = {
    canvas: U(nodeProg, "uCanvas"),
    cover: U(nodeProg, "uCover"),
    time: U(nodeProg, "uTime"),
    px: U(nodeProg, "uPx"),
    mode: U(nodeProg, "uMode"),
    quiet: U(nodeProg, "uQuiet"),
    quietS: U(nodeProg, "uQuietStrength"),
    player: U(nodeProg, "uPlayerCol"),
    relay: U(nodeProg, "uRelayCol"),
    core: U(nodeProg, "uCoreCol"),
    pulse: U(nodeProg, "uPulseCol"),
    line: U(nodeProg, "uLineCol"),
    halo: U(nodeProg, "uHalo"),
  };

  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const stats: EngineStats = {
    width: 0,
    height: 0,
    pixels: 0,
    scale: 1,
    frames: 0,
    submitMs: 0,
    gpuMs: opts.measure ? 0 : null,
    renderer: debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "unknown",
  };

  let cssW = 1;
  let cssH = 1;
  let fbo: WebGLFramebuffer | null = null;
  let tex: WebGLTexture | null = null;
  let lost = false;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
  };
  canvas.addEventListener("webglcontextlost", onLost);

  function ensureTarget(w: number, h: number) {
    if (!dither) return;
    if (tex) gl!.deleteTexture(tex);
    if (fbo) gl!.deleteFramebuffer(fbo);
    tex = gl!.createTexture();
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, w, h, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
    fbo = gl!.createFramebuffer();
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
  }

  /** world -> CSS px, exactly object-fit: cover, so the poster image and the canvas agree. */
  function cover(): [number, number, number] {
    const s = Math.max(cssW / scene.world.w, cssH / scene.world.h);
    return [s, (cssW - scene.world.w * s) / 2, (cssH - scene.world.h * s) / 2];
  }

  function resize(w: number, h: number, dpr: number) {
    cssW = Math.max(1, w);
    cssH = Math.max(1, h);
    // The pixel cap: never more than style.maxPixels device pixels, whatever the screen says.
    const scale = Math.max(0.5, Math.min(dpr, Math.sqrt(style.maxPixels / (cssW * cssH))));
    const pw = Math.max(1, Math.round(cssW * scale));
    const ph = Math.max(1, Math.round(cssH * scale));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      ensureTarget(pw, ph);
    } else if (dither && !tex) ensureTarget(pw, ph);
    stats.width = pw;
    stats.height = ph;
    stats.pixels = pw * ph;
    stats.scale = scale;
    return scale;
  }

  const sum: number[] = [];
  function frame(t: number) {
    if (lost || !gl) return;
    const t0 = performance.now();
    const [s, ox, oy] = cover();
    const q = opts.quiet.rect;
    const qpx = [q[0] * s + ox, q[1] * s + oy, q[2] * s + ox, q[3] * s + oy];

    gl.bindFramebuffer(gl.FRAMEBUFFER, dither ? fbo : null);
    gl.viewport(0, 0, stats.width, stats.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    if (ink) {
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      gl.blendEquation(gl.MAX);
      gl.blendFunc(gl.ONE, gl.ONE);
    }

    // routes
    gl.useProgram(segProg);
    gl.uniform2f(us.canvas, cssW, cssH);
    gl.uniform3f(us.cover, s, ox, oy);
    gl.uniform1f(us.pad, style.line.glowPx * 2.6 + style.line.widthPx + 2);
    gl.uniform1f(us.time, t);
    gl.uniform1f(us.px, stats.scale);
    gl.uniform1f(us.mode, ink ? 1 : 0);
    gl.uniform4f(us.quiet, qpx[0]!, qpx[1]!, qpx[2]!, qpx[3]!);
    gl.uniform1f(us.quietS, opts.quiet.strength);
    gl.uniform3fv(us.lineCol, palette.line);
    gl.uniform3fv(us.pulseCol, palette.pulse);
    gl.uniform4f(us.line, style.line.widthPx / 2, style.line.glowPx, style.line.alpha, style.line.glowAlpha);
    gl.uniform2f(us.pulseP, style.pulse.tailPx, style.pulse.widthPx / 2);
    gl.bindVertexArray(vaoSeg);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, segCount);

    // nodes
    gl.useProgram(nodeProg);
    gl.uniform2f(un.canvas, cssW, cssH);
    gl.uniform3f(un.cover, s, ox, oy);
    gl.uniform1f(un.time, t);
    gl.uniform1f(un.px, stats.scale);
    gl.uniform1f(un.mode, ink ? 1 : 0);
    gl.uniform4f(un.quiet, qpx[0]!, qpx[1]!, qpx[2]!, qpx[3]!);
    gl.uniform1f(un.quietS, opts.quiet.strength);
    gl.uniform3fv(un.player, palette.player);
    gl.uniform3fv(un.relay, palette.relay);
    gl.uniform3fv(un.core, palette.relayCore);
    gl.uniform3fv(un.pulse, palette.pulse);
    gl.uniform3fv(un.line, palette.line);
    gl.uniform2f(un.halo, style.node.playerHalo, style.node.relayHalo);
    gl.bindVertexArray(vaoNode);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, nodeCount);

    if (dither && ditherProg) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, stats.width, stats.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.BLEND);
      gl.useProgram(ditherProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(ditherProg, "uScene"), 0);
      gl.uniform1f(gl.getUniformLocation(ditherProg, "uCell"), Math.max(1, Math.round((style.dither?.cellPx ?? 3) * stats.scale)));
      gl.uniform3fv(gl.getUniformLocation(ditherProg, "uOn"), palette.line);
      gl.uniform3fv(gl.getUniformLocation(ditherProg, "uHot"), palette.pulse);
      gl.bindVertexArray(vaoEmpty);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.bindVertexArray(null);

    const submit = performance.now() - t0;
    sum.push(submit);
    if (sum.length > 60) sum.shift();
    stats.submitMs = sum.reduce((a, b) => a + b, 0) / sum.length;
    if (opts.measure) {
      gl.finish();
      stats.gpuMs = stats.gpuMs === null ? 0 : stats.gpuMs * 0.9 + (performance.now() - t0) * 0.1;
    }
    stats.frames++;
  }

  return {
    resize,
    frame,
    stats,
    get lost() {
      return lost;
    },
    dispose() {
      // The context itself stays with the canvas (a canvas hands back the same context for the
      // lifetime of the element, React strict mode and orientation changes both mount twice), so
      // only what this engine created is released.
      canvas.removeEventListener("webglcontextlost", onLost);
      for (const b of [quad, segBuf, nodeBuf]) gl.deleteBuffer(b);
      for (const v of [vaoSeg, vaoNode, vaoEmpty]) gl.deleteVertexArray(v);
      for (const p of [segProg, nodeProg, ditherProg]) if (p) gl.deleteProgram(p);
      if (tex) gl.deleteTexture(tex);
      if (fbo) gl.deleteFramebuffer(fbo);
    },
  };
}
