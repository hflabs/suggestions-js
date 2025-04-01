/*
    Запретить автоисправление
    https://codepen.io/dadata/pen/OVJYPv
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const addressInput = document.getElementById("address");
const nameInput = document.getElementById("name");
const partyInput = document.getElementById("party");

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
    /* Вызывается, когда пользователь выбирает одну из подсказок */
    onSelect(suggestion) {
        console.log(suggestion);
    },
});

createSuggestions(nameInput, {
    token,
    type: "name",
    // запретить автоисправление по пробелу
    triggerSelectOnSpace: false,
    // запрещаем автоподстановку по Enter
    triggerSelectOnEnter: false,
    // запретить автоисправление при выходе из текстового поля
    triggerSelectOnBlur: false,
    /* Вызывается, когда пользователь выбирает одну из подсказок */
    onSelect(suggestion) {
        console.log(suggestion);
    },
});

createSuggestions(partyInput, {
    token,
    type: "party",
    // запретить автоисправление по пробелу
    triggerSelectOnSpace: false,
    // запрещаем автоподстановку по Enter
    triggerSelectOnEnter: false,
    // запретить автоисправление при выходе из текстового поля
    triggerSelectOnBlur: false,
    /* Вызывается, когда пользователь выбирает одну из подсказок */
    onSelect(suggestion) {
        console.log(suggestion);
    },
});
