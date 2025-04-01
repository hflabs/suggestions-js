/*
    Подсказки по банкам
    https://codepen.io/dadata/pen/jEzVee
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const bankInput = document.getElementById("bank");

const namePaymentInput = document.getElementById("name_payment");
const bicInput = document.getElementById("bic");
const swiftInput = document.getElementById("swift");
const accountInput = document.getElementById("correspondent_account");
const addressInput = document.getElementById("address");

const { createSuggestions } = window.Dadata;

createSuggestions(bankInput, {
    token,
    type: "bank",
    /* Вызывается, когда пользователь выбирает одну из подсказок */
    onSelect: showSuggestion,
});

function showSuggestion(suggestion) {
    console.log(suggestion);

    const { data } = suggestion;
    if (!data) return;

    namePaymentInput.value = (data.name && data.name.payment) || "";
    bicInput.value = data.bic;
    swiftInput.value = data.swift;
    accountInput.value = data.correspondent_account;
    addressInput.value = data.address.value;
}
