/*
    Подставить индекс после выбора адреса
    https://codepen.io/dadata/pen/NNqrrW
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const addressInput = document.getElementById("address");
const postalInput = document.getElementById("postal_code");

function showPostalCode(suggestion) {
    postalInput.value = suggestion.data.postal_code;
}

function clearPostalCode() {
    postalInput.value = "";
}

createSuggestions(addressInput, {
    token,
    type: "address",
    onSelect: showPostalCode,
    onSelectNothing: clearPostalCode,
});
