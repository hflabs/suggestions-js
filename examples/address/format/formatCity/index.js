/*
    Ограничение области поиска: только города
    https://codepen.io/dadata/pen/dyWpNM
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const addressInput = document.getElementById("address");

const { createSuggestions } = window.Dadata;

createSuggestions(addressInput, {
    token,
    type: "address",
    hint: false,
    params: {
        from_bound: { value: "city" },
        to_bound: { value: "city" },
        locations: [{ city_type_full: "город" }],
    },
    beforeFormat,
    formatSelected,
    onSelect(suggestion) {
        console.log(suggestion);
    },
});

function beforeFormat(suggestion) {
    const newValue = suggestion.data.city;
    suggestion.value = newValue;
    return suggestion;
}

function formatSelected(suggestion) {
    return suggestion.data.city;
}
