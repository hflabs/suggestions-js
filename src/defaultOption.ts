import { InitOptions } from "./types";

export const defaultOptions: Omit<InitOptions<unknown>, "type"> = {
  autoHighlightFirst: false,
  count: 5,
  deferRequestBy: 100,
  enrichmentEnabled: false,
  hint: "Выберите вариант или продолжите ввод",
  language: "ru",
  minLength: 1,
  mobileMaxWidth: 600,
  noCache: false,
  noSuggestionsHint: "Неизвестное значение",
  preventBadQueries: false,
  requestParamName: "query",
  requestTimeout: 3000,
  scrollOnFocus: false,
  serviceUrl: "https://suggestions.dadata.ru/suggestions/api/4_1/rs",
  triggerSelectOnBlur: true,
  triggerSelectOnEnter: true,
  triggerSelectOnSpace: false,
};
