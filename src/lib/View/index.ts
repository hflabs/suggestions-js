import { Provider } from "@provider/index";
import type { PLUGIN_OPTIONS } from "./types";

import { ContainerView } from "./elements/container/view";
import { InputView } from "./elements/input/view";
import { InputModel } from "./elements/input/model";
import { CLASSES, DEFAULT_MOBILE_WIDTH } from "./view.constants";
import { observeViewport } from "./helpers/observeViewport";

/**
 * Инициализирует подсказки на элементе
 */
export const init = (el: HTMLInputElement, options: PLUGIN_OPTIONS) => {
    const inputView = new InputView(el);
    const containerView = new ContainerView();
    el.after(containerView.wrapper);

    let isMobile = false;

    // отслеживать ширину экрана
    const setObserver = (mobileWidth: PLUGIN_OPTIONS["mobileWidth"]) =>
        observeViewport(mobileWidth ?? DEFAULT_MOBILE_WIDTH, (mobile: boolean) => {
            isMobile = mobile;
            containerView.wrapper.classList.toggle(CLASSES.wrapperMobile, mobile);
        });

    let disconnectObserver = setObserver(options.mobileWidth);

    const provider = new Provider(options, (query: string) => inputView.getValue() !== query);

    // подключить провайдера к элементу
    const inputModel = new InputModel(() => isMobile, {
        view: inputView,
        containerView,
        provider,
        options,
    });

    inputView.init(inputModel.getListeners());

    const mobileObserver = {
        disconnect: () => disconnectObserver(),
        reset: (mobileWidth: PLUGIN_OPTIONS["mobileWidth"]) => {
            disconnectObserver = setObserver(mobileWidth);
        },
    };

    return {
        provider,
        inputModel,
        mobileObserver,
        containerView,
        inputView,
    };
};

export type ActivePluginData = { isEnabled: true } & ReturnType<typeof init>;

export type PluginData =
    | ({ isEnabled: false } & Partial<ReturnType<typeof init>>)
    | ActivePluginData;
