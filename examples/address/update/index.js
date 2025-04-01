/*
    Подсказки по кнопке
    https://codepen.io/dadata/pen/XeMGKy
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const addressInput = document.getElementById("address");
const showBtn = document.getElementById("show");

const { createSuggestions } = window.Dadata;

const suggestions = createSuggestions(addressInput, {
    token,
    type: "address",
    minChars: 1000,
});

showBtn.addEventListener("click", () => suggestions.updateSuggestions());
