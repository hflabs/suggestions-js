import type { ISuggestionsStrategy } from "@provider_strategy/types";
import type { SUGGEST_OPTIONS } from "@/lib/Provider/includes/suggestions/types";

import { makeRequest, getFetchParams } from "@provider_api/index";
import { API_ENDPOINTS } from "@/lib/Provider/includes/api/api.constants";
import { PLAN_HEADER_NAME } from "../suggestions.constants";

interface Cache {
    [K: string]: {
        request: ReturnType<typeof makeRequest>;
        result?: { planName: string };
    };
}

const cache: Cache = {};

/**
 * Провайдер для получения данных о статусе сервиса для указанного клиентского токена.
 * Запрашивает данные по эндпоинту API_ENDPOINTS.status.
 *
 * Если запрос завершился ошибкой или в ответе search != true, вызывает коллбэк onSearchError.
 * Иначе при успехе сохраняет ответ сервера + берет название плана из хэдера PLAN_HEADER_NAME.
 *
 * Кэширует все запросы и их ответы в globalStatusRequestsCache (глобально для всех инстансов).
 * Вызывает коллбэк onSearchError при каждом вызове (даже если запрос есть в кэше),
 * сам запрос не повторяется если присутсвует в кэше.
 *
 * Предоставляет методы:
 * - updateOptions - обновить опции. Перезапрашивает статус с новыми опциями
 * - getStatus - получить результирующий объект статуса и название плана.
 */
export class StatusProvider {
    private _options: SUGGEST_OPTIONS;
    private _strategy: ISuggestionsStrategy;

    constructor(options: SUGGEST_OPTIONS, strategy: ISuggestionsStrategy) {
        this._options = options;
        this._strategy = strategy;
        this._fetchStatus();
    }

    getStatus() {
        return cache[this._statusCacheKey]?.result;
    }

    updateOptions(newOptions: SUGGEST_OPTIONS, newStrategy: ISuggestionsStrategy) {
        this._options = newOptions;
        this._strategy = newStrategy;
        this._fetchStatus();
    }

    private async _fetchStatus() {
        if (cache[this._statusCacheKey]) {
            const cached = await cache[this._statusCacheKey].request;

            if (!cached.error || typeof this._options.onSearchError !== "function") {
                return;
            }

            this._options.onSearchError(null, cached.res, "error", "");
            return;
        }

        const request = this._createRequest();
        cache[this._statusCacheKey] = { request };

        const { data, error, res } = await request;

        if (error || !data.search) {
            if (typeof this._options.onSearchError === "function") {
                this._options.onSearchError(null, res, "error", "");
            }
            return;
        }

        cache[this._statusCacheKey].result = { planName: res.headers.get(PLAN_HEADER_NAME) || "" };
    }

    private get _statusCacheKey() {
        return this._options.type + (this._options.token || "").trim();
    }

    private _createRequest() {
        const { url, method, params } = getFetchParams(
            this._options,
            API_ENDPOINTS.status,
            this._strategy.urlSlug
        );

        return makeRequest<{ search: boolean }>(url, method, params);
    }
}
