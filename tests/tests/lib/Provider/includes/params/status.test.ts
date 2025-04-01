/* eslint-disable no-new */
import { describe, test, expect, vi, beforeEach, beforeAll } from "vitest";

import { getStrategy } from "@/lib/Provider/includes/strategy";
import { Provider } from "@/lib/Provider/index";
import { StatusProvider } from "@/lib/Provider/includes/suggestions/includes/status";

type callWithHeaders = { headers: { [k: string]: string } };

describe("Status features", () => {
    describe("Single instance", () => {
        const token = "1234";

        const strategy = getStrategy("name");
        const statusProvider = new StatusProvider(
            {
                type: "name",
                token,
            },
            strategy
        );

        beforeEach(() => {
            global.fetchMocker.mockClear();
        });

        beforeAll(() => {
            global.fetchMocker.mockClear();
        });

        test("should send status request with token", async () => {
            const newToken = `${Math.random()}${token}`;
            statusProvider.updateOptions(
                {
                    type: "name",
                    token: newToken,
                },
                strategy
            );

            await global.wait(0);

            const { headers } = (global.fetchMocker.mock.calls[0][1] || {}) as callWithHeaders;

            expect(global.fetchMocker).toHaveBeenCalledTimes(1);
            expect(global.fetchMocker.mock.calls[0][0]).toMatch(/status\/fio/);
            expect(headers.Authorization).toStrictEqual(`Token ${newToken}`);
        });

        test("should send status request without token", async () => {
            statusProvider.updateOptions({ type: "name" }, strategy);

            const { headers } = (global.fetchMocker.mock.calls[0][1] || {}) as callWithHeaders;

            expect(global.fetchMocker).toHaveBeenCalledTimes(1);
            expect(global.fetchMocker.mock.calls[0][0]).toMatch(/status\/fio/);
            expect(headers.Authorization).toBeUndefined();
        });

        test("should invoke `onSearchError` callback if status request failed", async () => {
            const errorSpy = vi.fn();

            global.fetchMocker.mockOnce("{}", {
                status: 401,
                statusText: "Not Authorized",
            });

            statusProvider.updateOptions(
                {
                    type: "name",
                    token: "456",
                    onSearchError: errorSpy,
                },
                strategy
            );

            await global.wait(0);

            expect(errorSpy).toHaveBeenCalled();
        });

        test("should use url param (if it passed) instead of serviceUrl", async () => {
            statusProvider.updateOptions(
                {
                    type: "name",
                    token: "6789",
                    url: "http://unchangeable/url",
                },
                strategy
            );

            expect(global.fetchMocker).toHaveBeenCalledTimes(1);
            expect(global.fetchMocker.mock.calls[0][0]).toStrictEqual("http://unchangeable/url");
        });
    });

    describe("Several instances with the same token", () => {
        const getProviders = () => {
            const token = `${Math.random()}token`;

            return {
                provider: new Provider(
                    {
                        type: "name",
                        token,
                    },
                    () => false
                ),
                provider2: new Provider(
                    {
                        type: "name",
                        token,
                    },
                    () => false
                ),
                token,
            };
        };

        beforeEach(() => {
            global.fetchMocker.mockClear();
        });

        test("should use the same authorization query", async () => {
            expect(global.fetchMocker).toHaveBeenCalledTimes(0);

            getProviders();

            await global.wait(0);

            expect(global.fetchMocker).toHaveBeenCalledTimes(1);
        });

        test("should make another request for controls of different types", async () => {
            expect(global.fetchMocker).toHaveBeenCalledTimes(0);

            const { provider, token } = getProviders();

            provider.updateOptions({
                type: "address",
                token,
            });

            await global.wait(0);

            expect(global.fetchMocker).toHaveBeenCalledTimes(2);
        });

        test("should invoke `onSearchError` callback on controls with same type and token", async () => {
            const errorSpy = vi.fn();
            const { provider2, token } = getProviders();

            provider2.updateOptions({
                type: "name",
                token,
                onSearchError: errorSpy,
            });

            global.fetchMocker.mockOnce("{}", {
                status: 401,
                statusText: "Not Authorized",
            });

            await global.wait(0);

            expect(errorSpy).toHaveBeenCalled();
        });
    });
});
