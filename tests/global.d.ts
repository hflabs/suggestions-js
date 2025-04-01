/* eslint-disable no-var */
/* eslint-disable vars-on-top */
import createFetchMock from "vitest-fetch-mock";
import * as Module from "@/index";
import waitFn from "./helpers/wait";
import useMediaQuery from "./helpers/MediaQuery";
import createInputFn from "./helpers/Input";
import useBrowserFn from "./helpers/useBrowser";

declare global {
    var fetchMocker: ReturnType<typeof createFetchMock>,
        wait: typeof waitFn,
        changeIsMobile: ReturnType<typeof useMediaQuery>["changeIsMobile"],
        createInput: typeof createInputFn,
        useBrowser: typeof useBrowserFn,
        Dadata: typeof Module,
        inputEl: HTMLInputElement,
        instance: ReturnType<(typeof Module)["createSuggestions"]>;
}
