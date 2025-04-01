/*
    Ограничить сектор поиска по организациям
    https://codepen.io/dadata/pen/KwPgWq
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const partyInput = document.getElementById("party");

const label = document.getElementById("label");
const switchers = document.querySelectorAll("#switcher a");

const { createSuggestions } = window.Dadata;

let suggestionsInstance;

function none() {
    label.innerText = "Без ограничений";

    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(partyInput, {
        token,
        type: "party",
    });
}

function area() {
    label.innerText = "Поиск по Москве";

    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(partyInput, {
        token,
        type: "party",
        params: { locations: [{ kladr_id: "77" }] },
    });
}

function typeLegal() {
    label.innerText = "Поиск среди компаний";

    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(partyInput, {
        token,
        type: "party",
        params: { type: "LEGAL" },
    });
}

function typeIP() {
    label.innerText = "Поиск среди ИП";

    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(partyInput, {
        token,
        type: "party",
        params: { type: "INDIVIDUAL" },
    });
}

function statusActual() {
    label.innerText = "Поиск среди действующих организаций";

    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(partyInput, {
        token,
        type: "party",
        params: { status: ["ACTIVE"] },
    });
}

function statusLiquidated() {
    label.innerText = "Поиск среди ликвидированных организаций";

    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(partyInput, {
        token,
        type: "party",
        params: { status: ["LIQUIDATED"] },
    });
}

const callbacks = {
    none,
    area,
    type_legal: typeLegal,
    type_ip: typeIP,
    status_actual: statusActual,
    status_liquidated: statusLiquidated,
};

switchers.forEach((switcher) =>
    switcher.addEventListener("click", (e) => {
        e.preventDefault();
        partyInput.value = "";
        const fnName = switcher.dataset.switch;
        if (callbacks[fnName]) callbacks[fnName]();
    })
);

none();
