import {
  Location,
  LocationStrategy,
  PathLocationStrategy,
} from "@angular/common";
import {HttpClient, HttpContext} from "@angular/common/http";
import {
  effect,
  signal,
  viewChild,
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ElementRef,
} from "@angular/core";
import {FragmentsGroup} from "@thatopen/fragments";
import dayjs from "dayjs";
import {firstValueFrom} from "rxjs";
import {Vector3} from "three";

import * as OBC from "@thatopen/components";

import {Once} from "../../common/utils/once";
import {httpContexts} from "../../common/http-contexts";
import {signals} from "../../common/signals";
import {LayerSelectionControlComponent} from "../../common/components/map/layer-selection-control/layer-selection-control.component";
import {keys} from "../../common/utils/keys";
import { ResizeObserverDirective } from "../../common/directives/resize-observer.directive";

const MODEL_URLS = {
  TGA: "/files/WW-Langeoog/20191105-4001110-WW-TGA.ifc",
  ELT: "/files/WW-Langeoog/20191028-4001110-WW-ELT.ifc",
  ARCH: "/files/WW-Langeoog/20191028-4001110-WW-Arch.ifc",
  GEL: "/files/WW-Langeoog/20191028-4001110-WW-Gel.ifc",
} as const;

@Component({
  imports: [LayerSelectionControlComponent, ResizeObserverDirective],
  providers: [
    Location,
    {provide: LocationStrategy, useClass: PathLocationStrategy},
  ],
  templateUrl: "./pump-models.component.html",
})
export class PumpModelsComponent implements OnInit, AfterViewInit, OnDestroy {
  protected container =
    viewChild.required<ElementRef<HTMLDivElement>>("container");

  private components = new OBC.Components();
  private fragments = this.components.get(OBC.FragmentsManager);
  private world = signal<undefined | OBC.World>(undefined);
  private models = {
    TGA: new Once<FragmentsGroup>(),
    ELT: new Once<FragmentsGroup>(),
    ARCH: new Once<FragmentsGroup>(),
    GEL: new Once<FragmentsGroup>(),
  } as const;

  protected modelLoading = signals.fromPromise(
    Promise.all(Object.values(this.models)),
  );
  protected layers = {
    // TGA: signals.toggleable(true),
    ELT: signals.toggleable(false),
    ARCH: signals.toggleable(false),
    GEL: signals.toggleable(false),
  } as const;

  constructor(
    private location: Location,
    private http: HttpClient,
  ) {
    let models = {
      TGA: signals.fromPromise(this.models.TGA),
      ELT: signals.fromPromise(this.models.ELT),
      ARCH: signals.fromPromise(this.models.ARCH),
      GEL: signals.fromPromise(this.models.GEL),
    };

    effect(async () => {
      let world = this.world();
      if (!world) return;

      for (let layer of keys(this.layers)) {
        if (this.layers[layer]()) world.scene.three.add(models[layer]()!);
        else world.scene.three.remove(models[layer]()!);
      }
    });
  }

  async ngOnInit() {
    let components = this.components;
    let fragmentIfcLoader = components.get(OBC.IfcLoader);
    fragmentIfcLoader.settings.autoSetWasm = false;
    fragmentIfcLoader.settings.wasm = {
      path: this.location.prepareExternalUrl("/web-ifc/"),
      absolute: true,
    };

    for (let layer of keys(this.models)) {
      let url = MODEL_URLS[layer];
      let data = await firstValueFrom(
        this.http.get(url, {
          responseType: "arraybuffer",
          context: new HttpContext().set(httpContexts.cache, [
            url,
            dayjs.duration(1, "week"),
          ]),
        }),
      );
      let buffer = new Uint8Array(data);
      this.models[layer].set(await fragmentIfcLoader.load(buffer));
    }
  }

  async ngAfterViewInit() {
    let container = this.container().nativeElement;
    let components = this.components;

    let worlds = components.get(OBC.Worlds);
    let world = worlds.create<
      OBC.SimpleScene,
      OBC.SimpleCamera,
      OBC.SimpleRenderer
    >();

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, container);
    world.camera = new OBC.SimpleCamera(components);

    components.init();

    world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

    world.scene.setup();
    world.scene.three.background = null;

    await Promise.all(Object.values(this.models));
    world.scene.three.add(await this.models.TGA);
    let out = new Vector3();
    world.camera.controls.getPosition(out);
    console.log(out);
    world.camera.controls.fitToSphere(await this.models.TGA, true);
    this.world.set(world);
  }

  ngOnDestroy(): void {
    this.fragments.dispose();
  }
}
