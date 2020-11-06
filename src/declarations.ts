declare module "*.sass" {
  const classes: Record<string, string>;
  export = classes;
}

declare module "*.svg" {
  const svgHtml: string;
  export = svgHtml;
}

type ValueOf<T> = T[keyof T];

/**
 * Pick properties that are functions
 */
type PickMethods<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
  }[keyof T]
>;
