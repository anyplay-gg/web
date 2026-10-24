// SPDX-License-Identifier: AGPL-3.0-only
// Colour maths for the ramp generator and the contrast guard. One place, so the number that picks
// a colour and the number that checks it can never come from two formulas.
//
// - OKLCH <-> sRGB follows Bjorn Ottosson's reference (public domain).
// - Gamut mapping reduces chroma at constant lightness and hue until the colour fits sRGB, which
//   keeps the lightness the ramp was designed for.
// - WCAG 2.2 contrast is the 2.x relative-luminance ratio.
// - APCA is the W3 0.0.98G-4g model (Myndex), the lightness-contrast value Lc.

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function oklchToLinearRgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

/** OKLCH to an sRGB triple in 0..1, chroma reduced until it fits. Returns the chroma used. */
export function oklchToSrgb(L, C, h) {
  let c = C;
  let lin = oklchToLinearRgb(L, c, h);
  if (!inGamut(lin)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 28; i++) {
      c = (lo + hi) / 2;
      lin = oklchToLinearRgb(L, c, h);
      if (inGamut(lin)) lo = c;
      else hi = c;
    }
    c = lo;
    lin = oklchToLinearRgb(L, c, h);
  }
  return { rgb: lin.map((v) => Math.min(1, Math.max(0, toGamma(Math.min(1, Math.max(0, v)))))), chroma: c };
}

export function srgbToHex(rgb) {
  return (
    "#" +
    rgb
      .map((v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export function hexToSrgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}

export function srgbToOklch(rgb) {
  const [R, G, B] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}

export const luminance = ([r, g, b]) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

export function wcag(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** APCA Lc (absolute value; polarity is implied by which colour is lighter). */
export function apca(fg, bg) {
  const y = ([r, g, b]) => {
    const v = 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4;
    return v < 0.022 ? v + (0.022 - v) ** 1.414 : v;
  };
  const yt = y(fg);
  const yb = y(bg);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  let lc;
  if (yb > yt) {
    const s = (yb ** 0.56 - yt ** 0.57) * 1.14;
    lc = s < 0.1 ? 0 : (s - 0.027) * 100;
  } else {
    const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
    lc = s > -0.1 ? 0 : (s + 0.027) * 100;
  }
  return Math.abs(lc);
}

/**
 * Finds the lightness at which `L,C,h` reaches `target` WCAG contrast against `bg`, moving away from
 * the background (lighter on a dark background, darker on a light one).
 */
export function solveLightness(C, h, bg, target, lc = 0) {
  const dark = luminance(bg) < 0.4;
  const pass = (L) => {
    const { rgb } = oklchToSrgb(L, C, h);
    return wcag(rgb, bg) >= target && apca(rgb, bg) >= lc;
  };
  let lo = dark ? 0.3 : 0.0;
  let hi = dark ? 1.0 : 0.75;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const ok = pass(mid);
    if (dark) {
      if (ok) hi = mid;
      else lo = mid;
    } else if (ok) lo = mid;
    else hi = mid;
  }
  return dark ? hi : lo;
}
