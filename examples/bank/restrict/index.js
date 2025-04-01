/*
    Ограничить сектор поиска по банкам
    https://codepen.io/dadata/pen/zxWoNX
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const bankInput = document.getElementById("bank");

const label = document.getElementById("label");
const switchers = document.querySelectorAll("#switcher a");

const { createSuggestions } = window.Dadata;

const callbacks = {};

const suggestionsInstance = createSuggestions(bankInput, {
    token,
    type: "bank",
    onSelect(suggestion) {
        console.log(suggestion);
    },
});

callbacks.none = function none() {
    label.innerText = "Без ограничений";
    suggestionsInstance.setOptions({ params: {} });
};

callbacks.bank = function bank() {
    label.innerText = "Поиск по головным банкам";
    suggestionsInstance.setOptions({ params: { type: ["BANK"] } });
};

callbacks.bank_branch = function bankBranch() {
    label.innerText = "Только филиалы банков";
    suggestionsInstance.setOptions({ params: { type: ["BANK_BRANCH"] } });
};

callbacks.nko = function nko() {
    label.innerText = "Только НКО";
    suggestionsInstance.setOptions({ params: { type: ["NKO"] } });
};

callbacks.nko_branch = function nkoBranch() {
    label.innerText = "Только НКО";
    suggestionsInstance.setOptions({ params: { type: ["NKO_BRANCH"] } });
};

switchers.forEach((switcher) =>
    switcher.addEventListener("click", (e) => {
        e.preventDefault();
        bankInput.value = "";
        const fnName = switcher.dataset.switch;
        if (callbacks[fnName]) callbacks[fnName]();
    })
);
