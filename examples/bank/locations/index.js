/*
    Отфильтровать банки по городу
    https://codepen.io/dadata/pen/dypZPqq
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const bankInput = document.getElementById("bank");

const { createSuggestions } = window.Dadata;

createSuggestions(bankInput, {
    token,
    type: "bank",
    params: { locations: [{ kladr_id: "6300000100000" }] },
    onSelect(suggestion) {
        console.log(suggestion);
    },
});
