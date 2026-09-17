(() => {
  if (!window.matchMedia("(max-width: 767px)").matches) return;

  const root = document.documentElement;
  const body = document.body;
  const overlaySelector = ".mct-gallery-overlay, .mct-lightbox, .mct-custom-lightbox:not([hidden])";
  let frame = 0;

  const setImportant = (element, property, value) => {
    if (
      element.style.getPropertyValue(property) === value &&
      element.style.getPropertyPriority(property) === "important"
    ) return;
    element.style.setProperty(property, value, "important");
  };

  const unlockScroll = () => {
    if (document.querySelector(overlaySelector)) return;

    setImportant(root, "height", "auto");
    setImportant(root, "min-height", "100%");
    setImportant(root, "overflow-x", "hidden");
    setImportant(root, "overflow-y", "auto");
    setImportant(root, "overscroll-behavior-y", "auto");
    setImportant(root, "touch-action", "pan-y");

    setImportant(body, "height", "auto");
    setImportant(body, "min-height", "100%");
    setImportant(body, "overflow-x", "hidden");
    setImportant(body, "overflow-y", "visible");
    setImportant(body, "overscroll-behavior-y", "auto");
    setImportant(body, "touch-action", "pan-y");
  };

  const scheduleUnlock = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      unlockScroll();
    });
  };

  unlockScroll();
  [80, 350, 900, 1800, 2800, 4500, 7000].forEach((delay) => {
    window.setTimeout(unlockScroll, delay);
  });

  const styleObserver = new MutationObserver(scheduleUnlock);
  styleObserver.observe(root, { attributes: true, attributeFilter: ["style", "class"] });
  styleObserver.observe(body, { attributes: true, attributeFilter: ["style", "class"] });

  const domObserver = new MutationObserver(scheduleUnlock);
  domObserver.observe(body, { childList: true, subtree: true });

  window.addEventListener("pageshow", scheduleUnlock);
  window.addEventListener("load", scheduleUnlock);
  window.addEventListener("resize", scheduleUnlock, { passive: true });
  window.addEventListener("orientationchange", scheduleUnlock, { passive: true });
  document.addEventListener("visibilitychange", scheduleUnlock);
  document.addEventListener("touchstart", scheduleUnlock, { passive: true });
})();
