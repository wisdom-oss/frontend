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
import typia from "typia";

import {extraTags} from "./common/utils/extra-tags";
import {AuthService} from "./core/auth/auth.service";
import {Scopes} from "./core/auth/scopes";
import {OowvActionMapIconComponent} from "./core/sidebar/icons/oowv-action-map-icon/oowv-action-map-icon.component";
import {OowvActionMapComponent} from "./modules/oowv/action-map/action-map.component";
import {PumpModelsComponent} from "./modules/pump-models/pump-models.component";

type ComponentClass = new (...args: any[]) => Component;
type Icon =
  | (Record<string, string> & extraTags.RecordEntries<1>)
  | ComponentClass
  | URL;

export interface SidebarEntry {
  category: string;
  icon: Icon;
  modules: Array<{
    module: string;
    icon: Icon;
    link: string;
    scopes?: Scopes.Scope[];
    visible?: () => Signal<boolean>;
  }>;
}

export function sidebar(): readonly SidebarEntry[] {
  return typia.assert<SidebarEntry[]>([
    {
      category: "core.sidebar.category.precipitation",
      icon: {remixDrizzleFill},
      modules: [
        {
          module: "weather-data.display.module",
          icon: {remixSunCloudyFill},
          link: "/weather-data",
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
        },
        {
          module: "water-rights.display.module",
          icon: {remixFilePaper2Fill},
          link: "/water-rights",
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
        },
        {
          module: "Be-Water-Smart",
          icon: {remixRfidLine},
          link: "/be-water-smart",
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
          scopes: OowvActionMapComponent.SCOPES,
        },
      ],
    },
  ] satisfies SidebarEntry[]);
}
