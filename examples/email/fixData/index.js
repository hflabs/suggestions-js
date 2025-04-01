/*
    Предзаполнение сохраненного email
    https://codepen.io/dadata/pen/MbdNOz
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const emailInput = document.getElementById("email");

const { createSuggestions } = window.Dadata;

const suggestions = createSuggestions(emailInput, {
    token,
    type: "email",
});

emailInput.addEventListener("suggestions-fixdata", (e) => {
    console.log("Подсказка восстановлена:");
    console.log(e.detail.suggestion);
});

suggestions.fixData(emailInput.value);
