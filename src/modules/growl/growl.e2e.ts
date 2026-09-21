import {MapComponent} from "@maplibre/ngx-maplibre-gl";
import {expect, test} from "@playwright/test";

import groundwaterLevelsFixture from "./e2e/fixture.json";

test("map renders as expected", async ({page}) => {
  // pin clock to ensure that rendered date is correct
  await page.clock.setFixedTime(new Date("2026-09-21T12:00:00Z"));

  // mock api response to ensure that same data is rendered
  await page.route("**/api/groundwater-levels/graphql", async route => {
    await route.fulfill({json: groundwaterLevelsFixture});
  });

  function waitForApiResponseOk(endpoint: string) {
    return page.waitForResponse(
      response => response.url().endsWith(endpoint) && response.ok(),
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

  // ensure map has all the data
  await groundwaterMeasurementStations.then(response => response.finished());
  await groundwaterLevels.then(response => response.finished());
  await groundwaterBodies.then(response => response.finished());

  // wait until map is done
  await page.locator("main mgl-map").evaluate(
    mapElement =>
      new Promise<void>(resolve => {
        window
          .ng!.getComponent<MapComponent>(mapElement)!
          .mapInstance.once("idle", () => resolve());
      }),
  );

  // should look like we expect the map to look like
  await expect(page.locator("main")).toHaveScreenshot();
});
