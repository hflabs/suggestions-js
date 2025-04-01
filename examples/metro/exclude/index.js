/*
    Подсказки по адресам без метро
    https://codepen.io/dadata/pen/eYZybyW
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const addressInput = document.getElementById("address");

createSuggestions(addressInput, { token, type: "address", onSuggestionsFetch: removeMetro });

function removeMetro(suggestions) {
    return suggestions.filter((suggestion) => suggestion.data.street_type_full !== "метро");
}
