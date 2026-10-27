// SPDX-License-Identifier: AGPL-3.0-only
/** The pill buttons of the public pages, written once. */

const pill =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold whitespace-nowrap select-none transition-[background-color,color,scale,box-shadow] duration-[var(--duration-quick)] ease-[var(--ease-out)] active:scale-[0.96] active:duration-[var(--duration-press)]";
export const pillLight = `${pill} bg-[#f6f5f1] text-[#161513] shadow-[inset_0_-1px_0_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.4),0_10px_30px_-10px_rgb(255_90_31/0.45)] [@media(hover:hover)]:hover:bg-white`;
/** The navbar's button: the same light pill, sized for a 56 high bar. */
export const pillSmall =
  "inline-flex h-9 [@media(pointer:coarse)]:h-11 items-center justify-center gap-1.5 rounded-full bg-[#f6f5f1] px-3.5 text-[14px] font-semibold whitespace-nowrap text-[#161513] select-none transition-[background-color,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] active:scale-[0.96] [@media(hover:hover)]:hover:bg-white";
export const pillGlass = `${pill} bg-white/[0.06] text-[#f6f5f1] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),inset_0_1px_0_rgb(255_255_255/0.1)] backdrop-blur-md [@media(hover:hover)]:hover:bg-white/[0.1]`;
