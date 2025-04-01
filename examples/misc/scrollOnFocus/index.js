/*
    Мобильная версия подсказок
    https://codepen.io/dadata/pen/azojLW
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

createSuggestions(document.getElementById("address"), {
    token,
    type: "address",
    scrollOnFocus: true,
});

createSuggestions(document.getElementById("name"), {
    token,
    type: "name",
    scrollOnFocus: true,
});

createSuggestions(document.getElementById("party"), {
    token,
    type: "party",
    scrollOnFocus: true,
    mobileWidth: 768, // можно задать свое значение брейкпоинта для мобильных устройств
});

createSuggestions(document.getElementById("email"), {
    token,
    type: "email",
    scrollOnFocus: true,
});

createSuggestions(document.getElementById("bank"), {
    token,
    type: "bank",
    scrollOnFocus: true,
});
