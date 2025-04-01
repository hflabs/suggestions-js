/*
    Стратегия для подсказок по ФИО (расширяет базовую BaseSuggestionStrategy).
*/

import type { ISuggestionsStrategy, DataCompleteOptions } from "@provider_strategy/types";
import type { SuggestionsType } from "@/lib/types";

import { BaseSuggestionsStrategy } from "@provider_strategy/strategies/BaseSuggestionsStrategy";
import { matchByNormalizedQuery, matchByWords } from "@/helpers/matchers";
import { escapeRegExChars, WORD_DELIMITERS } from "@/helpers/text";

const valueStartsWith = (value: string, searchValue: string) =>
    new RegExp(`^${escapeRegExChars(searchValue)}([${WORD_DELIMITERS}]|$)`, "i").test(value);

export class NameStrategy extends BaseSuggestionsStrategy implements ISuggestionsStrategy {
    constructor(type: SuggestionsType) {
        super(type);
        this.noSuggestionsHint = "";
        this.matchers = [matchByNormalizedQuery(), matchByWords()];
        this.urlSlug = "fio";
        this.labelsDictionary = {
            surname: "фамилия",
            name: "имя",
            patronymic: "отчество",
        };
    }

    isDataComplete({ suggestion, params }: DataCompleteOptions) {
        let fields;

        if (Array.isArray(params?.parts)) {
            fields = params.parts.map((p) => p.toLowerCase());
        } else {
            fields = ["surname", "name"];

            if (
                suggestion.data.surname &&
                valueStartsWith(suggestion.value, suggestion.data.surname)
            ) {
                // если suggestion.value начинается с фамилии, отчество обязательно
                fields.push("patronymic");
            }
        }

        return fields.every((field) => Boolean(suggestion.data[field]));
    }
}
