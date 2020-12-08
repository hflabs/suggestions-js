import { ajax, AjaxResponse } from "./ajax";
import sinon, { SinonFakeServer } from "sinon";
import { as } from "./as";
import { ERROR_AJAX_TIMEOUT, ERROR_AJAX_UNAVAILABLE } from "../errors";
import { withMockedProperty } from "../../testUtils/withMockedProperty";
import { withFakeTimers } from "../../testUtils/withFakeTimers";

describe("ajax()", () => {
  let server: SinonFakeServer;

  beforeEach(() => {
    server = sinon.useFakeServer();
    server.autoRespond = true;
  });

  afterEach(() => {
    server.restore();
  });

  it("should return nothing", async () => {
    server.respondWith("");

    await expect(ajax("")).resolves.toEqual(
      as<AjaxResponse<string>>({
        body: "",
        headers: {},
        status: 200,
        statusText: "OK",
      })
    );
  });

  it("should return text", async () => {
    server.respondWith([200, { "Content-Type": "text/html" }, "Some text"]);

    await expect(ajax("")).resolves.toEqual(
      as<AjaxResponse<string>>({
        body: "Some text",
        headers: { "content-type": "text/html" },
        status: 200,
        statusText: "OK",
      })
    );
  });

  it("should return numbers", async () => {
    server.respondWith([200, { "Content-Type": "application/json" }, "123"]);

    await expect(ajax("")).resolves.toEqual(
      as<AjaxResponse<number>>({
        body: 123,
        headers: { "content-type": "application/json" },
        status: 200,
        statusText: "OK",
      })
    );
  });

  it("should return objects", async () => {
    server.respondWith([
      200,
      { "Content-Type": "application/json" },
      JSON.stringify({ a: 1, b: 2, c: 3 }),
    ]);

    await expect(ajax("")).resolves.toEqual(
      as<AjaxResponse<Record<string, number>>>({
        body: { a: 1, b: 2, c: 3 },
        headers: { "content-type": "application/json" },
        status: 200,
        statusText: "OK",
      })
    );
  });

  it("should fail on 4xx response", async () => {
    await expect(ajax("")).rejects.toThrow("Not Found");
  });

  it("should fail on 5xx response", async () => {
    server.respondWith([
      500,
      { "Content-Type": "text/html" },
      "<h1>Some error page</h1>",
    ]);

    await expect(ajax("")).rejects.toThrow("Internal Server Error");
  });

  it("should fail on unavailable XMLHttpRequest", async () => {
    await withMockedProperty(window, "XMLHttpRequest", null, async () => {
      await expect(ajax("")).rejects.toThrow(ERROR_AJAX_UNAVAILABLE);
    });
  });

  it("should fail on incorrect payload type", async () => {
    server.respondWith([
      200,
      { "Content-Type": "application/json" },
      "<h1>Some error page</h1>",
    ]);

    await expect(ajax("")).rejects.toThrow(
      "Unexpected token < in JSON at position 0"
    );
  });

  it("should fail on timeout exceeded", async () => {
    server.autoRespond = false;

    await withFakeTimers(async () => {
      const request = ajax("", { timeout: 10 });

      jest.runAllTimers();

      await expect(request).rejects.toThrow(ERROR_AJAX_TIMEOUT);
    });
  });

  it("should succeed on timeout not exceeded", async () => {
    server.autoRespond = false;
    await withFakeTimers(async () => {
      const request = ajax("", { timeout: 10 });

      server.respondWith([200, {}, "Ok"]);
      server.respond();

      jest.runAllTimers();

      await expect(request).resolves.toMatchObject(
        as<Partial<AjaxResponse<string>>>({
          status: 200,
          body: "Ok",
        })
      );
    });
  });

  it("should parse headers", async () => {
    server.respondWith([
      200,
      { "Content-Type": "text/html", "X-Plan": "FREE" },
      "<h1>Some payload</h1>",
    ]);

    await expect(ajax("")).resolves.toEqual(
      as<AjaxResponse<string>>({
        statusText: "OK",
        status: 200,
        body: "<h1>Some payload</h1>",
        headers: { "content-type": "text/html", "x-plan": "FREE" },
      })
    );
  });

  it("should send custom headers", async () => {
    const fn = jest.fn((xhr) => xhr.respond(200, {}, "Ok"));
    server.respondWith(fn);

    await ajax("", { headers: { "X-Version": "1.2.3" } });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({
        requestHeaders: expect.objectContaining({
          "X-Version": "1.2.3",
        }),
      })
    );
  });

  it("should send request with custom method", async () => {
    const fn = jest.fn((xhr) => xhr.respond(200, {}, "Ok"));
    server.respondWith(fn);

    await ajax("", { method: "MY-METHOD" });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: "MY-METHOD",
      })
    );
  });

  it("should send text payload", async () => {
    const fn = jest.fn((xhr) => xhr.respond(200, {}, "Ok"));
    server.respondWith(fn);

    await ajax("", { method: "POST", body: "Payload" });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: "POST",
        requestBody: "Payload",
      })
    );
  });

  it("should send JSON payload", async () => {
    const fn = jest.fn((xhr) => xhr.respond(200, {}, "Ok"));
    server.respondWith(fn);

    await ajax("", { method: "POST", body: { x: 10, y: 20 } });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: "POST",
        requestHeaders: { "Content-type": "application/json;charset=utf-8" },
        requestBody: JSON.stringify({ x: 10, y: 20 }),
      })
    );
  });
});
