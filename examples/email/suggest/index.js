/*
    Подсказки по email
    https://codepen.io/dadata/pen/wBwWRv
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const emailInput = document.getElementById("email");

createSuggestions(emailInput, {
    token,
    type: "email",
    /* Вызывается, когда пользователь выбирает одну из подсказок */
    onSelect(suggestion) {
        console.log(suggestion);
    },
});
