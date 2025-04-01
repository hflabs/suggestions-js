export const API_ENDPOINTS = {
    suggest: "suggest" as const,
    iplocate: "iplocate/address" as const,
    status: "status" as const,
    findById: "findById" as const,
};

export const BASE_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs";

export const DEFAULT_TIMEOUT = 3000;

export const API_ENDPOINTS_OPTIONS = {
    [API_ENDPOINTS.suggest]: {
        method: "POST" as const,
        useSlug: true,
    },
    [API_ENDPOINTS.iplocate]: {
        method: "GET" as const,
        useSlug: false,
    },
    [API_ENDPOINTS.status]: {
        method: "GET" as const,
        useSlug: true,
    },
    [API_ENDPOINTS.findById]: {
        method: "POST" as const,
        useSlug: true,
    },
};
