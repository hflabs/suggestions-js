// создание инпута
const input = document.createElement("input");
input.id = "token";

input.style.display = "block";
input.style.marginBottom = "16px";

input.setAttribute("placeholder", "API Token");

// сохранение и поиск токена

const storageKey = "DADATA_TOKEN";

input.addEventListener("change", (e) => {
    window.localStorage.setItem(storageKey, e.target.value);
});

const savedToken = window.localStorage.getItem(storageKey);
if (savedToken) input.value = savedToken;

window.getDadataToken = () => window.localStorage.getItem(storageKey);

// добавление на страницу
document.body.prepend(input);
