import { Suggestions } from "../src/types";

export const createSuggestions = (count: number): Suggestions<null> =>
  Array.from(new Array(count)).map((_, i) => ({
    value: `value ${i}`,
    unrestricted_value: `unrestricted_value ${i}`,
    data: null,
  }));
