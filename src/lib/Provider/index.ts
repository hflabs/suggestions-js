import type { AnyData, Suggestion } from "@/lib/types";
import { areSame, clone } from "@/helpers/object";

import type { ISuggestionsStrategy } from "@provider_strategy/types";
import type { HasQueryChanged, PROVIDER_OPTIONS } from "./types";
import type { MaybeEnrichedSuggestion } from "./includes/suggestions/includes/cache";

import { getStrategy } from "./includes/strategy";
import { getSuggestionsService, type SuggestionsService } from "./includes/suggestions";
import {
    DEFAULT_AUTOSELECT_FIRST,
    HINT_DEFAULT,
    MIN_CHARS_DEFAULT,
    DEFAULT_ENRICHMENT_ENABLED,
    DEFAULT_COUNT,
} from "./provider.constants";
import { getVerifiedSuggestion } from "./includes/suggestions/helpers";

// Основной модуль виджета, инкапсулирующий бизнес-логику
export class Provider {
    private _options: PROVIDER_OPTIONS;

    private _strategy: ISuggestionsStrategy;
    private _suggestionsService: SuggestionsService;

    private _suggestionsWithState: MaybeEnrichedSuggestion[];

    chosenSuggestion: Suggestion | null;
    chosenSuggestionIndex: number;

    suggestionsFetchPromise: ReturnType<typeof this._makeSuggestionsRequest> | Promise<void>;

    abortSuggestionsRequest: () => void;
    clearCache: () => void;
    getStatus: SuggestionsService["getStatus"];

    constructor(options: PROVIDER_OPTIONS, hasQueryChanged: HasQueryChanged) {
        this._options = options;
        this._strategy = getStrategy(options.type);
        this._suggestionsService = getSuggestionsService(options, this._strategy, hasQueryChanged);

        this._suggestionsWithState = [];
        this.chosenSuggestion = null;
        this.chosenSuggestionIndex = -1;

        this.suggestionsFetchPromise = Promise.resolve();
        this.abortSuggestionsRequest = this._suggestionsService.abortSuggestionsRequest.bind(
            this._suggestionsService
        );

        this.clearCache = this._suggestionsService.clearCache.bind(this._suggestionsService);
        this.getStatus = this._suggestionsService.getStatus.bind(this._suggestionsService);
    }

    /**
     * Публичный геттер для получения текущего списка подсказок
     */
    getSuggestions<T = AnyData>() {
        return this._suggestionsWithState.map((s) => s.suggestion) as Suggestion<T>[];
    }

    /**
     * Метод для получения данных для рендеринга по текущим подсказкам, без их перезапроса/обновления
     */
    getSuggestionsData(query: string) {
        this._autoSelectFirst();

        return this.getSuggestions().map((suggestion) =>
            this._prepareSuggestionData(suggestion, query)
        );
    }

    /**
     * Публичный геттер для получения текущей выбранной подсказки
     */
    getSelection<T = AnyData>() {
        return this.chosenSuggestion as Suggestion<T> | null;
    }

    /**
     * Публичный метод для сброса состояния
     * (кэш запросов, список подсказок, выбранная подсказка)
     */
    clear() {
        this._suggestionsService.clearCache();
        this._suggestionsWithState = [];
        this.chosenSuggestion = null;
        this.chosenSuggestionIndex = -1;
    }

    /**
     * Метод для получения поясняющего текста перед списком подсказок
     */
    getSuggestionsHint() {
        const { hint } = this._options;
        return hint === false || typeof hint === "string" ? hint : HINT_DEFAULT;
    }

    /**
     * Метод для получения поясняющего текста при отсутствии подсказок по запросу
     */
    getNoSuggestionsHint() {
        const hint = this._options.noSuggestionsHint;
        return hint === false || typeof hint === "string" ? hint : this._strategy.noSuggestionsHint;
    }

    /**
     * Метод для обновления текущий опции виджета.
     * Обновляет стратегию на основе новых опций и обновляет все зависимые компоненты
     */
    updateOptions(newOptions: PROVIDER_OPTIONS) {
        this._options = newOptions;
        this._strategy = getStrategy(newOptions.type);

        this._suggestionsService.updateOptions(newOptions, this._strategy);
    }

    /**
     * Метод для обновления индекса выбранной подсказки
     */
    updateChosenSuggestionIndex(newIndex: number) {
        this.chosenSuggestionIndex = newIndex;
    }

    /**
     * Обнуляет выбранную подсказку и ее индекс
     */
    invalidateChosenSuggestion() {
        this.chosenSuggestionIndex = -1;
        this.chosenSuggestion = null;
    }

    /**
     * Метод для получения подсказок по запросу query.
     * Возвращает статус fetched и список данных для рендеринга каждой подсказки.
     */
    async fetchSuggestions(query: string) {
        this.suggestionsFetchPromise = this._makeSuggestionsRequest(query);

        return await this.suggestionsFetchPromise;
    }

    /**
     * Метод для выбора активной подсказки по индексу.
     * Находит подсказку по индексу в текущем списке, обогащает через API и сохраняет в качестве активной.
     *
     * Возвращает:
     * - статус selected
     * - areSuggestionsSame - признак того, что была выбрана новая подсказка
     * - suggestionValue - форматированное значение выбранной подсказки
     * - isFinal - можно ли продолжать уточнять запрос
     */
    async selectSuggestionByIndex(index: number, query: string, shouldEnrich = true) {
        const suggestion = this._suggestionsWithState[index];

        if (!suggestion) return { selected: false as const };

        let enrichedSuggestion = null;
        const enrichmentEnabled = this._options.enrichmentEnabled ?? DEFAULT_ENRICHMENT_ENABLED;

        const params = this._getParams(query);

        if (enrichmentEnabled && shouldEnrich) {
            const { enrichSuggestion } = this._suggestionsService;
            enrichedSuggestion = await enrichSuggestion(suggestion, params, query);
        }

        const suggestionToSelect = {
            suggestion: enrichedSuggestion || suggestion.suggestion,
            enriched: Boolean(enrichedSuggestion),
        };

        const suggestionValue = this._getSuggestionValue(suggestionToSelect.suggestion);

        const areSuggestionsSame = areSame(suggestionToSelect.suggestion, this.chosenSuggestion);

        this.chosenSuggestion = suggestionToSelect.suggestion;
        this._suggestionsWithState[index] = suggestionToSelect;

        this.chosenSuggestionIndex = index;

        const isFinal = this._strategy.isDataComplete({
            suggestion: suggestionToSelect.suggestion,
            params,
        });

        return {
            selected: true as const,
            suggestionValue,
            areSuggestionsSame,
            isFinal,
        };
    }

    /**
     * Метод для выбора активной подсказки, подходящей под переданный запрос query.
     *
     * Находит индекс подходящей подсказки для текущего query и выбирает подсказку активной.
     *
     * Возвращает:
     * - статус selected
     * - areSuggestionsSame - признак того, что была выбрана новая подсказка
     * - suggestionValue - форматированное значение выбранной подсказки
     * - isFinal - можно ли продолжать уточнять запрос
     */
    async selectMatchingSuggestion(query: string, shouldEnrich = true) {
        const indexToSelect = this._findMatchingSuggestionIndex(query);

        return await this.selectSuggestionByIndex(indexToSelect, query, shouldEnrich);
    }

    /**
     * Позволяет вручную установить текущую активную подсказку.
     * Не сохраняет подсказку, если suggestion.data - не объект.
     *
     * Заменяет текущий список подсказок.
     * Возвращает suggestionValue - форматированное значение подсказки
     *
     */
    setSuggestion(suggestion: Suggestion) {
        if (!this._validateSuggestion(suggestion)) return;

        const verified = getVerifiedSuggestion(suggestion);

        this._suggestionsService.abortSuggestionsRequest();

        const suggestionValue = this._getSuggestionValue(verified);
        verified.value = suggestionValue;

        this.chosenSuggestion = verified;
        this.chosenSuggestionIndex = 0;
        this._suggestionsWithState = [
            {
                suggestion: verified,
                enriched: false,
            },
        ];

        return { suggestionValue };
    }

    /**
     * По запросу query получает 1 обогащенную подсказку и выбирает ее активной.
     */
    async fixData(query: string) {
        const params = this._getParams(query);
        const suggestionsWithState = await this._suggestionsService.getSuggestions(query, {
            ...params,
            count: 1,
        });

        const suggestionToSelect = suggestionsWithState?.[0];

        if (!suggestionToSelect) return { selected: false as const };

        const suggestionValue = this._getSuggestionValue(suggestionToSelect.suggestion);
        suggestionToSelect.suggestion.value = suggestionValue;

        const areSuggestionsSame = areSame(suggestionToSelect.suggestion, this.chosenSuggestion);

        this.chosenSuggestion = suggestionToSelect.suggestion;
        this._suggestionsWithState = [suggestionToSelect];

        const isFinal = this._strategy.isDataComplete({
            suggestion: suggestionToSelect.suggestion,
            params,
        });

        return {
            selected: true as const,
            suggestionValue,
            areSuggestionsSame,
            isFinal,
        };
    }

    /**
     * Метод для проверки, можно ли с переданным query сделать запрос к Подсказкам
     */
    canProcessQuery(query: string) {
        return (
            query.length >= (this._options.minChars || MIN_CHARS_DEFAULT) &&
            this._strategy.isQueryRequestable(query, this._options)
        );
    }

    /**
     * Внутренний метод. Получает список подсказок по query.
     * Сохраняет список в состояние "как есть", возвращает форматированные для рендеринга данные
     */
    private async _makeSuggestionsRequest(query: string) {
        const suggestionsWithState = await this._suggestionsService.getSuggestions(
            query,
            this._getParams(query)
        );

        if (!suggestionsWithState) return { fetched: false as const };

        this._suggestionsWithState = suggestionsWithState.map(clone);

        return {
            fetched: true as const,
            suggestions: this.getSuggestionsData(query),
        };
    }

    private _autoSelectFirst() {
        if (this._options.autoSelectFirst ?? DEFAULT_AUTOSELECT_FIRST) {
            this.chosenSuggestionIndex = 0;
        }
    }

    /**
     * Внутренний метод. Возвращает значение suggestion.value с учетом коллбэка formatSelected
     */
    private _getSuggestionValue(suggestion: Suggestion) {
        const formattedValue =
            typeof this._options.formatSelected === "function"
                ? this._options.formatSelected(suggestion)
                : this._strategy.formatSelected(suggestion);

        return typeof formattedValue === "string" ? formattedValue : suggestion.value;
    }

    /**
     * Внутренний метод. Находит индекс подсказки, подходящей под переданный query.
     * Если есть индекс активной сейчас подсказки - вернет его.
     * Иначе - найдет подходящую из текущего списка подсказок
     */
    private _findMatchingSuggestionIndex(query: string) {
        if (this.chosenSuggestionIndex !== -1) return this.chosenSuggestionIndex;
        if (!query) return -1;

        let index = -1;

        this._strategy.matchers.some((matcher) => {
            index = matcher(query, this.getSuggestions());
            return index !== -1;
        });

        return index;
    }

    /**
     * Внутренний метод. Возвращает данные для рендера переданной подсказки.
     *
     * Может вернуть или formattedResult (готовый для вывода текст),
     * или matches - разбитый на токены текст подсказки.
     *
     * Дополнительно возвращается поле labels - список лэйблов для выделения подсказок с одинаковым текстом
     */
    private _prepareSuggestionData(suggestion: Suggestion, query: string) {
        const labels = this._strategy.getSuggestionLabels(suggestion, this.getSuggestions());

        if (typeof this._options.formatResult === "function") {
            const formattedResult = this._options.formatResult(
                suggestion.value,
                query,
                suggestion,
                {
                    unformattableTokens: this._strategy.unformattableTokens,
                }
            );

            return {
                formattedResult,
                matches: null,
                labels,
                suggestion,
            };
        }

        let suggestionToFormat = suggestion;
        if (typeof this._options.beforeFormat === "function") {
            const customSuggestion = this._options.beforeFormat(clone(suggestion), query);
            if (this._validateSuggestion(customSuggestion)) {
                suggestionToFormat = getVerifiedSuggestion(customSuggestion);
            }
        }

        const matches = this._strategy.findQueryMatches(suggestionToFormat, query);

        return {
            formattedResult: null,
            matches,
            labels,
            suggestion,
        };
    }

    private _validateSuggestion(suggestion: unknown) {
        try {
            if (!suggestion || typeof suggestion !== "object") return false;
            if (!("data" in suggestion) || suggestion.data === null) return false;
            return typeof suggestion.data === "object";
        } catch (_) {
            return false;
        }
    }

    private _getParams(query: string) {
        const optionsParams =
            typeof this._options.params === "function"
                ? this._options.params(query)
                : this._options.params;

        return {
            query,
            count: DEFAULT_COUNT,
            ...(optionsParams || {}),
        };
    }
}

export type SuggestionData = ReturnType<InstanceType<typeof Provider>["_prepareSuggestionData"]>;
export type SuggestionHint = ReturnType<InstanceType<typeof Provider>["getSuggestionsHint"]>;
export type NoSuggestionsHint = ReturnType<InstanceType<typeof Provider>["getNoSuggestionsHint"]>;
