import { hasQcField, hasQualityCode } from "./suggestion";

describe("suggestion", () => {
  describe("hasQcField()", () => {
    it('should return true if "qc" field present', () => {
      expect(hasQcField({ qc: undefined })).toBe(true);
    });

    it('should return false if "qc" field absent', () => {
      expect(hasQcField({})).toBe(false);
    });

    it("should return false if data is not a plain object", () => {
      expect(hasQcField(null)).toBe(false);
      expect(hasQcField(undefined)).toBe(false);
      expect(hasQcField("qc")).toBe(false);
    });
  });

  describe("hasQualityCode()", () => {
    it('should return true if "qc" is set', () => {
      expect(hasQualityCode({ qc: "0" })).toBe(true);
      expect(hasQualityCode({ qc: "" })).toBe(true);
    });

    it('should return false if "qc" presents but to null', () => {
      expect(hasQualityCode({ qc: null })).toBe(false);
    });

    it("should return false if data is not a plain object", () => {
      expect(hasQualityCode(123)).toBe(false);
      expect(hasQualityCode(null)).toBe(false);
      expect(hasQualityCode(undefined)).toBe(false);
      expect(hasQualityCode("qc")).toBe(false);
    });
  });
});
