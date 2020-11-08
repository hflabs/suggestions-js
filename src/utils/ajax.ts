import { isPositiveNumber } from "./isNumber";
import { ERROR_AJAX_TIMEOUT, ERROR_AJAX_UNAVAILABLE } from "../errors";

export type AjaxHeaders = Record<string, string>;

export interface AjaxInit {
  method?: string;
  headers?: AjaxHeaders;
  body?: unknown;
  timeout?: number;
}

export interface AjaxResponse<Payload = void> {
  status: number;
  statusText: string;
  headers: AjaxHeaders;
  body: Payload;
}

export const parseHeaders = (allHeaders: string): AjaxHeaders =>
  allHeaders
    .split(/[\r\n]+/)
    .filter(Boolean)
    .reduce((memo, header) => {
      const [name, ...value] = header.split(": ");
      return { ...memo, [name.toLowerCase()]: value.join(": ") };
    }, {});

/**
 * Perform ajax requests.
 *
 * Set content-type:application/json, respect it on responses
 *
 * @param {string} url
 * @param {AjaxInit} [init]
 * @return Promise<AjaxResponse>
 */
export const ajax = <Payload = unknown>(
  url: string,
  init: AjaxInit = {}
): Promise<AjaxResponse<Payload>> =>
  new Promise<AjaxResponse<Payload>>((resolve, reject) => {
    if (typeof XMLHttpRequest !== "function") {
      throw new Error(ERROR_AJAX_UNAVAILABLE);
    }

    const xhr = new XMLHttpRequest();
    const { method, headers, timeout } = init;
    let { body } = init;

    xhr.open(method || "GET", url);

    // server sets Access-Control-Allow-Origin: *
    // which requires no credentials
    xhr.withCredentials = false;

    // Add custom headers
    if (headers) {
      Object.keys(headers).forEach((name) =>
        xhr.setRequestHeader(name, headers[name])
      );
    }

    // If body is an object, prepare it for sending
    if (typeof body === "object") {
      body = JSON.stringify(body);
      xhr.setRequestHeader("Content-type", "application/json");
    }

    const timeoutId = isPositiveNumber(timeout)
      ? setTimeout(() => xhr.abort(), timeout)
      : null;

    xhr.onabort = () => reject(new Error(ERROR_AJAX_TIMEOUT));

    xhr.onload = xhr.onerror = () => {
      try {
        if (timeoutId) clearTimeout(timeoutId);

        const { responseText, status, statusText } = xhr;

        if (!status || status >= 400) {
          reject(new Error(statusText));
        }

        const responseHeaders: AjaxHeaders = parseHeaders(
          xhr.getAllResponseHeaders()
        );

        resolve({
          status,
          statusText,
          headers: responseHeaders,
          body: responseHeaders["content-type"]?.match(/\bapplication\/json\b/i)
            ? JSON.parse(responseText)
            : responseText,
        });
      } catch (error) {
        reject(error);
      }
    };

    xhr.send(body === null || body === undefined ? "" : String(body));
  });
