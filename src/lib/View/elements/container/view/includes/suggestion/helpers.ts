import type { Match, SuggestionsMatches } from "@/lib/types";
import { createElement } from "@/helpers/dom";
import { getDeepValue } from "@/helpers/object";
import { CLASSES } from "@view/view.constants";
import type { SUGGESTION_OPTIONS } from "./types";

/**
 * Добавляет nowrap css-класс для частей текста, разделенных ", "
 * (white-space: nowrap)
 */
const appendNowrap = (text: string) => {
    const delimitedParts = text.split(", ");
    if (delimitedParts.length === 1) return text;

    return delimitedParts
        .map((part) => `<span class="${CLASSES.nowrap}">${part}</span>`)
        .join(", ");
};

/**
 * Генерирует html из переданного chunk в зависимости от опций:
 * - оборачивает текст в nowrap
 * - оборачивает в <strong>, если это текст с совпадением
 * - оборачивает в класс с разделителем, если это конец группы
 * - оборачивает в инлайн класс, если это инлайновый chunk в группе
 */
const makeChunksHTML = (chunks: Match[], isInline: boolean) => {
    const joinedHtml = chunks
        .map((chunk) => {
            let html = chunk.matched ? `<strong>${chunk.text}</strong>` : chunk.text;
            if (chunk.groupEnd) html += `<span class="${CLASSES.subtext_delimiter}"></span>`;
            return html;
        })
        .join("");

    const wrappedText = appendNowrap(joinedHtml);

    return isInline ? `<span class="${CLASSES.subtext_inline}">${wrappedText}</span>` : wrappedText;
};

/**
 * Преобразует объект с мэтчами текста подсказки в html для основного и вспомогательного текста,
 * в полном и сокращенном виде
 */
const getMatchesTexts = (matches: SuggestionsMatches) => {
    const mainValue = {
        full: makeChunksHTML(matches.main.full, false),
        short: makeChunksHTML(matches.main.short || [], false),
    };

    const extraValues = {
        full: matches.extra
            ?.map((group) => group.full)
            .map((groupMatches, i, { length }) => makeChunksHTML(groupMatches, i !== length - 1)),
        short: matches.extra
            ?.map((group) => group.short)
            .filter((n) => typeof n !== "undefined")
            .map((groupMatches, i, { length }) => makeChunksHTML(groupMatches, i !== length - 1)),
    };

    const getStringFrom = (arr: (string | undefined)[]) =>
        arr
            .flat()
            .filter((v) => v !== undefined)
            .join("");

    return {
        mainValue,
        extraValue: matches.extra
            ? {
                  full: getStringFrom(extraValues.full!),
                  short: getStringFrom(extraValues.short!),
              }
            : null,
    };
};

/**
 * Оборачивает переданные тексты в соответствующие css-медиа классы
 * (скрытие на десктопе или мобильных).
 *
 * Если передан только full текст - возвращает его как есть,
 * иначе возвращает full (скрытый на мобильных) и short (скрытый на десктопе)
 */
const wrapWithMediaClass = ({ full, short }: { full: string; short?: string }) => {
    if (!short) return full;
    const { hiddenMobile, hiddenDesktop } = CLASSES;

    return `<span class="${hiddenMobile}">${full}</span><span class="${hiddenDesktop}">${short}</span>`;
};

/**
 * Основная функция, создающая контент подсказки
 *
 * Возвращает html фрагмент с основным и вспомогательным текстами подсказки,
 * где подсвечены совпадения и отделены группы контента
 */
export const buildContent = (options: SUGGESTION_OPTIONS) => {
    const fragment = document.createDocumentFragment();

    if (!options.matches) return fragment;

    const { mainValue, extraValue } = getMatchesTexts(options.matches);
    const suggestionStatus = getDeepValue(options.suggestion.data, "state.status");

    fragment.appendChild(
        createElement({
            tagName: "span",
            attributes: {
                className: CLASSES.value,
                dataset: suggestionStatus ? { suggestionStatus } : {},
            },
            content: wrapWithMediaClass(mainValue),
        })
    );

    if (options.labels.length) {
        fragment.appendChild(
            createElement({
                tagName: "span",
                attributes: { className: CLASSES.subtext_label },
                content: options.labels.join(", "),
            })
        );
    }

    if (!extraValue) return fragment;

    fragment.appendChild(
        createElement({
            tagName: "div",
            attributes: { className: CLASSES.subtext },
            content: wrapWithMediaClass(extraValue),
        })
    );

    return fragment;
};
