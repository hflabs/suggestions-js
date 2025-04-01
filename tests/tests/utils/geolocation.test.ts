import { test, expect } from "vitest";
import { getLocation } from "@/utils/geolocation/index";

test("Geolocation util", async () => {
    const locationMock = {
        data: {
            region: "Москва",
            kladr_id: "7700000000000",
        },
        value: "1.2.3.4",
    };

    global.fetchMocker.mockOnce(JSON.stringify({ location: locationMock }));

    const location = await getLocation();

    expect(global.fetchMocker).toHaveBeenCalled();
    expect(global.fetchMocker.mock.calls[0][0]).toContain("iplocate/address");

    expect(location).toMatchObject(locationMock);

    global.fetchMocker.mockClear();

    await getLocation();

    expect(global.fetchMocker).toHaveBeenCalled();
    expect(global.fetchMocker.mock.calls[0][0]).toContain("iplocate/address");

    global.fetchMocker.mockOnce("{}", {
        status: 401,
        statusText: "Not Authorized",
    });

    const erroredResponse = await getLocation();

    expect(erroredResponse).toBeNull();
});
