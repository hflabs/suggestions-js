import { IInitOptions, ISuggestion } from "./types";
import Suggestions from "./Suggestions";
import { defaultOptions } from "./defaultOption";
import MapPolifill from "./utils/Map";

const instances = new (WeakMap || MapPolifill)<
  HTMLInputElement,
  Suggestions<unknown>
>();

export const init = <D = any>(
  el: HTMLInputElement,
  options: Partial<IInitOptions<D>> & Pick<IInitOptions<D>, "type">
) => {
  if (!options.type) throw new Error('Option "type" in required.');

  instances.get(el)?.dispose();

  const instance = new Suggestions<D>(el, { ...defaultOptions, ...options });

  instances.set(el, instance);

  return () => instances.delete(el);
};

export const fixData = <D = any>(
  el: HTMLInputElement
): Promise<ISuggestion<D> | null> => {
  const instance = instances.get(el);

  return instance
    ? instance.fixData()
    : Promise.reject(
        new Error("Suggestions are not instantiated on this element.")
      );
};
