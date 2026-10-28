import {computed, signal, Service, Signal} from "@angular/core";
import * as turboColormap from "turbo-colormap";

import {RadarDataService} from "./radar-data.service";

type SamplingInputs = {
  canvas: Signal<HTMLCanvasElement | undefined>;
  imageUrl: Signal<string | undefined>;
  pixel: Signal<{x: number; y: number} | null>;
  masked: Signal<boolean>;
  manifest: Signal<RadarDataService.Manifest | undefined>;
};

@Service()
export class RadarDataImageSamplingService {
  private inputs = signal<SamplingInputs | null>(null);
  private loadedFrame = signal<string | null>(null);
  private context = computed(() =>
    this.inputs()?.canvas()?.getContext("2d", {willReadFrequently: true}),
  );

  readonly hoveredRasterRgb = computed<{
    r: number;
    g: number;
    b: number;
  } | null>(() => {
    const inputs = this.inputs();
    const context = this.context();
    if (!inputs || !context) return null;

    const pixel = inputs.pixel();
    const frame = this.loadedFrame();
    if (inputs.masked() || !pixel || !frame || frame !== inputs.imageUrl())
      return null;

    const {width, height} = context.canvas;
    if (pixel.x < 0 || pixel.x >= width || pixel.y < 0 || pixel.y >= height)
      return null;

    const {data} = context.getImageData(pixel.x, pixel.y, 1, 1);
    if (data[3] === 0) return null;
    return {r: data[0], g: data[1], b: data[2]};
  });

  readonly hoveredRasterValue = computed<number | null>(() => {
    const rgb = this.hoveredRasterRgb();
    const manifest = this.inputs()?.manifest();
    if (!rgb || !manifest) return null;

    const intensity = turboColormap.snapColorToIntensity([rgb.r, rgb.g, rgb.b]);
    return manifest.min + (intensity / 255) * (manifest.max - manifest.min);
  });

  connect(inputs: SamplingInputs) {
    this.inputs.set(inputs);
  }

  drawImage(image: HTMLImageElement, url: string) {
    this.loadedFrame.set(null);
    const context = this.context();
    if (!context) return;

    context.canvas.width = image.naturalWidth;
    context.canvas.height = image.naturalHeight;
    try {
      context.drawImage(image, 0, 0);
      this.loadedFrame.set(url);
    } catch (error) {
      console.warn("Could not read radar image pixel data", error);
    }
  }
}
