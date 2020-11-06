export interface IAjaxHeaders {
  [name: string]: string;
}

export interface IAjaxInit {
  method?: string;
  headers?: IAjaxHeaders;
  body?: unknown;
  timeout?: number;
}

export interface IAjaxResponse<B = void> {
  status: number;
  statusText: string;
  headers: IAjaxHeaders;
  body: B;
}

export const ajax = <P = unknown>(
  url: string,
  init: IAjaxInit = {}
): Promise<IAjaxResponse<P>> =>
  new Promise<IAjaxResponse<P>>((resolve, reject) => {
    if (typeof XMLHttpRequest !== "function") throw new Error("No transport");

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

    const timeoutId =
      typeof timeout === "number" &&
      timeout > 0 &&
      setTimeout(() => xhr.abort(), timeout);

    xhr.onabort = () => reject(new Error("abort"));

    xhr.onload = xhr.onerror = () => {
      if (timeoutId) clearTimeout(timeoutId);

      const { responseText, status, statusText } = xhr;

      if (status > 0 && status < 400) {
        const responseHeaders: IAjaxHeaders = xhr
          .getAllResponseHeaders()
          .split(/[\r\n]+/)
          .filter(Boolean)
          .reduce((memo, header) => {
            const [name, ...value] = header.split(": ");
            return { ...memo, [name.toLowerCase()]: value.join(": ") };
          }, {});

        resolve({
          status,
          statusText,
          headers: responseHeaders,
          body: responseHeaders["content-type"]?.match(/\bapplication\/json\b/i)
            ? JSON.parse(responseText)
            : responseText,
        });
        return;
      }

      reject(new Error(statusText));
    };

    xhr.send(String(body));
  });
