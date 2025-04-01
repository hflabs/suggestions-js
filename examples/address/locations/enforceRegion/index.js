/*
    Адреса внутри конкретного региона
    https://codepen.io/dadata/pen/KQXBbv
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const addressInput = document.getElementById("address");
const regionInput = document.getElementById("region");

const addressSuggestions = createSuggestions(addressInput, {
    token,
    type: "address",
});

createSuggestions(regionInput, {
    token,
    type: "address",
    params: {
        from_bound: { value: "region" },
        to_bound: { value: "region" },
    },
    onSelect: enforceRegion,
});

function enforceRegion(suggestion) {
    addressSuggestions.clear();
    addressSuggestions.setOptions({
        params: {
            locations: [{ kladr_id: suggestion.data.kladr_id }],
            restrict_value: true,
        },
    });
}
