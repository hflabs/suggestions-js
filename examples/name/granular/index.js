/*
    Гранулярные подсказки ФИО
    https://codepen.io/dadata/pen/qBZQwx
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const surnameInput = document.getElementById("surname");
const nameInput = document.getElementById("name");
const patronymicInput = document.getElementById("patronymic");
const genderHint = document.getElementById("gender");

const { createSuggestions } = window.Dadata;

let genderKnown;

const genders = {
    MALE: "мужской",
    FEMALE: "женский",
};

createSuggestions(nameInput, {
    token,
    type: "name",
    hint: "",
    noCache: true,
    params() {
        return {
            parts: ["NAME"],
            gender: isGenderKnown(nameInput) ? genderKnown : "UNKNOWN",
        };
    },
    onSelect,
});

createSuggestions(surnameInput, {
    token,
    type: "name",
    hint: "",
    noCache: true,
    params() {
        return {
            parts: ["SURNAME"],
            gender: isGenderKnown(surnameInput) ? genderKnown : "UNKNOWN",
        };
    },
    onSelect,
});

createSuggestions(patronymicInput, {
    token,
    type: "name",
    hint: "",
    noCache: true,
    params() {
        return {
            parts: ["PATRONYMIC"],
            gender: isGenderKnown(patronymicInput) ? genderKnown : "UNKNOWN",
        };
    },
    onSelect,
});

function onSelect(suggestion) {
    // определяем пол по выбранной подсказке
    genderKnown = suggestion.data.gender;
    showGender();
}

// Проверяет, известен ли пол на данный момент на основе других полей
function isGenderKnown(inputEl) {
    const otherInputs = [nameInput, surnameInput, patronymicInput].filter((el) => el !== inputEl);
    return otherInputs.some((input) => Boolean(input.value));
}

function showGender() {
    const genderRu = genders[genderKnown] || "не определен";
    genderHint.innerText = genderRu;
}
