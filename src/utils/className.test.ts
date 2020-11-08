import { addClass, removeClass, toClassName } from "./className";

describe("className", () => {
  describe("addClass()", () => {
    beforeEach(() => {
      document.body.className = "body-class";
    });

    it("should add class to element", () => {
      addClass(document.body, "new-class");
      expect(document.body.outerHTML).toBe(
        '<body class="body-class new-class"></body>'
      );
    });

    it("should add few classes to element", () => {
      addClass(document.body, "new-class", "new-class-2");
      expect(document.body.outerHTML).toBe(
        '<body class="body-class new-class new-class-2"></body>'
      );
    });

    it("should add classes with space", () => {
      addClass(document.body, "new-class new-class-2");
      expect(document.body.outerHTML).toBe(
        '<body class="body-class new-class new-class-2"></body>'
      );
    });

    it("should escape html-unsafe class to element", () => {
      addClass(document.body, 'with"quotes"');
      expect(document.body.outerHTML).toBe(
        '<body class="body-class with&quot;quotes&quot;"></body>'
      );
    });

    it("should do nothing if added class already exists", () => {
      addClass(document.body, "body-class");
      expect(document.body.outerHTML).toBe('<body class="body-class"></body>');
    });

    it("should ignore non-string class", () => {
      addClass(document.body, 123);
      expect(document.body.outerHTML).toBe('<body class="body-class"></body>');
    });
  });

  describe("removeClass()", () => {
    beforeEach(() => {
      document.body.className = "body-class body-class-2";
    });

    it("should remove class from element", () => {
      removeClass(document.body, "body-class");
      expect(document.body.outerHTML).toBe(
        '<body class="body-class-2"></body>'
      );
    });

    it("should remove few classes from element", () => {
      removeClass(document.body, "body-class", "body-class-2");
      expect(document.body.outerHTML).toBe('<body class=""></body>');
    });

    it("should remove classes specified with space", () => {
      removeClass(document.body, "body-class body-class-2");
      expect(document.body.outerHTML).toBe('<body class=""></body>');
    });

    it("should do nothing if removed class does not exist", () => {
      removeClass(document.body, "some-class");
      expect(document.body.outerHTML).toBe(
        '<body class="body-class body-class-2"></body>'
      );
    });
  });

  describe("toClassName()", () => {
    it("should concat classes", () => {
      expect(toClassName("class-1", "class-2")).toBe("class-1 class-2");
    });

    it("should escape html-unsafe classes", () => {
      expect(toClassName("class-1", "<b>bold</b>")).toBe(
        "class-1 &lt;b&gt;bold&lt;&#x2F;b&gt;"
      );
    });
  });
});
