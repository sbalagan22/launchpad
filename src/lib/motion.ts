/** Shared motion tokens. Durations are in seconds for the motion library. */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const EASE_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";
export const DUR = { hover: 0.15, ui: 0.25, page: 0.4 } as const;
export const STAGGER = 0.04;

export const t = {
  hover: { duration: DUR.hover, ease: EASE },
  ui: { duration: DUR.ui, ease: EASE },
  page: { duration: DUR.page, ease: EASE },
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: t.page },
  exit: { opacity: 0, y: -6, transition: t.ui },
};

export const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: t.ui },
};

export const modalPanel = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: t.page },
  exit: { opacity: 0, scale: 0.98, transition: t.ui },
};

export const backdrop = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: t.ui },
  exit: { opacity: 0, transition: t.ui },
};

export const toastItem = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: t.ui },
  exit: { opacity: 0, x: 32, transition: t.hover },
};

/** Tween layout transition used for chip reflow and the nav indicator. */
export const layoutTransition = { type: "tween", duration: DUR.ui, ease: EASE } as const;
