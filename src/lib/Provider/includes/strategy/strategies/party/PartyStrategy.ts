/*
    Стратегия для подсказок по организации (расширяет базовую BaseSuggestionStrategy).
*/

import type { ISuggestionsStrategy } from "@provider_strategy/types";
import type { AnyData, Suggestion, SuggestionsType } from "@/lib/types";

import { BaseSuggestionsStrategy } from "@provider_strategy/strategies/BaseSuggestionsStrategy";
import { matchByFields } from "@/helpers/matchers";
import { ADDRESS_STOPWORDS } from "@provider_strategy/strategies/address/data";
import { findMatches, getMatchesWithMaxLength, tokenize, WORD_DELIMITERS } from "@/helpers/text";
import { getDeepValue } from "@/helpers/object";
import { API_ENDPOINTS } from "@provider_api/api.constants";

const innPartsLengths: Record<string, number[]> = {
    LEGAL: [2, 2, 5, 1],
    INDIVIDUAL: [2, 2, 6, 2],
};

const chooseMatchedField = (
    matchedMain: ReturnType<typeof findMatches>,
    matchedAlt: ReturnType<typeof findMatches>
) => {
    const mainHasMatches = matchedMain.some((match) => match.matched);
    const altHasMatches = matchedAlt.some((match) => match.matched);

    return altHasMatches && !mainHasMatches ? matchedAlt : matchedMain;
};

export class PartyStrategy extends BaseSuggestionsStrategy implements ISuggestionsStrategy {
    constructor(type: SuggestionsType) {
        super(type);
        this.noSuggestionsHint = "Неизвестная организация";
        this.matchers = [
            matchByFields({
                value: null,
                "data.address.value": ADDRESS_STOPWORDS,
                "data.inn": null,
                "data.ogrn": null,
            }),
        ];

        this.urlSlug = "party";
        this.enrichmentEndpoint = API_ENDPOINTS.findById;
    }

    getEnrichmentParams(suggestion: Suggestion, params: AnyData) {
        return {
            ...params,
            count: 1,
            query: suggestion.data.hid,
        };
    }

    findQueryMatches(suggestion: Suggestion, query: string) {
        const tokens = tokenize(query, []);

        const matchedINN = this._getINNMatches(suggestion, tokens);
        const matchedOGRN = findMatches(getDeepValue(suggestion.data, "ogrn") || "", tokens);
        const matchedInnOGRN = matchedINN
            ? chooseMatchedField(matchedINN, matchedOGRN)
            : matchedOGRN;

        const matchedFIO = findMatches(
            getDeepValue(suggestion.data, "management.name") || "",
            tokens
        );
        const matchedAddress = this._getAddressMatches(suggestion, tokens);
        const matchedAddressOrFIO = matchedAddress
            ? {
                  full: chooseMatchedField(matchedAddress.full, matchedFIO),
                  short: chooseMatchedField(matchedAddress.short, matchedFIO),
              }
            : {
                  full: matchedFIO,
                  short: matchedFIO,
              };

        const matchedValue = findMatches(suggestion.value, tokens);
        const matchedLatinName = findMatches(
            getDeepValue(suggestion.data, "name.latin") || "",
            tokens
        );
        const matchedValueOrLatinName = chooseMatchedField(matchedValue, matchedLatinName);

        const mainMatches = {
            full: matchedValueOrLatinName,
            short: getMatchesWithMaxLength(matchedValueOrLatinName, 50),
        };

        const extraMatches = [
            {
                full: matchedInnOGRN,
                short: matchedInnOGRN,
            },
            matchedAddressOrFIO,
        ];

        return {
            main: mainMatches,
            extra: extraMatches,
        };
    }

    // формирует "мэтчи" из ИНН компании, проставляя groupEnd по маске в зависимости от типа организации
    private _getINNMatches(suggestion: Suggestion, tokens: string[]) {
        const inn = suggestion.data?.inn;
        if (!inn) return null;

        const innPartsLength = innPartsLengths[suggestion.data?.type];
        const innMatches = findMatches(inn, tokens);

        if (!innPartsLength) return innMatches;

        // "мэтчи", разбитые по 1 символу
        const splittedMatches = innMatches
            .map((match) =>
                match.text.split("").map((char) => ({
                    text: char,
                    rawText: char,
                    matched: match.matched,
                    groupEnd: false,
                }))
            )
            .flat();

        innPartsLength.forEach((part, i) => {
            let partLength = part;

            const totalTength = innPartsLength.slice(0, i).reduce((sum, len) => sum + len, 0);

            for (let j = totalTength; j < splittedMatches.length && partLength; j++) {
                if (partLength === 1) splittedMatches[j].groupEnd = true;
                partLength--;
            }
        });

        return splittedMatches.reduce(
            (arr, cur) => {
                const last = arr[arr.length - 1];

                if (!last || last.matched !== cur.matched || last.groupEnd) {
                    arr.push(cur);
                    return arr;
                }

                last.text += cur.text;
                last.groupEnd = cur.groupEnd;

                return arr;
            },
            [] as typeof splittedMatches
        );
    }

    // формирует "мэтчи" из адреса компании, включая укороченную версию
    private _getAddressMatches(suggestion: Suggestion, tokens: string[]) {
        const addressValue = suggestion.data?.address?.value || "";

        if (!addressValue) return null;

        const cleanedAddress = addressValue.replace(/^(\d{6}|Россия),\s+/i, "");

        // только первые 2 слова
        const shortAddress = cleanedAddress.replace(
            new RegExp(`^([^${WORD_DELIMITERS}]+[${WORD_DELIMITERS}]+[^${WORD_DELIMITERS}]+).*`),
            "$1"
        ) as string;

        return {
            full: findMatches(cleanedAddress, tokens, ADDRESS_STOPWORDS),
            short: [
                {
                    text: shortAddress,
                    rawText: shortAddress,
                    matched: false,
                },
            ],
        };
    }
}
