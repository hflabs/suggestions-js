/*
    Подсказывать только домен в email
    https://codepen.io/dadata/pen/raBrje
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const emailInput = document.getElementById("email");

createSuggestions(emailInput, {
    token,
    type: "email",
    suggest_local: false,
    onSelect(suggestion) {
        console.log(suggestion);
    },
});
