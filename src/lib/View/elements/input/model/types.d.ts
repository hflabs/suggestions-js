import type { Provider } from "@/lib/Provider";
import type { PLUGIN_OPTIONS } from "@/lib/View/types";
import type { InputView } from "@/lib/View/elements/input/view/index";
import type { ContainerView } from "@/lib/View/elements/container/view/index";

export interface ModelArgs {
    view: InstanceType<typeof InputView>;
    containerView: InstanceType<typeof ContainerView>;
    provider: InstanceType<typeof Provider> | undefined;
    options: PLUGIN_OPTIONS;
}

export type UpdateModelArgs = Partial<Pick<ModelArgs, "provider" | "options">>;
