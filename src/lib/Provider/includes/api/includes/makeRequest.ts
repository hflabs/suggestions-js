import type { getFetchParams } from "./getParams";

type FetchParams = ReturnType<getFetchParams>;

class ApiStatusError extends Error {}

const constructErrorData = (error: unknown, controller: AbortController) => {
    const abortedReason = controller.signal.aborted ? controller.signal.reason || "aborted" : "";
    const syntaxReason = error instanceof SyntaxError ? "parsererror" : "";

    return {
        statusText: error instanceof ApiStatusError ? error.message : "",
        code: abortedReason || syntaxReason || "error",
    };
};

const getBodyIfAllowed = (method: FetchParams["method"], body?: Record<string, unknown>) => {
    let serializedBody;

    try {
        serializedBody = JSON.stringify(body);
    } catch (_error) {
        serializedBody = null;
    }

    return serializedBody && method !== "GET" ? { body: serializedBody } : {};
};

const setControllerTimeout = (
    timeout: FetchParams["params"]["timeout"],
    controller: FetchParams["params"]["controller"]
) => {
    if (timeout) {
        setTimeout(() => {
            controller.abort("timeout");
        }, timeout);
    }
};

/**
 * Создает fetch-запрос с указанными параметрами.
 * Сериализует body, добавляет signal с отменой по таймауту из параметров.
 *
 * Возвращает:
 * - data - json parsed ответ от сервера или null при наличии ошибки
 * - error - statusText (HTTP statusText) и code (abort reason или 'error') или null при успехе
 * - isAborted - controller.signal.aborted
 * - res - объект Response
 */
export const makeRequest = async <R>(
    url: FetchParams["url"],
    method: FetchParams["method"],
    params: FetchParams["params"],
    body?: Record<string, unknown>
) => {
    const bodyOption = getBodyIfAllowed(method, body);
    setControllerTimeout(params.timeout, params.controller);

    let res;

    try {
        res = await fetch(url, {
            method,
            headers: params.headers,
            signal: params.controller.signal,
            ...bodyOption,
        });

        if (!res.ok) throw new ApiStatusError(res.statusText);
        const json = await res.json();

        return {
            data: json as R,
            error: null,
            isAborted: false,
            res,
        };
    } catch (err) {
        return {
            data: null,
            error: constructErrorData(err, params.controller),
            isAborted: params.controller.signal.aborted,
            res,
        };
    }
};

export type makeRequest<R> = typeof makeRequest<R>;
