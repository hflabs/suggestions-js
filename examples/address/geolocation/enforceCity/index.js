/*
    Автозаполнение города по IP
    https://codepen.io/dadata/pen/pPwPVJ
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const addressInput = document.getElementById("address");
const cityInput = document.getElementById("city");

const { createSuggestions } = window.Dadata;

const citySuggs = createSuggestions(cityInput, {
    type: "address",
    token,
    hint: false,
    params: {
        from_bound: { value: "city" },
        to_bound: { value: "settlement" },
    },
    onSelect: enforceCity,
});

const addressSuggs = createSuggestions(addressInput, {
    type: "address",
    geolocation: false,
    token,
});

// получить текущую геолокацию и установить ее для поля
citySuggs.getLocation().then((location) => {
    if (!location) return;
    citySuggs.setSuggestion(location);
    enforceCity(location);
});

function enforceCity(suggestion) {
    addressSuggs.clear();
    addressSuggs.setOptions({
        params: {
            locations: [{ kladr_id: suggestion.data.kladr_id }],
            restrict_value: true,
        },
    });
}
