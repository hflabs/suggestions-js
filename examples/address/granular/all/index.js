/*
    Гранулярные подсказки по адресу (все поля)
    https://codepen.io/dadata/pen/MYNQBm
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const type = "address";

const countryInput = document.getElementById("country");
const regionInput = document.getElementById("region");
const areaInput = document.getElementById("area");
const cityInput = document.getElementById("city");
const cityDistrictInput = document.getElementById("city_district");
const settlementInput = document.getElementById("settlement");
const streetInput = document.getElementById("street");
const houseInput = document.getElementById("house");

const { createSuggestions } = window.Dadata;

const countrySuggs = createSuggestions(countryInput, {
    type,
    token,
    hint: false,
    params: {
        from_bound: { value: "country" },
        to_bound: { value: "country" },
        locations: [{ country_iso_code: "*" }],
    },
});

const regionSuggs = createSuggestions(
    regionInput,
    {
        type,
        token,
        hint: false,
        params: {
            from_bound: { value: "region" },
            to_bound: { value: "region" },
        },
    },
    countrySuggs
);

const areaSuggs = createSuggestions(
    areaInput,
    {
        type,
        token,
        hint: false,
        params: {
            from_bound: { value: "area" },
            to_bound: { value: "area" },
        },
    },
    regionSuggs
);

const citySuggs = createSuggestions(
    cityInput,
    {
        type,
        token,
        hint: false,
        params: {
            from_bound: { value: "city" },
            to_bound: { value: "city" },
        },
    },
    areaSuggs
);

const cityDistrictSuggs = createSuggestions(
    cityDistrictInput,
    {
        type,
        token,
        hint: false,
        params: {
            from_bound: { value: "city_district" },
            to_bound: { value: "city_district" },
        },
    },
    citySuggs
);

const settlementSuggs = createSuggestions(
    settlementInput,
    {
        type,
        token,
        hint: false,
        params: {
            from_bound: { value: "settlement" },
            to_bound: { value: "settlement" },
        },
    },
    cityDistrictSuggs
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
    settlementSuggs
);

createSuggestions(
    houseInput,
    {
        type,
        token,
        hint: false,
        params: {
            from_bound: { value: "house" },
            to_bound: { value: "flat" },
        },
    },
    streetSuggs
);
