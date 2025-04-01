/*
    Сохранить информацию о геолокации
    https://codepen.io/dadata/pen/poZYyy
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const addressInput = document.getElementById("address");
const postalCode = document.getElementById("postal_code");

const { createSuggestions } = window.Dadata;

const addressSuggs = createSuggestions(addressInput, {
    type: "address",
    token,
    onSelect: showPostalCode,
});

// получить текущую геолокацию и установить ее для поля
addressSuggs.getLocation().then((location) => {
    if (location) addressSuggs.setSuggestion(location);
    showPostalCode(location);
});

function showPostalCode(suggestion) {
    const code = suggestion?.data.postal_code || "не определён";
    postalCode.value = code;
}
