/*
    Подсказки по ИНН
    https://codepen.io/dadata/pen/WvmWGX
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const partyInput = document.getElementById("party");

const { createSuggestions } = window.Dadata;

createSuggestions(partyInput, {
    token,
    type: "party",
    count: 5,
    // начинаем показывать Подсказки только с 10 символа
    minChars: 10,
    formatSelected,
});

function formatSelected(suggestion) {
    return suggestion.data.inn || "";
}
