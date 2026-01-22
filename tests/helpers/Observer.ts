// Мок для IntersectionObserver
// возвращает setIntersection метод для эмуляции видимости элемента

import { vi } from "vitest";

type Intersection = { intersectionRatio: number; isIntersecting: boolean }[];

type Callback = (intersectionData: Intersection) => void;

export default () => {
    const original = window.IntersectionObserver;

    window.IntersectionObserver = vi.fn((cb: Callback) => ({
        observe() {
            cb([
                {
                    intersectionRatio: 1,
                    isIntersecting: true,
                },
            ]);
        },
        unobserve() {},
        disconnect() {},
    })) as unknown as typeof window.IntersectionObserver;

    return {
        clear: () => {
            window.IntersectionObserver = original;
        },
    };
};
