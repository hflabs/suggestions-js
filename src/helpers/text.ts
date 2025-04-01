export const WORD_DELIMITERS = "\\s\"'~\\*\\.,:\\|\\[\\]\\(\\)\\{\\}<>№";
const WORD_SPLITTER = new RegExp(`[${WORD_DELIMITERS}]+`, "g");

const WORD_PARTS_DELIMITERS = "\\-\\+\\\\\\?!@#$%^&";
const WORD_PARTS_SPLITTER = new RegExp(`[${WORD_PARTS_DELIMITERS}]+`, "g");

const getWordExtractorRegExp = () =>
    new RegExp(`([^${WORD_DELIMITERS}]*)([${WORD_DELIMITERS}]*)`, "g");

/**
 * Разбивает строку на слова,
 * отсеивает стоп-слова из списка.
 * Расклеивает буквы и цифры, написанные слитно.
 */
const split = (str: string, stopwords: string[] = []) => {
    const cleanStr = str
        .toLowerCase()
        .replaceAll("ё", "е")
        .replace(/(\d+)([а-я]{2,})/g, "$1 $2") // '22кв' -> '22 кв', 22к' -> '22к'
        .replace(/([а-я]+)(\d+)/g, "$1 $2"); // 'кв22' -> 'кв 22', к22' -> 'к22'

    const words = cleanStr.split(WORD_SPLITTER).filter(Boolean);
    if (!words.length) return [];

    if (!stopwords.length) return words;

    const lastWord = words.pop() as string;

    const filtered = words.filter((w) => !stopwords.includes(w));
    filtered.push(lastWord);

    return filtered;
};

/**
 * Приводит слово к нижнему регистру и заменяет ё → е
 */
const format = (text: string) => text.toLowerCase().replace(/[ёЁ]/g, "е");

/**
 * Возвращает список слов из строки.
 * При этом первыми по порядку идут «предпочтительные» слова
 * (те, что не входят в список «нежелательных»).
 * Составные слова тоже разбивает на части.
 * @param {text} value - строка
 * @param {Array} unwantedWords - «нежелательные» слова
 * @return {Array} Массив атомарных слов
 */
const tokenize = (text: string, unwantedWords: string[]) => {
    const tokens = format(text).split(WORD_SPLITTER).filter(Boolean);

    if (unwantedWords.length) {
        tokens.sort((a, b) => {
            if (unwantedWords.includes(a) && unwantedWords.includes(b)) return 0;
            return unwantedWords.includes(a) ? 1 : -1;
        });
    }

    return tokens
        .map((token) => {
            const subtokens = token.split(WORD_DELIMITERS);
            return subtokens.length > 1 ? [token, ...subtokens] : token;
        })
        .flat();
};

/**
 * Заменяет слова на составные части.
 */
const splitTokens = (tokens: string[]) =>
    tokens.map((token) => token.split(WORD_PARTS_SPLITTER).filter(Boolean)).flat();

/**
 * Нормализует строку с учетом стоп-слов из списка.
 */
const normalize = (str: string, stopwords: string[] = []) => split(str, stopwords).join(" ");

/**
 * Проверяет, включает ли строка 1 строку 2.
 * Если строки равны, возвращает false.
 */
const stringEncloses = (targetString: string, searchString: string) =>
    targetString.length > searchString.length &&
    targetString.toLowerCase().includes(searchString.toLowerCase());

/**
 * Эскейпирует символы RegExp-шаблона обратным слешем
 * (для передачи в конструктор регулярных выражений)
 */
const escapeRegExChars = (text: string) =>
    // eslint-disable-next-line no-useless-escape
    text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

/**
 * Заменяет амперсанд, угловые скобки и другие подобные символы
 * на HTML-коды
 */
const escapeHtml = (text: string) => {
    if (!text) return text;

    const symbolsMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "/": "&#x2F;",
    };

    let formatted = text;
    const symbols = Object.keys(symbolsMap) as unknown as (keyof typeof symbolsMap)[];

    symbols.forEach((symbol) => {
        formatted = formatted.replace(new RegExp(symbol, "g"), symbolsMap[symbol]);
    });

    return formatted;
};

/**
 * Находит вхождения строки в списке токенов с учетом стоп-слов
 *
 * Разбивает строку на слова
 * и для каждого слова определяет вхождение в список токенов
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
const findMatches = (value: string, tokens: string[], stopwords: string[] = []) => {
    const tokenMatchers = tokens.map(
        (token) =>
            new RegExp(
                `^((.*)([${WORD_PARTS_DELIMITERS}]+))?` +
                    `(${escapeRegExChars(token)})` +
                    `([^${WORD_PARTS_DELIMITERS}]*[${WORD_PARTS_DELIMITERS}]*)`,
                "i"
            )
    );

    type Chunk = {
        text: string;
        hasUpperCase: boolean;
        formatted: string;
        matchable: boolean;
        matched: boolean;
    };

    const chunks: Chunk[] = [];

    let match;

    const extractor = getWordExtractorRegExp();

    // eslint-disable-next-line no-cond-assign
    while ((match = extractor.exec(value)) && match[0]) {
        const word = match[1];

        chunks.push({
            text: word,
            hasUpperCase: word.toLowerCase() !== word,
            formatted: format(word),
            matchable: true,
            matched: false,
        });

        if (match[2]) {
            chunks.push({
                text: match[2],
                hasUpperCase: false,
                formatted: match[2],
                matchable: false,
                matched: false,
            });
        }
    }

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        const notInStopWords = !stopwords.includes(chunk.formatted) || chunk.hasUpperCase;

        if (!chunk.matchable || chunk.matched || !notInStopWords) {
            // eslint-disable-next-line no-continue
            continue;
        }

        tokenMatchers.every((matcher) => {
            let nextIndex = i + 1;
            const tokenMatch = matcher.exec(chunk.formatted);

            if (!tokenMatch) return true;

            const matchData = {
                before: tokenMatch[1] || "",
                beforeText: tokenMatch[2] || "",
                beforeDelimiter: tokenMatch[3] || "",
                text: tokenMatch[4] || "",
                after: tokenMatch[5] || "",
            };

            if (matchData.before) {
                // insert chunk before current
                chunks.splice(
                    i,
                    0,
                    {
                        text: chunk.text.substr(0, matchData.beforeText.length),
                        formatted: matchData.beforeText,
                        matchable: true,
                        hasUpperCase: false,
                        matched: false,
                    },
                    {
                        text: matchData.beforeDelimiter,
                        formatted: matchData.beforeDelimiter,
                        matchable: false,
                        hasUpperCase: false,
                        matched: false,
                    }
                );

                nextIndex += 2;

                const { length } = matchData.before;
                chunk.text = chunk.text.substr(length);
                chunk.formatted = chunk.formatted.substr(length);
                i--;
            }

            const length = matchData.text.length + matchData.after.length;

            if (chunk.formatted.length > length) {
                chunks.splice(nextIndex, 0, {
                    text: chunk.text.substr(length),
                    formatted: chunk.formatted.substr(length),
                    matchable: true,
                    hasUpperCase: false,
                    matched: false,
                });
                chunk.text = chunk.text.substr(0, length);
                chunk.formatted = chunk.formatted.substr(0, length);
            }

            if (matchData.after) {
                const newLength = matchData.text.length;

                chunks.splice(nextIndex, 0, {
                    text: chunk.text.substr(newLength),
                    formatted: chunk.formatted.substr(newLength),
                    matchable: false,
                    hasUpperCase: false,
                    matched: false,
                });

                chunk.text = chunk.text.substr(0, newLength);
                chunk.formatted = chunk.formatted.substr(0, newLength);
            }

            chunk.matched = true;
            return false;
        });
    }

    return chunks.map((chunk) => {
        const { text, matched } = chunk;
        return {
            text: escapeHtml(text),
            rawText: text,
            matched,
        };
    });
};

const getMatchesWithMaxLength = (matches: ReturnType<typeof findMatches>, maxLength: number) => {
    if (!maxLength) return [];

    const copiedMatches = JSON.parse(JSON.stringify(matches));
    let restLength = maxLength;
    let lastCheckedIndex = 0;

    for (let i = 0; i < copiedMatches.length && restLength >= 0; i++) {
        restLength -= copiedMatches[i].rawText.length;
        lastCheckedIndex = i;

        if (restLength < 0) {
            const availableLength = copiedMatches[i].rawText.length + restLength;
            copiedMatches[i].rawText = `${copiedMatches[i].rawText.slice(0, availableLength)}...`;
            copiedMatches[i].text = escapeHtml(copiedMatches[i].rawText);
        }
    }

    return copiedMatches.slice(0, lastCheckedIndex + 1);
};

/**
 * Разбивает текст по словам
 */
const getWordsFromString = (value: string) => {
    let match;
    const words: string[] = [];

    const extractor = getWordExtractorRegExp();

    // eslint-disable-next-line no-cond-assign
    while ((match = extractor.exec(value)) && match[0]) {
        words.push(match[1]);
    }

    return words;
};

export {
    normalize,
    split,
    stringEncloses,
    tokenize,
    findMatches,
    splitTokens,
    getMatchesWithMaxLength,
    getWordsFromString,
    escapeHtml,
    escapeRegExChars,
};
