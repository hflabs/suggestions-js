/**
 * Предоставляет промис, который выполняется по таймеру с возможностью
 * сделать reject или resolve вручную.
 *
 * Промис всегда в состоянии "resolve", но с разными значениями, чтобы избежать выбрасывания ошибки
 */
export const usePromisifiedTimer = () => {
    let resolvePromise: (value: "rejected" | "resolved") => void;

    let promise: Promise<"rejected" | "resolved"> = new Promise((r) => {
        resolvePromise = r;
        r("rejected");
    });

    let timerID: ReturnType<typeof setTimeout> | undefined;

    const reject = () => {
        resolvePromise("rejected");
    };

    const resolve = () => {
        resolvePromise("resolved");
        return promise;
    };

    const startTimer = (timeout: number | undefined) => {
        promise = new Promise((r) => {
            resolvePromise = r;

            if (!timeout) {
                r("resolved");
                return;
            }

            timerID = setTimeout(() => r("resolved"), timeout);
        });

        return promise;
    };

    const clearTimer = () => {
        clearTimeout(timerID);
    };

    return {
        getPromise: () => promise,
        reject,
        resolve,
        startTimer,
        clearTimer,
    };
};

export type PromisifiedTimer = ReturnType<typeof usePromisifiedTimer>;
