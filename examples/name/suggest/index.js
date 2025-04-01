/*
    Подсказки по ФИО
    https://codepen.io/dadata/pen/PoWBEp
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const nameInput = document.getElementById("fullname");

const { createSuggestions } = window.Dadata;

createSuggestions(nameInput, {
    token,
    type: "name",
    onSelect(suggestion) {
        console.log(suggestion);
    },
});
