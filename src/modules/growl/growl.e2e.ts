import { MapComponent } from "@maplibre/ngx-maplibre-gl";
import { expect, test } from "@playwright/test";

test("map renders as expected", async ({ page }) => {
  function waitForApiResponseOk(endpoint: string) {
    return page.waitForResponse((response) =>
      response.url().endsWith(endpoint) && response.ok()
    );
  }

  const groundwaterMeasurementStations = waitForApiResponseOk(
    "api/geodata/v2/content/groundwater_measurement_stations/",
  );
  const groundwaterBodies = waitForApiResponseOk(
    "api/geodata/v2/content/groundwater_bodies/",
  );
  const groundwaterLevels = waitForApiResponseOk(
    "api/groundwater-levels/graphql",
  );

  await page.goto("/growl");
  
  await groundwaterMeasurementStations.then((response) => response.finished());
  await groundwaterLevels.then((response) => response.finished());
  await groundwaterBodies.then((response) => response.finished());

  await page.locator("main mgl-map").evaluate(
    (mapElement) =>
      new Promise<void>((resolve) => {
        window.ng!
          .getComponent<MapComponent>(mapElement)!
          .mapInstance.once("idle", () => resolve());
      }),
  );

  await expect(page.locator("main")).toHaveScreenshot();
});
