import { InitOptions, Status, StatusPlan, Suggestions } from "../types";
import { ajax, AjaxInit, AjaxResponse } from "../utils/ajax";
import { isPositiveNumber } from "../utils/isNumber";

export interface ApiResponseSuggestions<D> {
  suggestions: Suggestions<D>;
}

export type ApiFetchSuggestionsMethods = "suggest" | "findById";

export type ApiInitOption<D> = Pick<
  InitOptions<D>,
  | "count"
  | "language"
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

export default class Api<D> {
  static pendingQueries: Record<string, Promise<AjaxResponse<unknown>>> = {};

  private correctCount = this.getCorrectCount();
  private typeUrl: string = this.options.type.toLowerCase();

  constructor(private options: ApiInitOption<D>) {}

  private fetch<T = unknown>(
    slug: string,
    init?: AjaxInit
  ): Promise<AjaxResponse<T>> {
    const {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Defined via webpack.DefinePlugin
      "X-Version": DEFINED_VERSION,
    };

    if (token) headers["Authorization"] = `Token ${token}`;
    if (partner) headers["X-Partner"] = partner;

    const requestKey = JSON.stringify([url, init]);

    return (
      (Api.pendingQueries[requestKey] as Promise<AjaxResponse<T>>) ||
      (Api.pendingQueries[requestKey] = ajax<T>(url, {
        ...init,
        headers: { ...headers, ...init?.headers },
        timeout: requestTimeout,
      }))
    );
  }

  public status(): Promise<Status> {
    return this.fetch<Status>(`status/${this.typeUrl}`).then((response) => {
      const { body: status, headers } = response;

      if (!status.search) throw new Error("Service Unavailable");

      const xPlan = headers["x-plan"];

      if (xPlan) status.plan = xPlan as StatusPlan;

      return status;
    });
  }

  public fetchSuggestions(
    method: ApiFetchSuggestionsMethods,
    query: string,
    params?: Record<string, unknown>
  ): Promise<Suggestions<D>> {
    const { language, requestParamName } = this.options;

    return this.fetch<ApiResponseSuggestions<D>>(`${method}/${this.typeUrl}`, {
      method: "POST",
      body: {
        [requestParamName]: query,
        count: this.correctCount,
        language,
        ...params,
      },
    }).then((response) => response.body.suggestions);
  }

  private getCorrectCount(): number | undefined {
    const { count } = this.options;

    return isPositiveNumber(count) ? count : undefined;
  }
}
