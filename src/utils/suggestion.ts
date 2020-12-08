interface SuggestionDataWithQc {
  qc?: string | null;
}

export const hasQcField = (data: unknown): data is SuggestionDataWithQc =>
  Boolean(data && typeof data === "object" && "qc" in data);

export const hasQualityCode = (data: unknown): boolean =>
  hasQcField(data) && data.qc != null;
