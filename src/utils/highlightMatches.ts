import { escapeHtml, escapeRegExChars } from "./escape";
import { isPositiveNumber } from "./isNumber";

const WORD_DELIMITERS = "\\s\"'~\\*\\.,:\\|\\[\\]\\(\\)\\{\\}<>№";
const WORD_PARTS_DELIMITERS = "\\-\\+\\\\\\?!@#$%^&";
const WORD_SPLITTER = new RegExp("[" + WORD_DELIMITERS + "]+", "g");
const WORD_PARTS_SPLITTER = new RegExp("[" + WORD_PARTS_DELIMITERS + "]+", "g");
const WORD_EXTRACTOR = new RegExp(
  `([^${WORD_DELIMITERS}]*)([${WORD_DELIMITERS}]*)`,
  "g"
);

/**
 * Makes token from a string
 * @param token
 */
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

  // Add word-parts as new tokens
  const withSubtokens: string[] = tokens.reduce((memo, token) => {
    const tokenParts = token.split(WORD_PARTS_SPLITTER);
    return [...memo, token, ...(tokenParts.length > 1 ? tokenParts : [])];
  }, [] as string[]);

  // Move tokens from unformattableTokens to the end.
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

const hasUpperCase = (s: string): boolean => s !== s.toLowerCase();

export interface ValueChunk {
  text: string;
  token: string;
  matched: boolean;
}

export const splitToChunks = (value: string): ValueChunk[] => {
  const result: ValueChunk[] = [];
  let match: RegExpExecArray | null;

  WORD_EXTRACTOR.lastIndex = 0;
  while ((match = WORD_EXTRACTOR.exec(value)) && match[0]) {
    const [, word, delimiters] = match;

    if (word) {
      result.push({
        text: word,
        token: normalizeToken(word),
        matched: false,
      });
    }

    if (delimiters) {
      result.push({
        text: delimiters,
        token: "",
        matched: false,
      });
    }
  }

  return result;
};

export const chunksToHtml = (chunks: ValueChunk[]): string =>
  chunks
    .map((chunk) => {
      const text = escapeHtml(chunk.text);
      return text && chunk.matched ? `<strong>${text}</strong>` : text;
    })
    .join("");

/**
 * Search for query tokens within each chunk.
 *
 * If all the chunk's text matches some token, mark this chunk as `matched`.
 * If a part of chunk's text matches some token, split chunk into several chunks, one of which is `matched`.
 *
 * @param {number} matchedCount
 * @param {ValueChunk[]} chunks
 * @param {RegExp[]} queryTokenMatchers
 * @param {string[]} [unformattableTokens]
 * @return {ValueChunk[]}
 */
export const findMatchesInChunks = (
  chunks: ValueChunk[],
  matchedCount: number,
  queryTokenMatchers: RegExp[],
  unformattableTokens?: string[]
): ValueChunk[] => {
  const nextChunks = chunks.reduce((memo, chunk) => {
    if (
      chunk.token &&
      !chunk.matched &&
      (!unformattableTokens?.includes(chunk.token) ||
        // upper case means a word is a name and can be highlighted even if presents in unformattableTokens
        hasUpperCase(chunk.text))
    ) {
      // Try to search tokens within a chunk
      const queryTokenMatcher = queryTokenMatchers.find((matcher) =>
        matcher.test(chunk.token)
      );

      if (queryTokenMatcher) {
        const [, before, beforeText, beforeDelimiter, text, after] =
          // tokenMatcher was checked in previous .find()
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          queryTokenMatcher.exec(chunk.token)!;
        const beforeLength = before?.length || 0;
        const textLength = text.length;
        const afterLength = after.length;

        const chunksToAdd: ValueChunk[] = [];

        if (beforeLength) {
          // insert chunks before current
          if (beforeText) {
            chunksToAdd.push({
              text: chunk.text.substr(0, beforeText.length),
              token: beforeText,
              matched: false,
            });
          }

          // beforeDelimiter can not be empty
          chunksToAdd.push({
            text: beforeDelimiter,
            token: "",
            matched: false,
          });
        }

        chunksToAdd.push({
          text: chunk.text.substr(beforeLength, textLength),
          token: chunk.token.substr(beforeLength, textLength),
          matched: true,
        });

        if (afterLength) {
          chunksToAdd.push({
            text: chunk.text.substr(beforeLength + textLength),
            token: chunk.token.substr(beforeLength + textLength),
            matched: false,
          });
        }

        return [...memo, ...chunksToAdd];
      }
    }

    return [...memo, chunk];
  }, [] as ValueChunk[]);
  const nextMatchedCount = nextChunks.filter((chunk) => chunk.matched).length;

  return nextMatchedCount === matchedCount
    ? nextChunks
    : // If matches were found, new chunks might have been added, so check again to search within them.
      findMatchesInChunks(
        nextChunks,
        nextMatchedCount,
        queryTokenMatchers,
        unformattableTokens
      );
};

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

  const valueChunks = findMatchesInChunks(
    splitToChunks(value),
    0,
    queryTokenMatchers,
    options?.unformattableTokens
  );

  if (options && isPositiveNumber(options.maxLength)) {
    let lengthAvailable = options.maxLength;

    return chunksToHtml(
      valueChunks.reduce((memo, chunk) => {
        if (lengthAvailable <= 0) return memo;

        const length = chunk.text.length;

        if (length <= lengthAvailable) {
          lengthAvailable -= length;
          return [...memo, chunk];
        }

        const result = [
          ...memo,
          {
            ...chunk,
            text: `${chunk.text.substr(0, lengthAvailable)}...`,
          },
        ];

        lengthAvailable = 0;

        return result;
      }, [] as ValueChunk[])
    );
  }

  return chunksToHtml(valueChunks);
};
