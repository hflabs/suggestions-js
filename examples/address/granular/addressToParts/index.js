/*
    Заполнить гранулярные подсказки из подсказок одной строкой
    https://codepen.io/dadata/pen/XbeQrX
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const type = "address";

const addressInput = document.getElementById("address");

const regionInput = document.getElementById("region");
const cityInput = document.getElementById("city");
const streetInput = document.getElementById("street");
const houseInput = document.getElementById("house");

const { createSuggestions } = window.Dadata;

const regionSuggs = createSuggestions(regionInput, {
    type,
    token,
    hint: false,
    params: {
        from_bound: { value: "region" },
        to_bound: { value: "area" },
    },
});

const citySuggs = createSuggestions(
    cityInput,
    {
        type,
        token,
        hint: false,
        params: {
            from_bound: { value: "city" },
            to_bound: { value: "settlement" },
        },
    },
    regionSuggs
);

const streetSuggs = createSuggestions(
    streetInput,
    {
        type,
        token,
        hint: false,
        params: {
            from_bound: { value: "street" },
            to_bound: { value: "street" },
        },
    },
    citySuggs
);

const houseSuggs = createSuggestions(
    houseInput,
    {
        type,
        token,
        hint: false,
        params: {
            from_bound: { value: "house" },
            to_bound: { value: "house" },
        },
    },
    streetSuggs
);

createSuggestions(addressInput, {
    type,
    token,
    hint: false,
    onSelect(suggestion) {
        regionSuggs.setSuggestion(suggestion);
        citySuggs.setSuggestion(suggestion);
        streetSuggs.setSuggestion(suggestion);
        houseSuggs.setSuggestion(suggestion);
    },
});
