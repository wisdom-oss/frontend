declare module "maplibre-xy" {
  import type {Map} from "maplibre-gl";

  export interface UnderzoomOptions {
    extendScale?: number;
    extendPan?: number;
    extend?: boolean;
  }

  export class Underzoom {
    constructor(
      maplibregl: typeof import("maplibre-gl"),
      options?: UnderzoomOptions,
    );

    extendScale: number;
    extendPan: number;
    extend: boolean;

    readonly transformConstrain: NonNullable<
      Parameters<Map["setTransformConstrain"]>[0]
    >;
  }
}
