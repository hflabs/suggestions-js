import {
  InitOptions,
  RequestSuggestionsMethod,
  Status,
  Suggestions,
} from "../types";
import { ajax, AjaxInit, AjaxResponse } from "../utils/ajax";
import { isPositiveNumber } from "../utils/isNumber";
import { noop } from "../utils/noop";
import { ERROR_SERVICE_UNAVAILABLE } from "../errors";

export interface ApiResponseSuggestions<SuggestionData> {
  suggestions: Suggestions<SuggestionData>;
}

export type ApiInitOption<SuggestionData> = Pick<
  InitOptions<SuggestionData>,
  | "count"
  | "language"
  | "noCache"
  | "partner"
  | "requestHeaders"
  | "requestParamName"
  | "requestParams"
  | "requestTimeout"
  | "requestToken"
  | "requestUrl"
  | "serviceUrl"
  | "type"
>;

export default class Api<SuggestionData> {
  private static pendingQueries: Record<
    string,
    Promise<AjaxResponse<unknown>>
  > = {};
  public static resetPendingQueries = (): void => {
    Api.pendingQueries = {};
  };

  private typeUrl: string = this.options.type.toLowerCase();
  private correctCount = isPositiveNumber(this.options.count)
    ? this.options.count
    : undefined;

  constructor(private options: ApiInitOption<SuggestionData>) {}

  private fetch<ResponseBody = unknown>(
    slug: string,
    init?: AjaxInit
  ): Promise<AjaxResponse<ResponseBody>> {
    const {
      noCache,
      partner,
      requestHeaders,
      requestTimeout,
      requestToken,
      requestUrl,
      serviceUrl = "https://suggestions.dadata.ru/suggestions/api/4_1/rs",
    } = this.options;
    let url: string;

    if (requestUrl) {
      url = requestUrl;
    } else {
      url = `${serviceUrl.replace(/([^/])$/, "$1/")}${slug}`;
    }

    const token = requestToken?.trim();
    const headers: RequestInit["headers"] = {
      ...requestHeaders,
      Accept: "application/json",
      "X-Version": DEFINED_VERSION,
    };

    if (token) headers["Authorization"] = `Token ${token}`;
    if (partner) headers["X-Partner"] = partner;

    const doRequest = () =>
      ajax<ResponseBody>(url, {
        ...init,
        headers: { ...headers, ...init?.headers },
        timeout: requestTimeout,
      });

    if (noCache) return doRequest();

    const requestKey = JSON.stringify([url, init]);
    const pendingRequest = Api.pendingQueries[requestKey] as
      | Promise<AjaxResponse<ResponseBody>>
      | undefined;

    if (pendingRequest) return pendingRequest;

    const request = doRequest();

    Api.pendingQueries[requestKey] = request;
    request
      .finally(() => {
        delete Api.pendingQueries[requestKey];
      })
      .catch(noop);

    return request;
  }

  public status(): Promise<Status> {
    return this.fetch<Status>(`status/${this.typeUrl}`).then((response) => {
      const { body: status, headers } = response;

      if (!status.search) throw new Error(ERROR_SERVICE_UNAVAILABLE);

      return { ...status, plan: headers["x-plan"] };
    });
  }

  public fetchSuggestions(
    method: RequestSuggestionsMethod,
    query: string,
    params?: Record<string, unknown>
  ): Promise<Suggestions<SuggestionData>> {
    const { language, requestParamName, requestParams } = this.options;

    return this.fetch<ApiResponseSuggestions<SuggestionData>>(
      `${method}/${this.typeUrl}`,
      {
        method: "POST",
        body: {
          ...requestParams,
          [requestParamName]: query,
          count: this.correctCount,
          language,
          ...params,
        },
      }
    ).then((response) => response.body.suggestions);
  }
}
