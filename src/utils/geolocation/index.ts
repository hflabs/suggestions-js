import type { Suggestion } from "@/lib/types";
import type { API_OPTIONS } from "@/lib/Provider/includes/api/types";

import { getFetchParams, makeRequest } from "@/lib/Provider/includes/api";
import { API_ENDPOINTS } from "@/lib/Provider/includes/api/api.constants";

type LocationSuggestion = { location: Suggestion<{ kladr_id: string }> | null };

/**
 * @typedef {Object} LocationData
 * @property {string} kladr_id
 */

/**
 * @typedef {Object} Location
 * @property {string} value
 * @property {string} unrestricted_value
 * @property {LocationData} data
 */

/**
 * Определяет код КЛАДР города (kladr_id) по IP-адресу
 * @param {API_OPTIONS} options
 * @returns {Location | null} объект локации
 */
export const getLocation = async (options: API_OPTIONS = {}) => {
    const { url, method, params } = getFetchParams(options, API_ENDPOINTS.iplocate);

    const { data } = await makeRequest<LocationSuggestion>(url, method, params);

    return data?.location || null;
};
