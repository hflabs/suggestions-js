/*
    Форматирование: улица и дом в начале адреса
    https://codepen.io/dadata/pen/poyQQj
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const addressInput = document.getElementById("address");

const { createSuggestions } = window.Dadata;

function join(arr, separator = ", ") {
    return arr.filter((n) => n).join(separator);
}

function makeAddressString(address) {
    return join([
        join([address.street_type, address.street], " "),
        join([address.house_type, address.house, address.block_type, address.block], " "),
        join([address.settlement_type, address.settlement], " "),
        (address.city !== address.region && join([address.city_type, address.city], " ")) || "",
        join([address.area_type, address.area], " "),
        join([address.region_type, address.region], " "),
    ]);
}

function formatResult(_value, _currentValue, suggestion) {
    return makeAddressString(suggestion.data);
}

function formatSelected(suggestion) {
    return makeAddressString(suggestion.data);
}

createSuggestions(addressInput, {
    token,
    type: "address",
    formatResult,
    formatSelected,
    onSelect(suggestion) {
        console.log(suggestion);
    },
});
