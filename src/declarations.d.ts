declare module "*.sass" {
  const classes: Record<string, string>;
  export = classes;
}

declare module "*.svg" {
  const svgHtml: string;
  export = svgHtml;
}

// Defined via webpack.DefinePlugin
declare const DEFINED_VERSION: string;
