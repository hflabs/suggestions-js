import { ISuggestions } from "../types";
import ImplementationBase from "./ImplementationBase";

const ABORT_ERROR_MESSAGE = "Aborted by the next request";

export default class ImplementationSuggestionsBase<
  D
> extends ImplementationBase<D> {
  protected fetchSuggestionsApiMethod: "suggest" | "findById" = "suggest";

  private fetchSuggestionsCaches: Record<
    string,
    Record<string, ISuggestions<D>>
  > = {};

  /**
   * Fetch suggestions or take them from cache
   */
  protected fetchSuggestions(
    query: string,
    params?: Record<string, unknown>
  ): Promise<ISuggestions<D>> {
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

  private abortCurrentFetch: (() => void) | null = null;

  private fetchSuggestionsFromApi(
    query: string,
    params?: Record<string, unknown>
  ): Promise<ISuggestions<D>> {
    const {
      api,
      onSearchError,
      onSearchStart,
      onSearchComplete,
    } = this.options;

    const searchStartResult = onSearchStart?.(query, this.el);
    if (typeof searchStartResult === "string") {
      query = searchStartResult;
    }

    const abortableRequest = new Promise<ISuggestions<D>>((resolve, reject) => {
      // Abort pending fetching (not the request itself)
      if (this.abortCurrentFetch) {
        this.abortCurrentFetch();
      }

      // Expose new abort callback
      this.abortCurrentFetch = () => reject(new Error(ABORT_ERROR_MESSAGE));

      api[this.fetchSuggestionsApiMethod](query, params)
        .then(resolve, reject)
        .finally(() => {
          this.abortCurrentFetch = null;
        });
    });

    abortableRequest.then(
      (suggestions) => {
        onSearchComplete?.(query, suggestions, this.el);
      },
      (error) => {
        if (error.message !== ABORT_ERROR_MESSAGE) {
          onSearchError?.(error, query, this.el);
        }
      }
    );

    return abortableRequest;
  }
}
