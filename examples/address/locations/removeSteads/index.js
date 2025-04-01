/*
    Не подсказывать земельные участки
    https://codepen.io/dadata/pen/gOeXBvr
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const cityInput = document.getElementById("city");
const streetInput = document.getElementById("street");

// удаляет земельные участки
function removeSteads(suggestions) {
    return suggestions.filter((suggestion) => suggestion.data.stead === null);
}

const citySuggestions = createSuggestions(cityInput, {
    token,
    type: "address",
    hint: false,
    params: {
        from_bound: { value: "city" },
        to_bound: { value: "settlement" },
    },
});

createSuggestions(
    streetInput,
    {
        token,
        type: "address",
        hint: false,
        params: {
            from_bound: { value: "street" },
            to_bound: { value: "house" },
        },
        onSuggestionsFetch: removeSteads,
    },
    citySuggestions
);
