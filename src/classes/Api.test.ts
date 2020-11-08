import sinon, { SinonFakeServer } from "sinon";
import Api, { ApiInitOption, ApiResponseSuggestions } from "./Api";
import { as } from "../utils/as";
import { Status, Suggestions } from "../types";
import { noop } from "../utils/noop";
import packageInfo from "../../package.json";
import { ERROR_SERVICE_UNAVAILABLE } from "../errors";

describe("class Api", () => {
  const apiOptions: ApiInitOption<unknown> = {
    type: "entityType",
    count: 3,
    language: "ru",
    noCache: true,
    partner: "Partner ID",
    requestHeaders: { "Default-Header-Name": "Default Header Value" },
    requestParamName: "query",
    requestParams: { count: 20, payloadField: "payload" },
    serviceUrl: "service",
  };
  let server: SinonFakeServer;

  beforeEach(() => {
    server = sinon.useFakeServer();
    server.autoRespond = true;
  });

  afterEach(() => {
    server.restore();
  });

  describe(".status()", () => {
    it("should request status", () => {
      new Api(apiOptions).status().catch(noop);

      expect(server.requests).toHaveLength(1);

      const request = server.requests[0];

      expect(request.method).toBe("GET");
      expect(request.url).toBe("service/status/entitytype");
      expect(request.requestBody).toBe("");
    });

    it("should proceed status response", async () => {
      server.respondWith([
        200,
        { "Content-type": "application/json", "X-Plan": "FREE" },
        JSON.stringify(
          as<Partial<Status>>({
            search: true,
          })
        ),
      ]);

      await expect(new Api(apiOptions).status()).resolves.toMatchObject(
        as<Partial<Status>>({
          search: true,
          plan: "FREE",
        })
      );
    });

    it("should fail when status unreachable", async () => {
      server.respondWith([500, {}, "<h1>Server Error</h1>"]);

      await expect(new Api(apiOptions).status()).rejects.toThrow(
        "Internal Server Error"
      );
    });

    it("should fail when status.search is false", async () => {
      server.respondWith([
        200,
        { "Content-type": "application/json" },
        JSON.stringify(
          as<Partial<Status>>({
            search: false,
          })
        ),
      ]);

      await expect(new Api(apiOptions).status()).rejects.toThrow(
        ERROR_SERVICE_UNAVAILABLE
      );
    });
  });

  describe(".fetchSuggestions()", () => {
    it("should request suggestions", () => {
      new Api(apiOptions)
        .fetchSuggestions("suggest", "дерибасовская")
        .catch(noop);

      expect(server.requests).toHaveLength(1);

      const request = server.requests[0];

      expect(request.method).toBe("POST");
      expect(request.url).toBe("service/suggest/entitytype");
      expect(request.requestHeaders).toMatchObject({
        "Default-Header-Name": "Default Header Value",
        "X-Version": packageInfo.version,
        "X-Partner": "Partner ID",
      });
      expect(JSON.parse(request.requestBody)).toEqual({
        count: 3,
        query: "дерибасовская",
        language: "ru",
        payloadField: "payload",
      });
    });

    it("should request suggestions from custom url", () => {
      new Api({
        ...apiOptions,
        requestUrl: "custom-url/suggestions",
      })
        .fetchSuggestions("suggest", "дерибасовская")
        .catch(noop);

      expect(server.requests).toHaveLength(1);

      const request = server.requests[0];

      expect(request.url).toBe("custom-url/suggestions");
    });

    it("should use custom requestParamName", () => {
      new Api({
        ...apiOptions,
        requestParamName: "search",
      })
        .fetchSuggestions("suggest", "дерибасовская")
        .catch(noop);

      expect(JSON.parse(server.requests[0].requestBody)).toMatchObject({
        search: "дерибасовская",
      });
    });

    it("should override payload", () => {
      new Api(apiOptions)
        .fetchSuggestions("suggest", "дерибасовская", { count: "customCount" })
        .catch(noop);

      expect(JSON.parse(server.requests[0].requestBody)).toMatchObject({
        count: "customCount",
      });
    });

    it("should proceed response", async () => {
      server.respondWith([
        200,
        { "content-type": "application/json" },
        JSON.stringify(
          as<ApiResponseSuggestions<null>>({
            suggestions: [
              {
                value: "suggestion value",
                unrestricted_value: "suggestion unrestricted_value",
                data: null,
              },
            ],
          })
        ),
      ]);

      await expect(
        new Api(apiOptions).fetchSuggestions("suggest", "дерибасовская")
      ).resolves.toEqual(
        as<Suggestions<null>>([
          {
            value: "suggestion value",
            unrestricted_value: "suggestion unrestricted_value",
            data: null,
          },
        ])
      );
    });

    it("should fail on server error", async () => {
      server.respondWith([
        500,
        { "content-type": "text/html" },
        "<h1>Server error report</h1>",
      ]);

      await expect(
        new Api(apiOptions).fetchSuggestions("suggest", "дерибасовская")
      ).rejects.toThrow("Internal Server Error");
    });
  });
});
