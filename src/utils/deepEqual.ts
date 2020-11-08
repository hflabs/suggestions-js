/**
 * Compares primitives by strict equal, objects (Arrays, RegExps, Dates, etc.) by each field.
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (typeof a !== typeof b) return false;

  switch (typeof a) {
    case "object":
      if (a === null && b === null) return true;
      if (a === null || b === null) return false;

      if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
      }

      return Object.keys(a).every((key) =>
        deepEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        )
      );

    case "number":
      if (isNaN(a)) return isNaN(b as number);
      break;
    case "symbol":
      return a.toString() === (b as symbol).toString();
  }

  return a === b;
};
