const htmlEntities: Record<string, RegExp> = {
  "&amp;": /&/g,
  "&lt;": /</g,
  "&gt;": />/g,
  "&quot;": /"/g,
  "&#x27;": /'/g,
  "&#x2F;": /\//g,
};

/**
 * Make string html-safe, ready to be passed to innerHTML
 */
export const escapeHtml = (str: string): string =>
  Object.keys(htmlEntities).reduce(
    (memo, html) => memo.replace(htmlEntities[html], html),
    str
  );

/**
 * Prepare string for passing to `new RegEpx()`.
 */
export const escapeRegExChars = (str: string): string =>
  str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
