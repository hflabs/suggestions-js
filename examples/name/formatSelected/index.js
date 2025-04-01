/*
    Форматирование: сначала имя, затем фамилия
    https://codepen.io/dadata/pen/BPQbeR
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const fullnameInput = document.getElementById("fullname");

const { createSuggestions } = window.Dadata;

createSuggestions(fullnameInput, {
    token,
    type: "name",
    formatSelected: formatName,
});

function formatName(suggestion) {
    return [suggestion.data.name, suggestion.data.surname].filter(Boolean).join(" ");
}
