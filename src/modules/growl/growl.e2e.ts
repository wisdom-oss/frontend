import {MapComponent} from "@maplibre/ngx-maplibre-gl";
import {expect, test} from "@playwright/test";

import groundwaterLevelsFixture from "./e2e/fixture.json";

test("map renders as expected", async ({page}) => {
  // freeze time so the rendered date stays deterministic
  await page.clock.setFixedTime(new Date("2026-09-21T12:00:00Z"));

  // mock the api response so the map renders the same data each run
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

  // ensure all required map data has loaded
  await groundwaterMeasurementStations.then(response => response.finished());
  await groundwaterLevels.then(response => response.finished());
  await groundwaterBodies.then(response => response.finished());

  // wait until both groundwater bodies and station markers render in the viewport
  await page.waitForFunction(() => {
    const mapElement = document.querySelector("main mgl-map");
    const mapInstance = mapElement
      ? window.ng?.getComponent<MapComponent>(mapElement)?.mapInstance
      : undefined;

    if (!mapInstance) return false;

    const features = mapInstance.queryRenderedFeatures();
    return (
      features.some(
        ({layer}) => layer.id === "groundwater-bodies-layer-fill",
      ) &&
      features.some(
        ({layer}) =>
          layer.type === "symbol" &&
          layer.source === "groundwater-measurement-stations-source",
      )
    );
  });

  // wait until the map finishes rendering after a repaint
  await page.waitForFunction(async () => {
    const mapElement = document.querySelector("main mgl-map")!;
    const map = window.ng?.getComponent<MapComponent>(mapElement)?.mapInstance;
    if (!map) return false;

    const idle = map.once("idle");
    map.triggerRepaint();
    await idle;
    return true;
  });

  // verify the final map appearance
  await expect(page.locator("main")).toHaveScreenshot({maxDiffPixels: 50});
});
