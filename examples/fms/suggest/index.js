/*
    Кем выдан паспорт (код + наименование)
    https://codepen.io/dadata/pen/eXwdBP
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const nameInput = document.getElementById("name");
const codeInput = document.getElementById("code");

function formatResult(_value, _currentValue, suggestion) {
    suggestion.value = suggestion.data.code;
    return `${suggestion.data.code} — ${suggestion.data.name}`;
}

function showSuggestion(suggestion) {
    console.log(suggestion);
    nameInput.value = suggestion.data.name;
}

function clearSuggestion() {
    nameInput.value = "";
}

createSuggestions(codeInput, {
    token,
    type: "fms_unit",
    formatResult,
    onSelect: showSuggestion,
    onSelectNothing: clearSuggestion,
});
