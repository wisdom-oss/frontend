import { expect, test } from "@playwright/test";

test("map renders as expected", async ({ page }) => {
  let groundwaterMeasurementStations = page.waitForResponse((response) =>
    response.url().endsWith(
      "api/geodata/v2/content/groundwater_measurement_stations/",
    ) && response.ok()
  );

    let groundwaterBodies = page.waitForResponse((response) =>
    response.url().endsWith(
      "api/geodata/v2/content/groundwater_bodies/",
    ) && response.ok()
  );

  let groundwaterLevels = page.waitForResponse((response) =>
    response.url().endsWith("api/groundwater-levels/graphql") && response.ok()
  );

  await page.goto("/growl");
  await groundwaterMeasurementStations.then((response) => response.finished());
  await groundwaterLevels.then((response) => response.finished());
  await groundwaterBodies.then(response => response.finished());

  await page.locator("main mgl-map").evaluate((mapElement) => new Promise<void>(resolve => {
    (window as any).ng.getComponent(mapElement).mapInstance.once("idle", () => resolve())
  }));

  await expect(page.locator("main")).toHaveScreenshot();
});
