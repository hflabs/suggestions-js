import { RequestSuggestionsMethod, Suggestions } from "../../types";
import ImplementationBase from "./ImplementationBase";
import { queuedPromiseFactory } from "../../utils/queuedPromiseFactory";
import { ERROR_FETCH_ABORTED } from "../../errors";

abstract class ImplementationSuggestionsBase<
  SuggestionData
> extends ImplementationBase<SuggestionData> {
  protected fetchSuggestionsApiMethod: RequestSuggestionsMethod = "suggest";

  private fetchSuggestionsCaches: Record<
    string,
    Record<string, Suggestions<SuggestionData>>
  > = {};

  private fetchSuggestionsFromApi = this.triggeringSearchCallbacks(
    queuedPromiseFactory(
      (adjustedQuery: string, params?: Record<string, unknown>) =>
        this.options.api.fetchSuggestions(
          this.fetchSuggestionsApiMethod,
          adjustedQuery,
          params
        ),
      () => new Error(ERROR_FETCH_ABORTED)
    )
  );

  /**
   * Fetch suggestions or take them from cache
   */
  protected fetchSuggestions(
    query: string,
    params?: Record<string, unknown>
  ): Promise<Suggestions<SuggestionData>> {
    const { preventBadQueries, noCache } = this.options;

    if (noCache) {
      return this.fetchSuggestionsFromApi(query, params);
    }

    const cacheKey = JSON.stringify(params);
    const cache = this.fetchSuggestionsCaches[cacheKey];

    if (cache) {
      const cachedSuggestions = cache[query];

      if (cachedSuggestions) {
        return Promise.resolve(cachedSuggestions);
      }

      if (preventBadQueries) {
        const shorterEmptyQueryExists = Object.keys(cache).some((q) => {
          // startsWith not supported in IE
          return query.indexOf(q) === 0 && cache[q].length === 0;
        });

        if (shorterEmptyQueryExists) {
          return Promise.resolve([]);
        }
      }
    }

    return this.fetchSuggestionsFromApi(query, params).then((suggestions) => {
      (cache || (this.fetchSuggestionsCaches[cacheKey] = {}))[
        query
      ] = suggestions;
      return suggestions;
    });
  }
}

export default ImplementationSuggestionsBase;
