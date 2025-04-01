import type { getFetchParams } from "./getParams";

import { makeRequest } from "./makeRequest";

type FetchParams = ReturnType<getFetchParams>;

/**
 * Обертка для выполнения запросов с отменой предыдущего.
 *
 * Возвращает функцию makeRequest, при каждом ее вызове отменяется предыдущий.
 */
export const useDebouncedRequest = <T>() => {
    let currentRequestController: AbortController | null;

    return async (
        url: FetchParams["url"],
        method: FetchParams["method"],
        params: FetchParams["params"],
        body?: Record<string, unknown>
    ) => {
        if (currentRequestController) {
            currentRequestController.abort();
        }

        currentRequestController = params.controller;

        const result = await makeRequest<T>(url, method, params, body);
        currentRequestController = null;

        return result;
    };
};
