/*
    Кем выдан паспорт (только наименование)
    https://codepen.io/dadata/pen/jJgEPw
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const nameInput = document.getElementById("name");

function formatResult(_value, _currentValue, suggestion) {
    return `${suggestion.data.code} — ${suggestion.data.name}`;
}

createSuggestions(nameInput, { token, type: "fms_unit", formatResult });
