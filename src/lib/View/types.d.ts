import type { PROVIDER_OPTIONS } from "@/lib/Provider/types";
import type { AnyData, Suggestion } from "@/lib/types";

export type PLUGIN_OPTIONS<T = AnyData> = PROVIDER_OPTIONS<T> & {
    beforeRender?: (container: HTMLElement) => void;
    onInvalidateSelection?: (suggestion: Suggestion<T>) => void;
    onSelectNothing?: (query: string) => void;
    onSelect?: (suggestion: Suggestion<T>, changed: boolean) => void;
    scrollOnFocus?: boolean;
    triggerSelectOnBlur?: boolean;
    triggerSelectOnEnter?: boolean;
    triggerSelectOnSpace?: boolean;
    tabDisabled?: boolean;
    mobileWidth?: number;
    closeDelay?: number;
};
