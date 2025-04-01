/*
    Подсказки по организациям
    https://codepen.io/dadata/pen/QWxOEK
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const partyInput = document.getElementById("party");

const typeHint = document.getElementById("type");
const nameShortInput = document.getElementById("name_short");
const nameFullInput = document.getElementById("name_full");
const innInput = document.getElementById("inn_kpp");
const addressInput = document.getElementById("address");

const { createSuggestions } = window.Dadata;

createSuggestions(partyInput, {
    token,
    type: "party",
    /* Вызывается, когда пользователь выбирает одну из подсказок */
    onSelect: showSuggestion,
});

const TYPES = {
    INDIVIDUAL: "Индивидуальный предприниматель",
    LEGAL: "Организация",
};

function typeDescription(type) {
    return TYPES[type];
}

function showSuggestion(suggestion) {
    console.log(suggestion);

    const { data } = suggestion;
    if (!data) return;

    typeHint.innerText = `${typeDescription(data.type)} (${data.type})`;

    if (data.name) {
        nameShortInput.value = data.name.short_with_opf || "";
        nameFullInput.value = data.name.full_with_opf || "";
    }

    innInput.value = [data.inn, data.kpp].filter(Boolean).join(" / ");

    if (data.address) {
        let address = "";

        if (data.address.data.qc === "0") {
            address = [data.address.data.postal_code, data.address.value]
                .filter(Boolean)
                .join(", ");
        } else {
            address = data.address.data.source;
        }

        addressInput.value = address;
    }
}
