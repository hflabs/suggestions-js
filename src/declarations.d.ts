declare module "*.sass" {
  const classes: Record<string, string>;
  export = classes;
}

declare module "*.svg" {
  const svgHtml: string;
  export = svgHtml;
}
