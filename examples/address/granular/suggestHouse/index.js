/*
    Гранулярные подсказки по адресу (регион–н/п + улица–дом)
    https://codepen.io/dadata/pen/NvNENM
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const type = "address";

const cityInput = document.getElementById("city");
const streetInput = document.getElementById("street");

const { createSuggestions } = window.Dadata;

const citySuggs = createSuggestions(cityInput, {
    token,
    type,
    hint: false,
    params: {
        from_bound: { value: "region" },
        to_bound: { value: "settlement" },
    },
});

const streetSuggs = createSuggestions(
    streetInput,
    {
        token,
        type,
        hint: false,
        params: {
            from_bound: { value: "street" },
            to_bound: { value: "house" },
        },
        onSelect: suggestHouse,
    },
    citySuggs
);

function suggestHouse(suggestion) {
    if (suggestion.data.house) return;
    streetSuggs.update();
}
