/*
    Адреса внутри окружности на карте
    https://codepen.io/dadata/pen/XWXMwNv
*/

// Замените на свой API-ключ
const token = window.getDadataToken();
const { createSuggestions } = window.Dadata;

const coordsInput = document.getElementById("coords");
const radiusInput = document.getElementById("radius");
const addressInput = document.getElementById("address");

const addressSuggestions = createSuggestions(addressInput, {
    type: "address",
    token,
    params: {
        locations_geo: [
            {
                lat: 53.194119,
                lon: 50.154362,
                radius_meters: 3000,
            },
        ],
    },
});

function updateLocationGeo() {
    const coords = parseCoords();
    const radius = parseRadius();
    console.log(coords);
    console.log(radius);
    if (coords && radius) {
        setLocationGeo(coords[0], coords[1], radius);
    } else {
        clearLocationGeo();
    }
}

function parseCoords() {
    const coords = /([\d.]+)[, ]+([\d.]+)/.exec(coordsInput.value) || [];
    if (coords.length === 3) return [coords[1], coords[2]];
    return coords;
}

function parseRadius() {
    return parseInt(radiusInput.value, 10);
}

function setLocationGeo(lat, lon, radius) {
    addressSuggestions.setOptions({
        params: {
            locations_geo: [
                {
                    lat,
                    lon,
                    radius_meters: radius,
                },
            ],
        },
    });
}

function clearLocationGeo() {
    addressSuggestions.setOptions({ params: {} });
}

coordsInput.addEventListener("change", updateLocationGeo);
radiusInput.addEventListener("change", updateLocationGeo);
