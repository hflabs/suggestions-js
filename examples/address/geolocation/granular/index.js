/*
    Автозаполнение города по IP (гранулярные подсказки)
    https://codepen.io/dadata/pen/aZdZxM
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const regionInput = document.getElementById("region");
const cityInput = document.getElementById("city");
const streetInput = document.getElementById("street");
const postalcodeInput = document.getElementById("postalcode");

const { createSuggestions } = window.Dadata;

const regionSuggs = createSuggestions(regionInput, {
    type: "address",
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
        type: "address",
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
        type: "address",
        token,
        hint: false,
        params: {
            from_bound: { value: "street" },
            to_bound: { value: "house" },
        },
        onSelect: setPostalCode,
        onSelectNothing: clearPostalCode,
    },
    citySuggs
);

// получить текущую геолокацию и установить ее для поля
citySuggs.getLocation().then((location) => {
    if (!location) return;
    regionSuggs.setSuggestion(location);
    citySuggs.setSuggestion(location);
    streetSuggs.setSuggestion(location);
});

function clearPostalCode() {
    postalcodeInput.value = "";
}

function setPostalCode(suggestion) {
    if (suggestion.data.postal_code) {
        postalcodeInput.value = suggestion.data.postal_code;
    } else {
        clearPostalCode();
    }
}
