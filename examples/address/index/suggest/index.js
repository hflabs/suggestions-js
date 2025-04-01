/*
    Подсказки по индексу
    https://codepen.io/dadata/pen/GOabpM
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const postalInput = document.getElementById("postal_code");

const postalSuggs = createSuggestions(postalInput, {
    token,
    type: "address",
    onSuggestionsFetch: removeNonPostalMatches,
    onSearchStart: ensurePostal, // подсказывать если в запросе только цифры
});

function removeNonPostalMatches(suggestions) {
    const query = this.value;
    if (!/^\d+$/.test(query)) {
        // это запрос не по индексу, продолжаем как обычно
        return suggestions;
    }
    // это запрос по индексу, отсеиваем неподходящие варианты
    return suggestions.filter((suggestion) => {
        // в подсказке нет индекса, нет оснований её отсеивать
        if (!suggestion.data.postal_code) {
            return true;
        }
        // отсеиваем подсказку, если индекс не совпадает с запросом
        return suggestion.data.postal_code.indexOf(query) === 0;
    });
}

function ensurePostal(params) {
    const { query } = params;
    const digitRe = /^\d+$/;
    if (!digitRe.test(query)) {
        /* Запрос содержит не только цифры, не хотим его отправлять */
        postalSuggs.hide();
        return false;
    }
}
