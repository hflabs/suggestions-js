import { createElement } from "./createElement";

describe("createElement()", () => {
  it("should create HTML element", () => {
    const el: HTMLDivElement = createElement("div");

    expect(el).toBeInstanceOf(Element);
    expect(el).toMatchObject({
      nodeType: Node.ELEMENT_NODE,
      tagName: "DIV",
      outerHTML: "<div></div>",
    });
  });

  it("should assign properties to created element", () => {
    const el: HTMLDivElement = createElement("div", {
      className: "some-class",
      textContent: "text content of <div> element",
    });

    expect(el.className).toBe("some-class");
    expect(el.outerHTML).toBe(
      '<div class="some-class">text content of &lt;div&gt; element</div>'
    );
  });
});
