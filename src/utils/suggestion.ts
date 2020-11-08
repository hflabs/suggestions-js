interface SuggestionDatWithQc {
  qc?: string | null;
}

export const hasQcField = (data: unknown): data is SuggestionDatWithQc =>
  Boolean(data && typeof data === "object" && "qc" in data);

export const hasQualityCode = (data: unknown): boolean =>
  hasQcField(data) && data.qc != null;
