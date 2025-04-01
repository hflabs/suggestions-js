import type { AnyData, ExplicitSuggestionsTypes } from "@/lib/types";
import type { PLUGIN_OPTIONS } from "@/lib/View/types";
import type { WRAPPER_PARENT_FIELD } from "./granular.constants";
import { Plugin } from "../types";
import { PluginWithSpy } from "../optionsSpy/types";

export type EnrichedPlugin = PluginWithSpy & {
    [WRAPPER_PARENT_FIELD]: EnrichedPlugin;
};

type GranularType = "address" | "fias";
type AnyStringType = string & NonNullable<unknown>;
type NonGranularType = Exclude<ExplicitSuggestionsTypes, GranularType>;

export type GranularArgs<T extends AnyData, O extends PLUGIN_OPTIONS<T>> =
    | [options: O & { type: GranularType }, parentInstance?: Plugin<T>]
    | [options: O & { type: NonGranularType }]
    | [options: O & { type: AnyStringType }];

export type Locations = Record<string, unknown>[] | undefined;
export type Options<T extends AnyData = AnyData> = PLUGIN_OPTIONS<T>;
