/**
 * Compares two entities. If tha are objects, compare them field by fields
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (typeof a !== typeof b) return false;

  if (typeof a === "object" && typeof b === "object" && a && b) {
    return Object.keys(a).every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  return a === b;
};
