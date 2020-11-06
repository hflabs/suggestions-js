import { splitToTokens, splitToChunks } from "./highlightMatches";

describe("highlightMatches.ts", () => {
  describe("splitToTokens()", () => {
    it("should split simple words", () => {
      expect(splitToTokens("Москва, Кремль")).toEqual(["москва", "кремль"]);
    });

    it("should split complex words", () => {
      expect(splitToTokens("Москва, Тверская-Ямская")).toEqual([
        "москва",
        "тверская-ямская",
        "тверская",
        "ямская",
      ]);
    });

    it("should put words from unformattableTokens to the end", () => {
      expect(
        splitToTokens("Москва, Тверская-Ямская", ["москва", "тверская"])
      ).toEqual(["тверская-ямская", "ямская", "москва", "тверская"]);
    });
  });

  describe("splitToChunks()", () => {
    it("should split simple words", () => {
      expect(splitToChunks("Москва, Кремль")).toEqual([
        {
          text: "Москва",
          token: "москва",
          hasUpperCase: true,
          matchable: true,
          matched: false,
        },
        {
          text: ", ",
          token: "",
          hasUpperCase: false,
          matchable: false,
          matched: false,
        },
        {
          text: "Кремль",
          token: "кремль",
          hasUpperCase: true,
          matchable: true,
          matched: false,
        },
      ]);
    });
  });
});
