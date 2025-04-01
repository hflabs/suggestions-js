/*
    Предзаполнение сохраненного ФИО
    https://codepen.io/dadata/pen/XNwvgG
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const nameInput = document.getElementById("name");

const { createSuggestions } = window.Dadata;

const suggestions = createSuggestions(nameInput, {
    token,
    type: "name",
});

nameInput.addEventListener("suggestions-fixdata", (e) => {
    console.log("Подсказка восстановлена:");
    console.log(e.detail.suggestion);
});

suggestions.fixData(nameInput.value);
