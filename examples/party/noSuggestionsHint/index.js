/*
    Собственное сообщение, если компания не найдена
    https://codepen.io/dadata/pen/eqjRdX
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const partyInput = document.getElementById("party");

const { createSuggestions } = window.Dadata;

createSuggestions(partyInput, {
    token,
    type: "party",
    count: 5,
    noSuggestionsHint: "В первый раз вижу такую компанию",
});
