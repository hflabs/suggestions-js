/*
    Включить или отключить подсказки
    https://codepen.io/dadata/pen/NqJwEp
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const addressInput = document.getElementById("address");
const enableBtn = document.getElementById("on");
const disableBtn = document.getElementById("off");

const suggestions = createSuggestions(addressInput, {
    token,
    type: "address",
    onSelect(suggestion) {
        console.log(suggestion);
    },
});

enableBtn.addEventListener("click", () => {
    suggestions.enable();
});

disableBtn.addEventListener("click", () => {
    suggestions.disable();
});
