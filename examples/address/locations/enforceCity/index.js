/*
    Адреса внутри конкретного города
    https://codepen.io/dadata/pen/NreyeL
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const addressInput = document.getElementById("address");
const cityInput = document.getElementById("city");

const citySuggestions = createSuggestions(cityInput, {
    token,
    type: "address",
    params: {
        from_bound: { value: "city" },
        to_bound: { value: "settlement" },
    },
    onSelect: enforceCity,
    onSelectNothing: () => enforceCity(),
});

const addressSuggestions = createSuggestions(addressInput, {
    token,
    type: "address",
    onSelect: restrictAddressValue,
    formatSelected,
});

function setConstraints(sgt, kladrId) {
    let restrictValue = false;
    let locations = null;

    if (kladrId) {
        locations = [{ kladr_id: kladrId }];
        restrictValue = true;
    }

    sgt.setOptions({
        params: {
            locations,
            restrict_value: restrictValue,
        },
    });
}

function enforceCity(suggestion) {
    addressSuggestions.clear();

    if (suggestion) {
        setConstraints(addressSuggestions, suggestion.data.kladr_id);
    } else {
        setConstraints(addressSuggestions, null);
    }
}

function restrictAddressValue(suggestion) {
    if (!cityInput.value) {
        citySuggestions.setSuggestion(suggestion);
        const cityKladrId = suggestion.data.kladr_id.substr(0, 13);
        setConstraints(addressSuggestions, cityKladrId);
    }
}

function formatSelected(suggestion) {
    return makeAddressString(suggestion.data);
}

function makeAddressString(address) {
    return join([
        address.street_with_type,
        join([address.house_type, address.house, address.block_type, address.block], " "),
        join([address.flat_type, address.flat], " "),
    ]);
}

function join(arr, separator = ", ") {
    return arr.filter((n) => n).join(separator);
}

citySuggestions.fixData(cityInput.value);
