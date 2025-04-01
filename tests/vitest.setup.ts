import createFetchMock from "vitest-fetch-mock";
import { vi } from "vitest";
import wait from "./helpers/wait";
import useObserver from "./helpers/Observer";
import useMediaQuery from "./helpers/MediaQuery";
import createInput from "./helpers/Input";
import useBrowser from "./helpers/useBrowser";

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

global.fetchMocker = fetchMocker;
global.wait = wait;

global.useBrowser = useBrowser;

// jsdom setup
if (typeof window !== "undefined") {
    const { changeIsMobile } = useMediaQuery();
    useObserver();

    global.changeIsMobile = changeIsMobile;
    global.createInput = createInput;
}
