import type { API_OPTIONS } from "@provider_api/types";

import {
    API_ENDPOINTS,
    BASE_URL,
    DEFAULT_TIMEOUT,
    API_ENDPOINTS_OPTIONS,
} from "@/lib/Provider/includes/api/api.constants";
import { VERSION } from "@/version";

export type Endpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];

/**
 * Конструирует финальный url и опции для fetch-запроса.
 * Добавляет AbortController и отдает значение таймаута для его отмены
 */
export const getFetchParams = (options: API_OPTIONS, endpoint: Endpoint, slug?: string) => {
    const endpointOptions = API_ENDPOINTS_OPTIONS[endpoint];

    let fullUrl;

    if (options.url) {
        // полный url из опций
        fullUrl = options.url;
    } else {
        // базовый url из опций или дефолтный BASE_URL, без "/" на конце
        const serviseUrl = (options.serviceUrl || BASE_URL).replace(/\/$/, "");

        // полный url с endpoint и конкретным типом
        fullUrl =
            endpointOptions.useSlug && slug
                ? `${serviseUrl}/${endpoint}/${slug}`
                : `${serviseUrl}/${endpoint}`;
    }

    const userHeaders = typeof options.headers === "function" ? options.headers() : options.headers;

    const headers: Record<string, string> = {
        ...(userHeaders || {}),
        "X-Version": VERSION,
        "Content-Type": "application/json;charset=utf-8",
    };

    // токена может не быть при использовании коробочной версии
    if (options.token) headers.Authorization = `Token ${options.token}`;
    if (options.partner) headers["X-Partner"] = options.partner;

    const controller = new AbortController();

    return {
        url: fullUrl,
        method: endpointOptions.method,
        params: {
            headers,
            controller,
            timeout: options.timeout ?? DEFAULT_TIMEOUT,
        },
    };
};

export type getFetchParams = typeof getFetchParams;
