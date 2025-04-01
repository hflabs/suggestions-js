export default (index: number) => {
    const el = document.querySelector(`[data-index="${index}"]`) as HTMLElement;
    if (el) el.click();
};
