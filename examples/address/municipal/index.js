/*
    Адрес в муниципальном делении
    https://codepen.io/dadata/pen/LYQMzpW
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const addressInput = document.getElementById("address");
const addressFullBlock = document.getElementById("address-full");

const { createSuggestions } = window.Dadata;

createSuggestions(addressInput, {
    token,
    type: "address",
    params: {
        division: "municipal",
    },
    // Вызывается, когда пользователь выбирает одну из подсказок
    onSelect: showSelected,
});

function showSelected(suggestion) {
    console.log(suggestion);

    const address = suggestion.data;
    let str = address.region_with_type;

    if (address.area_with_type) {
        str += `<br>${address.area_with_type}`;
    }
    if (address.sub_area_with_type) {
        str += `<br>${address.sub_area_with_type}`;
    }
    if (address.city_with_type) {
        str += `<br>${address.city_with_type}`;
    }
    if (address.settlement_with_type) {
        str += `<br>${address.settlement_with_type}`;
    }
    if (address.street_with_type) {
        str += `<br>${address.street_with_type}`;
    }
    if (address.stead) {
        str += `<br>${address.stead_type} ${address.stead}`;
    }
    if (address.house) {
        str += `<br>${address.house_type} ${address.house}`;
    }
    if (address.block) {
        str += `<br>${address.block_type} ${address.block}`;
    }
    if (address.flat) {
        str += `<br>${address.flat_type} ${address.flat}`;
    }

    addressFullBlock.innerHTML = str;
}
