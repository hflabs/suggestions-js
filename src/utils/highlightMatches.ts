import { escapeHtml, escapeRegExChars } from "./escape";

const WORD_DELIMITERS = "\\s\"'~\\*\\.,:\\|\\[\\]\\(\\)\\{\\}<>№";
const WORD_PARTS_DELIMITERS = "\\-\\+\\\\\\?!@#$%^&";
const WORD_SPLITTER = new RegExp("[" + WORD_DELIMITERS + "]+", "g");
const WORD_PARTS_SPLITTER = new RegExp("[" + WORD_PARTS_DELIMITERS + "]+", "g");
// Регулярное выражение для разбивки строки на слова
const WORD_EXTRACTOR = new RegExp(
  `([^${WORD_DELIMITERS}]*)([${WORD_DELIMITERS}]*)`,
  "g"
);

export const normalizeToken = (token: string): string =>
  token.toLowerCase().replace(/[ёЁ]/g, "е");

/**
 * Split string to words and word-parts.
 * Sort tokens to put unwanted to the end.
 */
export const splitToTokens = (
  s: string,
  unformattableTokens?: string[]
): string[] => {
  const tokens: string[] = s
    .split(WORD_SPLITTER)
    .filter(Boolean)
    .map(normalizeToken);

  const withSubtokens: string[] = tokens.reduce((memo, token) => {
    const subtokens = token.split(WORD_PARTS_SPLITTER);
    return [...memo, token, ...(subtokens.length > 1 ? subtokens : [])];
  }, [] as string[]);

  // Move unformattableTokens to the end.
  // This will help to apply them only if no other tokens match
  if (unformattableTokens) {
    withSubtokens.sort((a, b) => {
      const aIsUnwanted = unformattableTokens.includes(a);
      const bIsUnwanted = unformattableTokens.includes(b);
      if (aIsUnwanted === bIsUnwanted) return 0;
      return aIsUnwanted ? 1 : -1;
    });
  }

  return withSubtokens;
};

interface IValueChunk {
  text: string;
  token: string;
  // upper case means a word is a name and can be highlighted even if presents in unformattableTokens
  hasUpperCase: boolean;
  matched: boolean;
  matchable: boolean;
}

export const splitToChunks = (value: string): IValueChunk[] => {
  const result: IValueChunk[] = [];
  let match: RegExpExecArray | null;

  WORD_EXTRACTOR.lastIndex = 0;
  while ((match = WORD_EXTRACTOR.exec(value)) && match[0]) {
    const [, word, delimeters] = match;

    if (word) {
      result.push({
        text: word,
        token: normalizeToken(word),
        hasUpperCase: word.toLowerCase() !== word,
        matchable: true,
        matched: false,
      });

      if (delimeters) {
        result.push({
          text: delimeters,
          token: "",
          hasUpperCase: false,
          matchable: false,
          matched: false,
        });
      }
    }
  }

  return result;
};

export const chunksToHtml = (chunks: IValueChunk[]): string =>
  chunks
    .map((chunk) => {
      const text = escapeHtml(chunk.text);
      return text && chunk.matched ? `<strong>${text}</strong>` : text;
    })
    .join("");

export const highlightMatches = (
  value: string,
  query: string,
  options?: {
    unformattableTokens?: string[];
    maxLength?: number;
  }
): string => {
  const queryTokens = splitToTokens(query, options?.unformattableTokens);
  const queryTokenMatchers = queryTokens.map(
    (token) =>
      new RegExp(
        `^((.*)([${WORD_PARTS_DELIMITERS}]+))?(${escapeRegExChars(
          token
        )})([^${WORD_PARTS_DELIMITERS}]*[${WORD_PARTS_DELIMITERS}]*)`,
        "i"
      )
  );
  const valueChunks = splitToChunks(value);

  // use simple loop because length can change
  for (let i = 0; i < valueChunks.length; i++) {
    const chunk = valueChunks[i];

    if (
      chunk.matchable &&
      !chunk.matched &&
      (!options?.unformattableTokens?.includes(chunk.token) ||
        chunk.hasUpperCase)
    ) {
      queryTokenMatchers.some((matcher) => {
        const tokenMatch = matcher.exec(chunk.token);
        let length;
        let nextIndex = i + 1;

        if (tokenMatch) {
          const [
            ,
            before,
            beforeText,
            beforeDelimiter,
            text,
            after,
          ] = tokenMatch;

          if (before) {
            // insert chunk before current
            valueChunks.splice(
              i,
              0,
              {
                text: chunk.text.substr(0, beforeText.length),
                token: beforeText,
                hasUpperCase: false,
                matchable: true,
                matched: false,
              },
              {
                text: beforeDelimiter,
                token: "",
                hasUpperCase: false,
                matchable: false,
                matched: false,
              }
            );
            nextIndex += 2;

            length = before.length;
            chunk.text = chunk.text.substr(length);
            chunk.token = chunk.token.substr(length);
            i--;
          }

          length = text.length + after.length;
          if (chunk.text.length > length) {
            valueChunks.splice(nextIndex, 0, {
              text: chunk.text.substr(length),
              token: chunk.token.substr(length),
              hasUpperCase: false,
              matchable: true,
              matched: false,
            });
            chunk.text = chunk.text.substr(0, length);
            chunk.token = chunk.token.substr(0, length);
          }

          if (after) {
            length = text.length;
            valueChunks.splice(nextIndex, 0, {
              text: chunk.text.substr(length),
              token: chunk.token.substr(length),
              hasUpperCase: false,
              matchable: false,
              matched: false,
            });
            chunk.text = chunk.text.substr(0, length);
            chunk.token = chunk.token.substr(0, length);
          }
          chunk.matched = true;
          return true;
        }
      });
    }
  }

  if (options?.maxLength) {
    let lengthAvailable = options.maxLength;

    return chunksToHtml(
      valueChunks.reduce((memo, chunk) => {
        if (lengthAvailable <= 0) return memo;

        const length = chunk.text.length;
        if (length <= lengthAvailable) {
          lengthAvailable -= length;
          return [...memo, chunk];
        }
        return [
          ...memo,
          {
            ...chunk,
            text: `${chunk.text.substr(0, lengthAvailable)}...`,
          },
        ];
      }, [] as IValueChunk[])
    );
  }

  return chunksToHtml(valueChunks);
};
