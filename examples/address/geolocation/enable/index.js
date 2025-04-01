/*
    Включить и отключить геолокацию
    https://codepen.io/dadata/pen/ExpMPv
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const geoOn = document.getElementById("address-geo-on");
const geoOff = document.getElementById("address-geo-off");
const geoForceSamara = document.getElementById("address-geo-force");
const geoForceMsk = document.getElementById("address-geo-msk-mo");

const { createSuggestions } = window.Dadata;

// геолокация отключена
createSuggestions(geoOff, {
    type: "address",
    geolocation: false,
    token,
});

// геолокация включена (по умолчанию)
createSuggestions(geoOn, {
    type: "address",
    token,
});

// принудительная геолокация — Самара
createSuggestions(geoForceSamara, {
    type: "address",
    token,
    geolocation: false,
    params: {
        locations_boost: [{ kladr_id: "63000001" }],
    },
});

// принудительная геолокация — Москва и область
createSuggestions(geoForceMsk, {
    type: "address",
    token,
    geolocation: false,
    params: {
        locations_boost: [{ kladr_id: "50" }, { kladr_id: "77" }],
    },
});
