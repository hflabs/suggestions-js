import { vi } from "vitest";

export default () => {
    const mediaMock = {
        matches: false,
        addEventListener() {},
        removeEventListener() {},
    } as unknown as MediaQueryList;

    const mediaMockFn = vi.fn(() => mediaMock);
    window.matchMedia = mediaMockFn;

    const changeIsMobile = (value: boolean) =>
        mediaMockFn.mockReturnValue({
            ...mediaMock,
            matches: value,
        });

    return { changeIsMobile };
};
