/*
    Включить и отключить геолокацию
    https://codepen.io/dadata/pen/LRywmg
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const partyInputGeoOn = document.getElementById("party-geo-on");
const partyInputGeoOff = document.getElementById("party-geo-off");
const partyInputGeoForce = document.getElementById("party-geo-force");

const { createSuggestions } = window.Dadata;

// геолокация отключена
createSuggestions(partyInputGeoOff, {
    token,
    geolocation: false,
    type: "party",
});

// геолокация включена (по умолчанию)
createSuggestions(partyInputGeoOn, {
    token,
    type: "party",
});

// принудительная геолокация — Самара
createSuggestions(partyInputGeoForce, {
    token,
    type: "party",
    geolocation: false,
    params: {
        locations_boost: [{ kladr_id: "63000001" }],
    },
});
