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
import {FragmentsGroup, FragmentMesh, FragmentIdMap} from "@thatopen/fragments";
import dayjs from "dayjs";
import {firstValueFrom} from "rxjs";

import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

import {Once} from "../../common/utils/once";
import {httpContexts} from "../../common/http-contexts";
import {signals} from "../../common/signals";
import {LayerSelectionControlComponent} from "../../common/components/map/layer-selection-control/layer-selection-control.component";
import {ResizeObserverDirective} from "../../common/directives/resize-observer.directive";
import {keys} from "../../common/utils/keys";

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
  private caster = signal<undefined | OBC.SimpleRaycaster>(undefined);
  private highlighter = undefined as undefined | OBCF.Highlighter;
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

    let position = [-1.12, 1.75, 3.57] as const;
    let target = [5.78, -1.72, 1.38] as const;
    world.camera.controls.setLookAt(...position, ...target);

    world.scene.setup();
    world.scene.three.background = null;

    let [TGA] = await Promise.all([
      this.models.TGA,
      this.models.ELT,
      this.models.ARCH,
      this.models.GEL,
    ]);
    world.scene.three.add(TGA);

    let casters = components.get(OBC.Raycasters);
    let caster = casters.get(world);
    this.caster.set(caster);

    this.highlighter = components.get(OBCF.Highlighter);
    this.highlighter.setup({world, hoverEnabled: false, selectEnabled: false});

    this.world.set(world);
  }

  ngOnDestroy(): void {
    this.fragments.dispose();
  }

  onResize(): void {
    let world = this.world();
    if (!world) return;
    let camera = world.camera as OBC.SimpleCamera;
    // execute aspect ratio one cycle later
    setTimeout(() => camera.updateAspect());
  }

  async raycast(): Promise<null | FragmentMesh> {
    let meshes = (await this.models.TGA).items.map(item => item.mesh);
    for (let layer of keys(this.layers)) {
      if (!this.layers[layer]()) continue;
      meshes.push(...(await this.models[layer]).items.map(item => item.mesh));
    }

    let casted = this.caster()!.castRay(meshes)?.object;
    if (!(casted instanceof FragmentMesh)) return null;
    return casted;
  }

  async findProperties(
    mesh: FragmentMesh
  ): Promise<null | {
    model: FragmentsGroup,
    expressId: number,
    properties: Record<string, any>
  }> {
    for (let layer of keys(this.models)) {
      if (!(layer == "TGA" || this.layers[layer]())) continue;
      let model = await this.models[layer];
      let fragmentMap = model.getFragmentMap();
      let entry = fragmentMap[mesh.uuid];
      if (!entry) continue;
      let expressId = Array.from(entry)[0];
      if (!expressId) continue;
      let properties = await model.getProperties(expressId);
      if (properties) return {model, expressId, properties};
    }
    
    return null;
  }

  async selectRaycast(
    name: "select" | "hover", 
    exclude?: FragmentIdMap,
  ): Promise<null | Record<string, any>> {
    this.highlighter!.clear(name);

    let casted = await this.raycast();
    if (!casted) return null;
    let found = await this.findProperties(casted);
    if (!found) return null;
    let {properties, model, expressId} = found;

    this.highlighter!.highlightByID(name, model.getFragmentMap([expressId]), undefined, undefined, exclude);
    return properties;
  }

  async onClick(): Promise<void> {
    await this.selectRaycast("select");
  }

  private lastMousePos = {x: 0, y: 0};
  private moveThreshold = 10;
  async onMouseMove(event: MouseEvent): Promise<void> {
    let dx = event.clientX - this.lastMousePos.x;
    let dy = event.clientY - this.lastMousePos.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.moveThreshold) return;
    await this.selectRaycast("hover", this.highlighter!.selection["select"]);
    this.lastMousePos = {x: event.clientX, y: event.clientY};
  }
}
