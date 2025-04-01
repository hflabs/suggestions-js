/*
    Подсказки по метро
    https://codepen.io/dadata/pen/wEWXpy
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const addressInput = document.getElementById("address");

createSuggestions(addressInput, { token, type: "metro" });
