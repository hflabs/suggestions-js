/*
    Запретить автоисправление (адрес)
    https://codepen.io/dadata/pen/OPdJpG
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const addressInput = document.getElementById("address");
const addressAutoCorrectInput = document.getElementById("address_autocorrect");

const { createSuggestions } = window.Dadata;

createSuggestions(addressInput, {
    token,
    type: "address",
    // запретить автоисправление по пробелу
    triggerSelectOnSpace: false,
    // запрещаем автоподстановку по Enter
    triggerSelectOnEnter: false,
    // запретить автоисправление при выходе из текстового поля
    triggerSelectOnBlur: false,
});

createSuggestions(addressAutoCorrectInput, {
    token,
    type: "address",
    // разрешить автоисправление по пробелу
    triggerSelectOnSpace: true,
    // разрешить автоподстановку по Enter
    triggerSelectOnEnter: true,
    // разрешить автоисправление при выходе из текстового поля
    triggerSelectOnBlur: true,
});
