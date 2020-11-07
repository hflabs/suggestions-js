import { splitToTokens, splitToChunks, ValueChunk } from "./highlightMatches";
import { as } from "./as";

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
      expect(splitToChunks("Москва, Кремль")).toEqual(
        as<ValueChunk[]>([
          {
            text: "Москва",
            token: "москва",
            matched: false,
          },
          {
            text: ", ",
            token: "",
            matched: false,
          },
          {
            text: "Кремль",
            token: "кремль",
            matched: false,
          },
        ])
      );
    });
  });
});
