/*
    Инициализация плагина после появления видимого инпута в документе
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const { createSuggestions } = window.Dadata;

const container = document.querySelector(".inputs-container");
const toggleBtn = document.querySelector(".button-toggle");
const renewBtn = document.querySelector(".button-renew");
const notification = document.querySelector(".notification");

let timer;

const addNotification = () => {
    notification.classList.add("visible");

    timer = setTimeout(() => {
        notification.classList.remove("visible");
    }, 1000);
};

const createInputs = () => {
    clearTimeout(timer);

    let fragment = "";

    for (let i = 0; i < 3; i++) {
        fragment += `<input data-name="widget-inpit-${i}" class="widget"></input>`;
    }

    container.innerHTML = "";
    container.innerHTML = fragment;

    document.querySelectorAll(".widget").forEach((input) => {
        input.widget = createSuggestions(input, {
            token,
            type: "name",
            hint: "",
            noCache: true,
        });
    });

    addNotification();
};

createInputs();

toggleBtn.addEventListener("click", () => {
    container.classList.toggle("hidden");

    if (!container.classList.contains("hidden")) {
        container.style.display = "flex";
    }
});

container.addEventListener("animationend", () => {
    if (container.classList.contains("hidden")) {
        container.style.display = "none";
    }
});

renewBtn.addEventListener("click", createInputs);
