/*
    Форматирование: адрес без области и района
    https://codepen.io/dadata/pen/qdwPdZ
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const addressInput = document.getElementById("address");

const { createSuggestions, getBoundedValue } = window.Dadata;

createSuggestions(addressInput, {
    token,
    type: "address",
    hint: false,
    beforeFormat,
    formatSelected,
});

function makeAddressString(suggestion) {
    return getBoundedValue({
        bounds: { from_bound: { value: "city" }, to_bound: { value: "flat" } },
        suggestion,
        type: "address",
    });
}

function beforeFormat(suggestion) {
    const address = suggestion.data;
    // в подсказке нет города или н/п - отобразить как есть
    if ((address.region || address.area) && !address.city && !address.settlement) {
        return suggestion;
    }

    // получить значение подсказки в границах от города до квартиры
    const newValue = makeAddressString(suggestion) || suggestion.value;

    suggestion.value = newValue;
    return suggestion;
}

function formatSelected(suggestion) {
    return makeAddressString(suggestion);
}
