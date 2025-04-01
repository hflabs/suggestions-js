// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext } from "vitest";
import { createSuggestions } from "@/index";
import { CLASSES } from "@/lib/View/view.constants";

type ContextWithSuggestions = TestContext & {
    suggestions: ReturnType<typeof createSuggestions>;
};

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
        match: 'ООО "<strong>Фирма</strong>"',
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
            '</strong><span class="suggestions-subtext-delimiter"></span><strong>'
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
                '</strong><span class="suggestions-subtext-delimiter"></span><strong>'
            ),
            "308 5".replace(/ /g, '<span class="suggestions-subtext-delimiter"></span>'),
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
        match: "<strong>ЗАО</strong> <strong>&amp;LT</strong> &lt;b&gt;bold&lt;/b&gt;",
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
        match: 'JSC "<strong>ALFA</strong>-TECHNICA"',
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
        ],
        match: "(бывш. ул <strong>Эсперан</strong>то)",
    },
];

describe("Suggestion", () => {
    const { input, setInputValue } = global.createInput();

    beforeEach((context: ContextWithSuggestions) => {
        context.suggestions = createSuggestions(input, {
            type: "name",
            enrichmentEnabled: false,
        });
    });

    afterEach((context: ContextWithSuggestions) => {
        context.suggestions.dispose();
    });

    test("should show attribute with status", async (context: ContextWithSuggestions) => {
        const suggestions = [
            {
                value: "ЗАО АМС",
                data: {
                    state: { status: "LIQUIDATED" },
                    type: "LEGAL",
                },
            },
        ];

        context.suggestions.setOptions({ type: "party" });
        global.fetchMocker.mockResponse(JSON.stringify({ suggestions }));

        setInputValue("АМС");
        await global.wait(100);

        const suggestionItems = document.querySelectorAll(`.${CLASSES.suggestion}`);

        expect(suggestionItems).toHaveLength(1);
        expect(suggestionItems[0].innerHTML).toContain('data-suggestion-status="LIQUIDATED"');
    });

    test.for(testData)("$name", async (data, context) => {
        (context as unknown as ContextWithSuggestions).suggestions.setOptions(data.options);

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions: data.suggestions }));

        setInputValue(data.query);
        await global.wait(100);

        const suggestionItems = document.querySelectorAll(`.${CLASSES.suggestion}`);

        expect(suggestionItems).toHaveLength(1);

        [data.match].flat().forEach((match) => {
            expect(suggestionItems[0].innerHTML).toContain(match);
        });

        (data.noMatch || []).forEach((match) => {
            expect(suggestionItems[0].innerHTML).not.toContain(match);
        });
    });
});
