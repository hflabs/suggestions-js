import { ISuggestion } from "../types";
import { deepEqual } from "./deepEqual";

export const areSuggestionsSame = (
  a?: ISuggestion<unknown> | null,
  b?: ISuggestion<unknown> | null
): boolean => !!a && !!b && a.value === b.value && deepEqual(a.data, b.data);

interface SuggestionDatWithQc {
  qc?: string | null;
}

export const hasQcField = (data: unknown): data is SuggestionDatWithQc =>
  Boolean(data && typeof data === "object" && "qc" in data);

export const hasQualityCode = (suggestion: ISuggestion<unknown>): boolean => {
  const { data } = suggestion;

  return hasQcField(data) && data.qc != null;
};
