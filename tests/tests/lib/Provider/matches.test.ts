import { describe, test, expect, afterEach, vi } from "vitest";

import { Provider } from "@/lib/Provider/index";
import type { PROVIDER_OPTIONS } from "@/lib/Provider/types";
import type { SuggestionsMatches } from "@/lib/types";

const getProvider = (options: Partial<PROVIDER_OPTIONS> = {}) =>
    new Provider(
        {
            type: options.type || "name",
            ...options,
        },
        () => false
    );

const concatMatches = (matches: SuggestionsMatches | null | undefined) => {
    if (!matches) return "";

    const prepareChunk = (chunk: SuggestionsMatches["main"]["full"][number]) => {
        const endPart = chunk.groupEnd ? '<span class="delimiter"></span>' : "";
        return chunk.matched
            ? `<strong>${chunk.text}</strong>${endPart}`
            : `${chunk.text}${endPart}`;
    };

    const mainFull = matches.main.full.reduce((acc, cur) => acc + prepareChunk(cur), "");
    const mainShort = matches.main.short?.reduce((acc, cur) => acc + prepareChunk(cur), "") || "";

    const extraFull = matches.extra
        ?.map((chunks) => chunks.full.reduce((acc, cur) => acc + prepareChunk(cur), ""))
        .filter(Boolean);

    const extraShort = matches.extra
        ?.map((chunks) => chunks.short?.reduce((acc, cur) => acc + prepareChunk(cur), ""))
        .filter(Boolean);

    return `${mainFull} ${mainShort} ${extraFull?.join("")} ${extraShort?.join("")}`;
};

describe("Highlight suggestions matches", () => {
    afterEach(() => {
        global.fetchMocker.resetMocks();
    });

    const testData = [
        {
            name: "should highlight search phrase, in the beginning of word",
            options: {},
            query: "japa",
            suggestions: ["Japaneese lives in Japan and love nonjapaneese"],
            match: "<strong>Japa</strong>neese lives in <strong>Japa</strong>n and love nonjapaneese",
        },
        {
            name: "should highlight search phrase, in the middle of word, if surrounded by delimiters",
            options: {},
            query: "japa",
            suggestions: ["Japaneese and non-japaneese"],
            match: "<strong>Japa</strong>neese and non-<strong>japa</strong>neese",
        },
        {
            name: "should highlight search phrase with delimiter in the middle",
            options: {},
            query: "санкт-петер",
            suggestions: ["г Санкт-Петербург"],
            match: "г <strong>Санкт-Петер</strong>бург",
        },
        {
            name: "should highlight search phrase with delimiter in the middle, example 2",
            options: {},
            query: "на-дон",
            suggestions: ["Ростовская обл, г Ростов-на-Дону"],
            match: "Ростов-<strong>на-Дон</strong>у",
        },
        {
            name: "should highlight words of search phrase within complex word",
            options: {},
            query: "ростов-на дон",
            suggestions: ["Ростовская обл, г Ростов-на-Дону"],
            match: "<strong>Ростов-на</strong>-<strong>Дон</strong>у",
        },
        {
            name: "should highlight words of search phrase within complex word, example 2",
            options: { type: "party" },
            query: "альфа банк",
            suggestions: ["ОАО АЛЬФА-БАНК"],
            match: "ОАО <strong>АЛЬФА</strong>-<strong>БАНК</strong>",
        },
        {
            name: "should not use object type for highlight if there are matching name",
            options: { type: "address" },
            query: "Приморский край, Партизанский р-н нико",
            suggestions: ["Приморский край, Партизанский р-н, поселок Николаевка"],
            match: "<strong>Нико</strong>лаевка",
        },
        {
            name: "should highlight search phrase in quotes",
            options: { type: "party" },
            query: "фирма",
            suggestions: ['ООО "Фирма"'],
            match: "ООО &quot;<strong>Фирма</strong>&quot;",
        },
        {
            name: "should highlight names regardless of parts order",
            options: { params: { parts: ["NAME", "PATRONYMIC", "SURNAME"] } },
            query: "Петр Иванович Пе",
            suggestions: ["Петров Петр Иванович"],
            match: "<strong>Петр</strong>ов <strong>Петр</strong> <strong>Иванович</strong>",
        },
        {
            name: "should highlight address in parties, ignoring address components types",
            options: { type: "party" },
            query: "КРА",
            suggestions: [
                {
                    value: 'ООО "Красава"',
                    data: {
                        address: {
                            value: "350056 Россия, Краснодарский край, г Краснодар, п Индустриальный, ул Светлая, д 3",
                            data: null,
                        },
                    },
                },
            ],
            match: ["<strong>Кра</strong>снодарский", "г <strong>Кра</strong>снодар", "край"],
            noMatch: ["<strong>кра</strong>й"],
        },
        {
            name: "should highlight INN in parties (full match)",
            options: { type: "party" },
            query: "5403233085",
            suggestions: [
                {
                    value: "ЗАО Ромашка",
                    data: {
                        address: {
                            value: "Новосибирская",
                            data: null,
                        },
                        inn: "5403233085",
                        type: "LEGAL",
                    },
                },
            ],
            match: "<strong>54 03 23308 5</strong>".replace(
                / /g,
                '</strong><span class="delimiter"></span><strong>'
            ),
        },
        {
            name: "should highlight INN in parties (partial match)",
            options: { type: "party" },
            query: "540323",
            suggestions: [
                {
                    value: "ЗАО Ромашка",
                    data: {
                        address: {
                            value: "Новосибирская",
                            data: null,
                        },
                        inn: "5403233085",
                        type: "LEGAL",
                    },
                },
            ],
            match: [
                "<strong>54 03 23</strong>".replace(
                    / /g,
                    '</strong><span class="delimiter"></span><strong>'
                ),
                "308 5".replace(/ /g, '<span class="delimiter"></span>'),
            ],
        },
        {
            name: "should escape html entries",
            options: { type: "party" },
            query: "ЗАО &LT",
            suggestions: [
                {
                    value: "ЗАО &LT <b>bold</b>",
                    data: {},
                },
            ],
            match: "<strong>ЗАО</strong> <strong>&amp;LT</strong> &lt;b&gt;bold&lt;&#x2F;b&gt;",
        },
        {
            name: "should drop the end of text if `maxLength` option specified",
            options: { type: "party" },
            query: "мфюа калмыц",
            suggestions: [
                {
                    value: 'Филиал КАЛМЫЦКИЙ ФИЛИАЛ АККРЕДИТОВАННОГО ОБРАЗОВАТЕЛЬНОГО ЧАСТНОГО УЧРЕЖДЕНИЯ ВЫСШЕГО ПРОФЕССИОНАЛЬНОГО ОБРАЗОВАНИЯ "МОСКОВСКИЙ ФИНАНСОВО-ЮРИДИЧЕСКИЙ УНИВЕРСИТЕТ МФЮА"',
                    data: {},
                },
            ],
            match: "Филиал <strong>КАЛМЫЦ</strong>КИЙ ФИЛИАЛ АККРЕДИТОВАННОГО ОБРАЗОВАТ...",
        },
        {
            name: "should show OGRN instead of INN if match",
            options: { type: "party" },
            query: "1095403",
            suggestions: [
                {
                    value: "ЗАО Ромашка",
                    data: {
                        address: {
                            value: "Новосибирская",
                            data: null,
                        },
                        inn: "5403233085",
                        ogrn: "1095403010900",
                        type: "LEGAL",
                    },
                },
            ],
            match: "<strong>1095403</strong>010900",
        },
        {
            name: "should show latin name instead of regular name if match",
            options: { type: "party" },
            query: "ALFA",
            suggestions: [
                {
                    value: "ОАО Альфа-Техника",
                    data: {
                        inn: "5403233085",
                        name: {
                            latin: 'JSC "ALFA-TECHNICA"',
                        },
                        type: "LEGAL",
                    },
                },
            ],
            match: "JSC &quot;<strong>ALFA</strong>-TECHNICA&quot;",
        },
        {
            name: "should show director's name instead of address if match",
            options: { type: "party" },
            query: "hf жура",
            suggestions: [
                {
                    value: "ООО ХФ Лабс",
                    data: {
                        inn: "5403233085",
                        management: {
                            name: "Журавлев Дмитрий Сергеевич",
                            post: "Генеральный директор",
                        },
                        type: "LEGAL",
                    },
                },
            ],
            match: "<strong>Жура</strong>влев Дмитрий Сергеевич",
        },
        {
            name: "should show history values",
            options: { type: "address" },
            query: "казань эсперан",
            suggestions: [
                {
                    value: "г Казань, ул Нурсултана Назарбаева",
                    unrestricted_value: "респ Татарстан, г Казань, ул Нурсултана Назарбаева",
                    data: {
                        history_values: ["ул Эсперанто"],
                    },
                },
                {
                    value: "г Казань, тер ГСК Эсперантовский (Эсперанто)",
                    unrestricted_value:
                        "респ Татарстан, г Казань, тер ГСК Эсперантовский (Эсперанто)",
                    data: {},
                },
            ],
            match: "(бывш. ул <strong>Эсперан</strong>то)",
        },
    ];

    test.each(testData)("$name", async (data) => {
        const provider = getProvider(data.options);

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions: data.suggestions }));

        const res = await provider.fetchSuggestions(data.query);

        const matches = concatMatches(res?.suggestions?.[0].matches);

        [data.match].flat().forEach((match) => {
            expect(matches).toContain(match);
        });

        (data.noMatch || []).forEach((match) => {
            expect(matches).not.toContain(match);
        });
    });

    test("should show labels for same-looking suggestions", async () => {
        const provider = getProvider({ type: "name" });

        global.fetchMocker.mockResponse(
            JSON.stringify({
                suggestions: [
                    {
                        value: "Антон Николаевич",
                        data: {
                            name: "Антон",
                            surname: null,
                            patronymic: "Николаевич",
                        },
                    },
                    {
                        value: "Антон Николаевич",
                        data: {
                            name: "Антон",
                            surname: "Николаевич",
                            patronymic: null,
                        },
                    },
                ],
            })
        );

        const res = await provider.fetchSuggestions("А");

        expect(res?.suggestions?.[0].labels).toEqual(["имя", "отчество"]);
        expect(res?.suggestions?.[1].labels).toEqual(["имя", "фамилия"]);
    });

    test("beforeFormat", async () => {
        const beforeFormat = vi.fn((suggestion) => ({
            ...suggestion,
            value: "custom",
        }));

        const provider = getProvider({
            type: "address",
            beforeFormat,
        });

        global.fetchMocker.mockResponse(
            JSON.stringify({ suggestions: ["Japaneese and non-japaneese"] })
        );

        // eslint-disable-next-line dot-notation
        const spy = vi.spyOn(provider["_strategy"], "findQueryMatches");

        await provider.fetchSuggestions("А");

        expect(beforeFormat).toHaveBeenCalled();
        expect(spy.mock.calls[0][0]).toMatchObject(beforeFormat.mock.results[0].value);

        spy.mockClear();
        beforeFormat.mockClear();

        beforeFormat.mockImplementationOnce(() => ({
            value: null,
            unrestricted_value: "custom",
            data: {},
        }));

        await provider.fetchSuggestions("А");

        expect(spy.mock.calls[0][0]).not.toMatchObject(beforeFormat.mock.results[0].value);
        expect(spy.mock.calls[0][0]).toMatchObject({
            value: "",
            unrestricted_value: "custom",
            data: {},
        });
    });
});
