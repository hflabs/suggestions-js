/*
    Убрать конкретный город из подсказок
    https://codepen.io/dadata/pen/jVjBQp
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const addressInput = document.getElementById("address");

function removeNorilsk(suggestions) {
    return suggestions.filter((suggestion) => suggestion.data.city !== "Норильск");
}

createSuggestions(addressInput, {
    type: "address",
    token,
    params: { locations: [{ kladr_id: "24" }] },
    onSuggestionsFetch: removeNorilsk,
});
