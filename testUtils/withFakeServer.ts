import sinon, { SinonFakeServer } from "sinon";
import { Status, Suggestions } from "../src/types";
import { ApiResponseSuggestions } from "../src/classes/Api";
import { waitPromisesResolve } from "./waitPromisesResolve";

export const respondWithJSON = async <Payload = unknown>(
  server: SinonFakeServer,
  payload: Payload
) => {
  server.respondWith([
    200,
    { "Content-type": "application/json" },
    JSON.stringify(payload),
  ]);
  server.respond();
  await waitPromisesResolve();
};

export const respondWithStatus = async (
  server: SinonFakeServer,
  status: Partial<Status>
): Promise<void> => {
  await respondWithJSON(server, status);
};

export const respondWithSuggestions = async <SuggestionData = unknown>(
  server: SinonFakeServer,
  suggestions: Suggestions<SuggestionData>
): Promise<void> => {
  await respondWithJSON<ApiResponseSuggestions<SuggestionData>>(server, {
    suggestions,
  });
};

interface FakeServer extends SinonFakeServer {
  respondWithJSON: <Payload = unknown>(
    server: SinonFakeServer,
    payload: Payload
  ) => Promise<void>;
  respondWithSuggestions: <SuggestionData = unknown>(
    suggestions: Suggestions<SuggestionData>
  ) => Promise<void>;
}

export const withFakeServer = (
  fn: (server: FakeServer) => Promise<void> | void
): Promise<void> | void => {
  const server = sinon.useFakeServer();
  const cleanup = () => server.restore();
  const result = fn({
    ...server,
    respondWithJSON: <Payload = unknown>(payload: Payload) =>
      respondWithJSON(server, payload),
    respondWithSuggestions: <SuggestionData = unknown>(
      suggestions: Suggestions<SuggestionData>
    ) => respondWithSuggestions(server, suggestions),
  });

  if (result instanceof Promise) return result.finally(cleanup);

  cleanup();
  return result;
};
