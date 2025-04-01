import { CLASSES } from "@/lib/View/view.constants";

export default () => {
    const el = document.querySelector(`.${CLASSES.container}`);
    return el ? getComputedStyle(el).display !== "none" : false;
};
