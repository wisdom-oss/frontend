import {computed, input, resource, Directive} from "@angular/core";
import {GeoJSONSourceComponent} from "@maplibre/ngx-maplibre-gl";
import {FeatureCollection, Feature, Polygon} from "geojson";

import * as turf from "@turf/turf";

/**
 * Directive to calculate a polygon around a cluster and some of its children.
 *
 * This directive adds support for visualizing what a cluster roughly contains
 * by generating a convex hull around the cluster’s children. It’s an estimate,
 * not an exact boundary, but gives a good visual idea of the grouped area.
 * It only fetches children a few levels deep for speed.
 *
 * The resulting polygon also includes a `bbox` (bounding box) property, so you
 * can use it to zoom to the cluster area or trigger similar actions.
 *
 * Use it on a second `mgl-geojson-source`, pass in the clustered source and
 * a cluster ID, and then bind the output `polygon()` as the `[data]` input.
 *
 * To access the directive instance (for calling `polygon()`), use a local
 * template variable with `#...="cluster-polygon"` — this works because the
 * directive sets `exportAs: "cluster-polygon"`.
 *
 * @example
 * ```html
 * <!-- clustered source -->
 * <mgl-geojson-source
 *   [data]="featureCollection"
 *   [cluster]="true"
 *   #clusteredSource
 * ></mgl-geojson-source>
 *
 * <!-- outline source for a hovered or selected cluster -->
 * <mgl-geojson-source
 *   mglClusterPolygon
 *   [source]="clusteredSource"
 *   [clusterId]="hoveredClusterId()"
 *   [data]="outlineSource.polygon()"
 *   #outlineSource="cluster-polygon"
 * ></mgl-geojson-source>
 * ```
 *
 * The `#outlineSource="cluster-polygon"` part assigns the directive instance
 * to a local variable so you can call `outlineSource.polygon()` directly in
 * your template.
 */
@Directive({
  selector: "mgl-geojson-source[mglClusterPolygon]",
  exportAs: "cluster-polygon",
})
export class ClusterPolygonSourceDirective {
  /** Clustered GeoJSON source that this directive reads from. */
  readonly source = input.required<GeoJSONSourceComponent>();

  /**
   * ID of the cluster to calculate a polygon for.
   *
   * Should come from a feature with `cluster: true` in its properties.
   * Can be `undefined` or `null` if no cluster is currently selected.
   */
  readonly clusterId = input<number | undefined | null>();

  private polygonsCache = new Map<number, Feature<Polygon>>();
  private polygonsResource = resource({
    params: () => this.clusterId(),
    loader: async ({params: clusterId}) => {
      if (clusterId === null || clusterId === undefined) return;

      let cached = this.polygonsCache.get(clusterId);
      if (cached) return cached;

      let points = await this.getClusterChildrenRecursive(clusterId);
      let polygon = turf.convex({type: "FeatureCollection", features: points});
      if (!polygon) return;
      polygon.bbox = turf.bbox(polygon);
      this.polygonsCache.set(clusterId, polygon);
      return polygon;
    },
  });

  /**
   * Signal that returns a polygon feature collection for the current cluster.
   *
   * If `clusterId` is `undefined` or `null`, this returns an empty feature collection.
   * Otherwise, it returns a convex hull polygon around the cluster's children.
   *
   * The polygon includes a `bbox` property, which can be used for map zooming or
   * positioning logic.
   */
  readonly polygon = computed(() => {
    let value = this.polygonsResource.value();
    if (!value)
      return {type: "FeatureCollection", features: []} as FeatureCollection;
    return value;
  });

  private async getClusterChildrenRecursive(
    clusterId: number,
    out: Array<Feature> = [],
    depth: number = 5,
  ): Promise<Array<Feature>> {
    if (depth <= 0) return out;

    let source = this.source();
    let children = await source.getClusterChildren(clusterId);

    await Promise.all(
      children.map(async child => {
        if (!child.properties?.["cluster"]) {
          out.push(child);
          return;
        }

        if (typeof child.id != "number") return;
        await this.getClusterChildrenRecursive(child.id, out, depth - 1);
      }),
    );

    return out;
  }
}
