/*
    Ограничить сектор поиска по адресу
    https://codepen.io/dadata/pen/mdPQzz
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const label = document.getElementById("label");
const addressInput = document.getElementById("address");
const switchers = document.querySelectorAll("#switcher a");

let suggestionsInstance;

function none() {
    label.innerHTML = "Без ограничений";
    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(addressInput, {
        token,
        type: "address",
    });
}

function foreign() {
    label.innerHTML = "Конкретная страна (Казахстан)";
    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(addressInput, {
        token,
        type: "address",
        params: {
            // ISO-код страны
            // Список ISO-кодов: https://ru.wikipedia.org/wiki/ISO_3166-1
            locations: [{ country_iso_code: "KZ" }],
        },
    });
}

function msk() {
    label.innerHTML = "Конкретный регион (Москва)";
    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(addressInput, {
        token,
        type: "address",
        params: {
            // ограничиваем поиск Москвой
            locations: [{ region: "Москва" }],
            // в списке подсказок не показываем область
            restrict_value: true,
        },
    });
}

function nsk() {
    label.innerHTML = "Конкретный город (Новосбирск)";
    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(addressInput, {
        token,
        type: "address",
        params: {
            // ограничиваем поиск Новосибирском
            locations: [{ region: "Новосибирская", city: "Новосибирск" }],
            // в списке подсказок не показываем область и город
            restrict_value: true,
        },
    });
}

function sam() {
    label.innerHTML = "Конкретный город (Самара)";
    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(addressInput, {
        token,
        type: "address",
        params: {
            locations: [{ kladr_id: "6300000100000" }],
            // в списке подсказок не показываем область и город
            restrict_value: true,
        },
    });
}

function kladr() {
    label.innerHTML = "Ограничение по коду КЛАДР (Тольятти)";
    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(addressInput, {
        token,
        type: "address",
        params: {
            // ограничиваем поиск городом Тольятти по коду КЛАДР
            locations: [{ kladr_id: "63000007" }],
            // в списке подсказок не показываем область и город
            restrict_value: true,
        },
    });
}

function fias() {
    label.innerHTML = "Ограничение по коду ФИАС (Краснодарский край)";
    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(addressInput, {
        token,
        type: "address",
        params: {
            // ограничиваем поиск Краснодарским краем по коду ФИАС
            locations: [{ region_fias_id: "d00e1013-16bd-4c09-b3d5-3cb09fc54bd8" }],
            // в списке подсказок не показываем область и город
            restrict_value: true,
        },
    });
}

function regions() {
    label.innerHTML = "Несколько регионов (Москва и Московская область)";
    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(addressInput, {
        token,
        type: "address",
        params: {
            // Москва и Московская область
            locations: [{ region: "Москва" }, { kladr_id: "50" }],
        },
    });
}

function fd() {
    label.innerHTML = "Федеральный округ (ЮФО)";
    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(addressInput, {
        token,
        type: "address",
        params: {
            // несколько ограничений по ИЛИ
            locations: [
                { region: "адыгея" },
                { region: "астраханская" },
                { region: "волгоградская" },
                { region: "калмыкия" },
                { region: "краснодарский" },
                { region: "ростовская" },
            ],
        },
    });
}

function iso() {
    label.innerHTML = "По ISO-коду страны и региона (Германия, Гессен)";
    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(addressInput, {
        token,
        type: "address",
        params: {
            locations: [{ country_iso_code: "DE", region_iso_code: "DE-HE" }],
        },
    });
}

function isoreg() {
    label.innerHTML = "По названию страны и региона (Беларусь, Брестская область)";
    if (suggestionsInstance) suggestionsInstance.dispose();
    suggestionsInstance = createSuggestions(addressInput, {
        token,
        type: "address",
        params: {
            locations: [{ country: "Беларусь", region: "Брестская" }],
        },
    });
}

const callbacks = {
    none,
    foreign,
    msk,
    nsk,
    sam,
    kladr,
    fias,
    regions,
    fd,
    iso,
    isoreg,
};

switchers.forEach((switcher) =>
    switcher.addEventListener("click", (e) => {
        e.preventDefault();
        addressInput.value = "";
        const fnName = switcher.dataset.switch;
        if (callbacks[fnName]) callbacks[fnName]();
    })
);

none();
