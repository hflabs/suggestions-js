// Фабрика для создания стратегии подсказок по типу
// Возвращает инстанс конкретного или базового типа.

import type { SuggestionsType } from "@/lib/types";
import type { ISuggestionsStrategy } from "@provider_strategy/types";

import { BaseSuggestionsStrategy } from "./strategies/BaseSuggestionsStrategy";
import { AddressStrategy } from "./strategies/address/AddressStrategy";
import { BankStrategy } from "./strategies/bank/BankStrategy";
import { EmailStrategy } from "./strategies/email/EmailStrategy";
import { FiasStrategy } from "./strategies/fias/FiasStrategy";
import { NameStrategy } from "./strategies/name/NameStrategy";
import { PartyStrategy } from "./strategies/party/PartyStrategy";

type SuggestionStrategy = ISuggestionsStrategy;
type Strategies = { [key in SuggestionsType | "outward"]: typeof BaseSuggestionsStrategy };

const strategies: Strategies = {
    address: AddressStrategy,
    name: NameStrategy,
    party: PartyStrategy,
    bank: BankStrategy,
    email: EmailStrategy,
    fias: FiasStrategy,
    outward: BaseSuggestionsStrategy,
};

export const getStrategy = (type: SuggestionsType): SuggestionStrategy => {
    const Strategy = strategies[type] || strategies.outward;

    return new Strategy(type);
};
