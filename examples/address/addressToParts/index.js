/*
    Разложить адрес по полям
    https://codepen.io/dadata/pen/vYRwEa
*/

// Замените на свой API-ключ
const token = window.getDadataToken();

const addressInput = document.getElementById("address");

const postalInput = document.getElementById("postal_code");
const regionInput = document.getElementById("region");
const cityInput = document.getElementById("city");
const streetInput = document.getElementById("street");
const houseInput = document.getElementById("house");
const flatInput = document.getElementById("flat");
const geoBlock = document.getElementById("geo");

const { createSuggestions } = window.Dadata;

function join(arr, separator = ", ") {
    return arr.filter((n) => n).join(separator);
}

function geoQuality(qcGeo) {
    const localization = {
        0: "точные",
        1: "ближайший дом",
        2: "улица",
        3: "населенный пункт",
        4: "город",
    };
    return localization[qcGeo] || qcGeo;
}

function geoLink(address) {
    return join(
        [
            '<a target="_blank" href="',
            "https://maps.yandex.ru/?text=",
            address.geo_lat,
            ",",
            address.geo_lon,
            '">',
            address.geo_lat,
            ", ",
            address.geo_lon,
            "</a>",
        ],
        ""
    );
}

function showPostalCode(address) {
    postalInput.value = address.postal_code;
}

function showRegion(address) {
    regionInput.value = join([
        join([address.region_type, address.region], " "),
        join([address.area_type, address.area], " "),
    ]);
}

function showCity(address) {
    cityInput.value = join([
        join([address.city_type, address.city], " "),
        join([address.settlement_type, address.settlement], " "),
    ]);
}

function showStreet(address) {
    streetInput.value = join([address.street_type, address.street], " ");
}

function showHouse(address) {
    houseInput.value = join([
        join([address.house_type, address.house], " "),
        join([address.block_type, address.block], " "),
    ]);
}

function showFlat(address) {
    flatInput.value = join([address.flat_type, address.flat], " ");
}

function showGeo(address) {
    if (address.qc_geo !== "5") {
        const geo = `${geoLink(address)} (${geoQuality(address.qc_geo)})`;
        geoBlock.innerHTML = geo;
    }
}

function showSelected(suggestion) {
    const address = suggestion.data;
    showPostalCode(address);
    showRegion(address);
    showCity(address);
    showStreet(address);
    showHouse(address);
    showFlat(address);
    showGeo(address);
}

createSuggestions(addressInput, {
    token,
    type: "address",
    onSelect: showSelected,
});
