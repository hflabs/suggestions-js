export default (suggestion: Record<string, unknown>) => ({
    ...suggestion,
    unrestricted_value: suggestion.value,
    data: typeof suggestion.data === "object" ? suggestion.data : {},
});
