const htmlEntities: Record<string, RegExp> = {
  "&amp;": /&/g,
  "&lt;": /</g,
  "&gt;": />/g,
  "&quot;": /"/g,
  "&#x27;": /'/g,
  "&#x2F;": /\//g,
};

/**
 * Заменяет амперсанд, угловые скобки и другие подобные символы
 * на HTML-коды
 */
export const escapeHtml = (str: string): string =>
  Object.keys(htmlEntities).reduce(
    (memo, html) => memo.replace(htmlEntities[html], html),
    str
  );

/**
 * Эскейпирует символы RegExp-шаблона обратным слешем
 * (для передачи в конструктор регулярных выражений)
 */
export const escapeRegExChars = (str: string): string =>
  str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
