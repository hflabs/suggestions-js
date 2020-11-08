import sinon, { SinonFakeServer } from "sinon";
import { Suggestions } from "../src/types";
import { ApiResponseSuggestions } from "../src/classes/Api";
import { waitPromisesResolve } from "./waitPromisesResolve";

export const respondWithJSON = async <T = unknown>(
  server: SinonFakeServer,
  payload: T
) => {
  server.respondWith([
    200,
    { "Content-type": "application/json" },
    JSON.stringify(payload),
  ]);
  server.respond();
  await waitPromisesResolve();
};

export const respondWithSuggestions = async <D = unknown>(
  server: SinonFakeServer,
  suggestions: Suggestions<D>
): Promise<void> => {
  await respondWithJSON<ApiResponseSuggestions<D>>(server, {
    suggestions,
  });
};

interface FakeServer extends SinonFakeServer {
  respondWithJSON: <T = unknown>(
    server: SinonFakeServer,
    payload: T
  ) => Promise<void>;
  respondWithSuggestions: <D = unknown>(
    suggestions: Suggestions<D>
  ) => Promise<void>;
}

export const withFakeServer = async (
  fn: (server: FakeServer) => Promise<void> | void
): Promise<void> => {
  const server = sinon.useFakeServer();

  await fn({
    ...server,
    respondWithJSON: <T = unknown>(payload: T) =>
      respondWithJSON(server, payload),
    respondWithSuggestions: <D = unknown>(suggestions: Suggestions<D>) =>
      respondWithSuggestions(server, suggestions),
  });

  server.restore();
};
