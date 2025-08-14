import {computed, inject, Component, Signal} from "@angular/core";
import {
  remixBarChartFill,
  remixBuilding3Fill,
  remixDatabase2Fill,
  remixDrizzleFill,
  remixFilePaper2Fill,
  remixInstanceLine,
  remixMap2Fill,
  remixRfidLine,
  remixSunCloudyFill,
  remixWaterPercentFill,
} from "@ng-icons/remixicon";

import {DwdService} from "./api/dwd.service";
import {GroundwaterLevelsService} from "./api/groundwater-levels.service";
import {GeoDataService} from "./api/geo-data.service";
import {WaterRightsService} from "./api/water-rights.service";
import {UsageForecastsService} from "./api/usage-forecasts.service";
import {BeWaterSmartService} from "./api/be-water-smart.service";
import {extraTags} from "./common/utils/extra-tags";
import {api} from "./common/api";
import {AuthService} from "./core/auth/auth.service";
import {Scopes} from "./core/auth/scopes";
import {OowvActionMapIconComponent} from "./core/sidebar/icons/oowv-action-map-icon/oowv-action-map-icon.component";
import {OowvActionMapComponent} from "./modules/oowv/action-map/action-map.component";
import {PumpModelsComponent} from "./modules/pump-models/pump-models.component";

/** Any class that is a {@link Component}. */
type ComponentClass = new (...args: any[]) => Component;

/**
 * An icon for either a category or a module in the sidebar.
 *
 * Can be one of:
 * - A record with exactly one entry pointing to an icon from `@ng-icons`.
 * - A {@link Component} used as a custom icon (for compound or dynamic icons).
 * - A `URL` to an image (ensure CORS allows fetching if not same-origin).
 */
type Icon =
  | (Record<string, string> & extraTags.RecordEntries<1>)
  | ComponentClass
  | URL;

/**
 * A category entry for the sidebar.
 *
 * Defines a category and the modules it contains.
 */
export interface SidebarEntry {
  /**
   * The category name.
   *
   * May be a translation key.
   */
  category: string;

  /** Icon shown next to the category name. */
  icon: Icon;

  modules: Array<{
    /**
     * Module name.
     *
     * May be a translation key.
     */
    module: string;

    /** Icon shown next to the module name. */
    icon: Icon;

    /** Router link to the component. */
    link: string;

    /**
     * Services used by this module.
     *
     * Used to show warnings if any have availability issues.
     */
    services: Record<string, api.Service>;

    /** Required {@link Scopes.Scope scopes} to see this module. */
    scopes?: Scopes.Scope[];

    /**
     * Optional factory returning a {@link Signal} controlling visibility.
     *
     * Runs inside an injection context, so `inject` can be used here.
     * Call `inject` before creating the signal, the signal itself may run
     * outside of an injection context.
     */
    visible?: () => Signal<boolean>;
  }>;
}

/**
 * Declare which sidebar entries exist in the app.
 *
 * Must run in a static context outside an injection context, do not call
 * `inject` here.
 *
 * The `SidebarComponent` uses this list to build the sidebar.
 *
 * @see SidebarEntry
 */
export function sidebar(): readonly SidebarEntry[] {
  return [
    {
      category: "core.sidebar.category.precipitation",
      icon: {remixDrizzleFill},
      modules: [
        {
          module: "weather-data.display.module",
          icon: {remixSunCloudyFill},
          link: "/weather-data",
          services: {DwdService},
        },
      ],
    },
    {
      category: "core.sidebar.category.groundwater",
      icon: {remixMap2Fill},
      modules: [
        {
          module: "GroWL",
          icon: {remixDatabase2Fill},
          link: "/growl",
          services: {GroundwaterLevelsService, GeoDataService},
        },
        {
          module: "water-rights.display.module",
          icon: {remixFilePaper2Fill},
          link: "/water-rights",
          services: {WaterRightsService, GeoDataService},
        },
      ],
    },
    {
      category: "core.sidebar.category.water-usage",
      icon: {remixWaterPercentFill},
      modules: [
        {
          module: "long-term-forecast.display.module",
          icon: {remixBarChartFill},
          link: "/long-term-forecast",
          services: {UsageForecastsService},
        },
        {
          module: "Be-Water-Smart",
          icon: {remixRfidLine},
          link: "/be-water-smart",
          services: {BeWaterSmartService},
        },
      ],
    },
    {
      category: "core.sidebar.category.waterworks",
      icon: {remixBuilding3Fill},
      modules: [
        {
          module: "pump-models.display.module",
          icon: {remixInstanceLine},
          link: "/pump-models",
          services: {},
          scopes: PumpModelsComponent.SCOPES,
          visible: () => {
            const auth = inject(AuthService);
            return computed(() =>
              auth.scopes().has(...PumpModelsComponent.SCOPES),
            );
          },
        },
      ],
    },
    {
      category: "OOWV",
      icon: new URL("https://www.oowv.de/favicons/favicon.svg"),
      modules: [
        {
          module: "oowv-action-map.display.module",
          icon: OowvActionMapIconComponent,
          link: "/oowv/action-map",
          services: {GeoDataService},
          scopes: OowvActionMapComponent.SCOPES,
        },
      ],
    },
  ];
}
