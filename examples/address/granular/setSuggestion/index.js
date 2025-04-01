/*
    Установка адреса через setSuggestion
    https://codepen.io/dadata/pen/RNdPOL
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const type = "address";

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

createSuggestions(
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

regionSuggs.setSuggestion({
    value: "Московская обл, Мытищинский р-н",
    data: {
        source: "Московская обл, Мытищинский р-н",
        result: "Россия, Московская обл, Мытищинский р-н",
        postal_code: null,
        country: "Россия",
        region_type: "обл",
        region_type_full: "область",
        region: "Московская",
        area_type: "р-н",
        area_type_full: "район",
        area: "Мытищинский",
        city_type: null,
        city_type_full: null,
        city: null,
        settlement_type: null,
        settlement_type_full: null,
        settlement: null,
        city_district: null,
        street_type: null,
        street_type_full: null,
        street: null,
        house_type: null,
        house_type_full: null,
        house: null,
        block_type: null,
        block_type_full: null,
        block: null,
        flat_type: null,
        flat: null,
        postal_box: null,
        kladr_id: "5000000000000",
        fias_id: "a87ff831-986b-44a7-8405-00fc699de4ce",
        capital_marker: "0",
        okato: "46234000000",
        oktmo: "46634000",
        tax_office: "5000",
        tax_office_legal: null,
        flat_area: null,
        square_meter_price: null,
        flat_price: null,
        timezone: "UTC+3",
        geo_lat: null,
        geo_lon: null,
        qc_geo: 5,
        qc_complete: 2,
        qc_house: 10,
        qc: 0,
        unparsed_parts: null,
    },
});

citySuggs.setSuggestion({
    value: "г Мытищи",
    data: {
        source: "Московская обл, Мытищинский р-н, г Мытищи",
        result: "Россия, Московская обл, г Мытищи",
        postal_code: "141000",
        country: "Россия",
        region_type: "обл",
        region_type_full: "область",
        region: "Московская",
        area_type: "р-н",
        area_type_full: "район",
        area: "Мытищинский",
        city_type: "г",
        city_type_full: "город",
        city: "Мытищи",
        settlement_type: null,
        settlement_type_full: null,
        settlement: null,
        city_district: null,
        street_type: null,
        street_type_full: null,
        street: null,
        house_type: null,
        house_type_full: null,
        house: null,
        block_type: null,
        block_type_full: null,
        block: null,
        flat_type: null,
        flat: null,
        postal_box: null,
        kladr_id: "5000004400000",
        fias_id: "5f290be7-14ff-4ccd-8bc8-2871a9ca9d5f",
        capital_marker: "1",
        okato: "46234501000",
        oktmo: "46634101001",
        tax_office: "5000",
        tax_office_legal: null,
        flat_area: null,
        square_meter_price: null,
        flat_price: null,
        timezone: "UTC+3",
        geo_lat: "55.9106375",
        geo_lon: "37.736366",
        qc_geo: 4,
        qc_complete: 3,
        qc_house: 10,
        qc: 0,
        unparsed_parts: null,
    },
});

// получаем только что установленную подсказку
console.log(citySuggs.getSelection());
