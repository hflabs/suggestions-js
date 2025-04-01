/*
    Изменить количество подсказок
    https://codepen.io/dadata/pen/dyKZyg
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const addressInput = document.getElementById("address");

createSuggestions(addressInput, {
    token,
    type: "address",
    params: {
        count: 7, // количество подсказок в списке, не более 20
    },
});
