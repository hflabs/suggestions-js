/*
    Анимация списка подсказок
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const addressInput = document.getElementById("address");

const { createSuggestions } = window.Dadata;

createSuggestions(addressInput, {
    token,
    type: "address",
    closeDelay: 200, // значение animation-duration в css
});
