export const scrollToTop = (el: HTMLElement): void => {
  let scrollUpwardNeeded = el.getBoundingClientRect().top;
  let parent: HTMLElement | null = el.parentElement;

  while (scrollUpwardNeeded && parent) {
    const scrollUpwardAvailable =
      parent.tagName === "BODY" || parent.tagName === "HTML"
        ? parent.scrollHeight - parent.clientHeight
        : getComputedStyle(parent).overflowY !== "visible"
        ? parent.scrollHeight - parent.offsetHeight
        : 0;

    if (scrollUpwardAvailable) {
      const scrollUpwardApplied = Math.min(
        scrollUpwardAvailable,
        scrollUpwardNeeded
      );

      parent.scrollTop += scrollUpwardApplied;
      scrollUpwardNeeded -= scrollUpwardApplied;
    }

    parent = parent.parentElement;
  }
};
