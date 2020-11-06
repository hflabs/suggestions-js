import { IInitOptions, ISuggestions, TApiType } from "../types";
import { ajax, IAjaxInit, IAjaxResponse } from "../utils/ajax";

export type TApiStatusPlan = "FREE" | "LARGE";

export interface IApiStatus {
  count: number;
  enrich: boolean;
  name: TApiType;
  resources: { version: string; name: string }[];
  search: boolean;
  state: "ENABLED" | "DISABLED" | "INDEXING" | "REINDEXING";
  version: string;
  plan?: TApiStatusPlan;
}

export interface IApiSuggestions<D> {
  suggestions: ISuggestions<D>;
}

export type IApiOption<D> = Pick<
  IInitOptions<D>,
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
  static customTypeUrls: Partial<Record<TApiType, string>> = {
    NAME: "fio",
  };
  static pendingQueries: Record<string, Promise<IAjaxResponse<unknown>>> = {};

  private correctCount = this.getCorrectCount();
  private typeUrl: string =
    Api.customTypeUrls[this.options.type] || this.options.type.toLowerCase();

  constructor(private options: IApiOption<D>) {}

  private fetch<T = unknown>(
    slug: string,
    init?: IAjaxInit
  ): Promise<IAjaxResponse<T>> {
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
      (Api.pendingQueries[requestKey] as Promise<IAjaxResponse<T>>) ||
      (Api.pendingQueries[requestKey] = ajax<T>(url, {
        ...init,
        headers: { ...headers, ...init?.headers },
        timeout: requestTimeout,
      }))
    );
  }

  public status(): Promise<IApiStatus> {
    return this.fetch<IApiStatus>(`status/${this.typeUrl}`).then((response) => {
      const { body: status, headers } = response;

      if (!status.search) throw new Error("Service Unavailable");

      const xPlan = headers["x-plan"];

      if (xPlan) status.plan = xPlan as TApiStatusPlan;

      return status;
    });
  }

  private getSuggestParams(query: string, params?: Record<string, unknown>) {
    const { language, requestParamName } = this.options;

    return {
      [requestParamName]: query,
      count: this.correctCount,
      language,
      ...params,
    };
  }

  public suggest(
    query: string,
    params?: Record<string, unknown>
  ): Promise<ISuggestions<D>> {
    return this.fetch<IApiSuggestions<D>>(`suggest/${this.typeUrl}`, {
      method: "POST",
      body: this.getSuggestParams(query, params),
    }).then((response) => response.body.suggestions);
  }

  public findById(
    query: string,
    params?: Record<string, unknown>
  ): Promise<ISuggestions<D>> {
    return this.fetch<IApiSuggestions<D>>(`findById/${this.typeUrl}`, {
      method: "POST",
      body: this.getSuggestParams(query, params),
    }).then((response) => response.body.suggestions);
  }

  private getCorrectCount(): number | undefined {
    const { count } = this.options;

    return typeof count === "number" && isFinite(count) && count > 0
      ? count
      : undefined;
  }
}
