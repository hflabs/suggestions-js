import {
  splitToTokens,
  splitToChunks,
  ValueChunk,
  chunksToHtml,
  highlightMatches,
} from "./highlightMatches";
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

    it("should split words with punctuation", () => {
      expect(splitToChunks("снт Дорожник (Усады)")).toEqual(
        as<ValueChunk[]>([
          {
            text: "снт",
            token: "снт",
            matched: false,
          },
          {
            text: " ",
            token: "",
            matched: false,
          },
          {
            text: "Дорожник",
            token: "дорожник",
            matched: false,
          },
          {
            text: " (",
            token: "",
            matched: false,
          },
          {
            text: "Усады",
            token: "усады",
            matched: false,
          },
          {
            text: ")",
            token: "",
            matched: false,
          },
        ])
      );
    });

    it("should split words with numbers", () => {
      expect(splitToChunks("ул 50-летия Октября")).toEqual(
        as<ValueChunk[]>([
          {
            text: "ул",
            token: "ул",
            matched: false,
          },
          {
            text: " ",
            token: "",
            matched: false,
          },
          {
            text: "50-летия",
            token: "50-летия",
            matched: false,
          },
          {
            text: " ",
            token: "",
            matched: false,
          },
          {
            text: "Октября",
            token: "октября",
            matched: false,
          },
        ])
      );
    });

    it("should split phrases starting with delimiter", () => {
      expect(splitToChunks("(ул Октября)")).toEqual(
        as<ValueChunk[]>([
          {
            text: "(",
            token: "",
            matched: false,
          },
          {
            text: "ул",
            token: "ул",
            matched: false,
          },
          {
            text: " ",
            token: "",
            matched: false,
          },
          {
            text: "Октября",
            token: "октября",
            matched: false,
          },
          {
            text: ")",
            token: "",
            matched: false,
          },
        ])
      );
    });

    it("should split phrases ending with delimiter", () => {
      expect(splitToChunks("ул Октября (бывш. Октябрьская)")).toEqual(
        as<ValueChunk[]>([
          {
            text: "ул",
            token: "ул",
            matched: false,
          },
          {
            text: " ",
            token: "",
            matched: false,
          },
          {
            text: "Октября",
            token: "октября",
            matched: false,
          },
          {
            text: " (",
            token: "",
            matched: false,
          },
          {
            text: "бывш",
            token: "бывш",
            matched: false,
          },
          {
            text: ". ",
            token: "",
            matched: false,
          },
          {
            text: "Октябрьская",
            token: "октябрьская",
            matched: false,
          },
          {
            text: ")",
            token: "",
            matched: false,
          },
        ])
      );
    });
  });

  describe("chunksToHtml()", () => {
    it("should wrap matched chunks with <strong>", () => {
      expect(
        chunksToHtml([
          { text: "г", token: "г", matched: false },
          { text: " ", token: "", matched: false },
          { text: "Москва", token: "москва", matched: true },
        ])
      ).toBe("г <strong>Москва</strong>");
    });

    it("should return html-safe string", () => {
      expect(
        chunksToHtml([
          { text: "г", token: "г", matched: false },
          { text: " ", token: "", matched: false },
          { text: "<b>Москва</b>", token: "москва", matched: true },
        ])
      ).toBe("г <strong>&lt;b&gt;Москва&lt;&#x2F;b&gt;</strong>");
    });
  });

  describe("highlightMatches()", () => {
    it("should highlight whole words", () => {
      expect(highlightMatches("г Москва", "Москва")).toBe(
        "г <strong>Москва</strong>"
      );
    });

    it("should highlight beginning of word", () => {
      expect(highlightMatches("г Москва", "Мос")).toBe(
        "г <strong>Мос</strong>ква"
      );
    });

    it("should highlight parts of word", () => {
      expect(highlightMatches("Тверская-Ямская", "Тверская")).toBe(
        "<strong>Тверская</strong>-Ямская"
      );
    });

    it("should highlight consequent parts of word", () => {
      expect(highlightMatches("Тверская-Ямская", "Ямская")).toBe(
        "Тверская-<strong>Ямская</strong>"
      );
    });

    it("should highlight compound word", () => {
      expect(highlightMatches("Тверская-Ямская", "Тверская-Ямская")).toBe(
        "<strong>Тверская-Ямская</strong>"
      );
    });

    it("should highlight few parts of compound word", () => {
      expect(highlightMatches("Тверская-Ямская", "Тверская Ямская")).toBe(
        "<strong>Тверская</strong>-<strong>Ямская</strong>"
      );
    });

    it("should highlight in the middle", () => {
      expect(
        highlightMatches("г Казань, тер снт Дорожник (Усады)", "Дорожник Усады")
      ).toBe(
        "г Казань, тер снт <strong>Дорожник</strong> (<strong>Усады</strong>)"
      );
    });

    it("should try not to highlight unformattableTokens", () => {
      expect(
        highlightMatches("ул Ульяновская", "ул", {
          unformattableTokens: ["ул"],
        })
      ).toBe("ул <strong>Ул</strong>ьяновская");
    });

    it("should shorten a string in maxLength option set", () => {
      expect(
        highlightMatches(
          "г Казань, тер снт Дорожник (Усады)",
          "Дорожник Усады",
          { maxLength: 10 }
        )
      ).toBe("г Казань, ");

      expect(
        highlightMatches(
          "г Казань, тер снт Дорожник (Усады)",
          "Дорожник Усады",
          { maxLength: 20 }
        )
      ).toBe("г Казань, тер снт <strong>До...</strong>");
    });
  });
});
