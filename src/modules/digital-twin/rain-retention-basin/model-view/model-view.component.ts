import { Component, ElementRef, OnDestroy, OnInit, AfterViewInit, viewChild, Input, signal, WritableSignal, effect } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader, OrbitControls } from 'three-stdlib';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { TranslateDirective } from '@ngx-translate/core';
import { remixCalendar2Line, remixContrastDrop2Line, remixRainyLine, remixTimeLine } from '@ng-icons/remixicon';
import { SimulationIntervalOption, SimulationParameter } from '../../common/types/SimulationTypes';
import { ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'model-view-rrb',
  imports: [
    NgIconComponent,
    TranslateDirective,
    BaseChartDirective
],
  templateUrl: './model-view.component.html',
  providers: [
    provideIcons({
      remixRainyLine,
      remixTimeLine,
      remixCalendar2Line,
      remixContrastDrop2Line
    }),
  ],
})
export class ModelViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() filename: string = '';
  @Input() cam: {x: number, y: number, z: number} = {x: 0, y: 0, z: 0};
  @Input() isSimulation: boolean = false;

  @Input() waterLevel: WritableSignal<number> = signal(20);
  @Input() simulationParameter: WritableSignal<SimulationParameter[]>  = signal([]);
  @Input() intervalForecast: WritableSignal<SimulationIntervalOption> = signal('5 min');

  @Input() volume: WritableSignal<number> = signal(100);
  @Input() catchmentArea: WritableSignal<number> = signal(100);
  @Input() pavedArea: WritableSignal<number> = signal(50);
  @Input() unpavedArea: WritableSignal<number> = signal(50); 

  rendererContainer = viewChild<ElementRef<HTMLDivElement>>('rendererContainer');
  
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationFrameId!: number;
  private resizeObserver!: ResizeObserver;
  private resizeRaf!: number | null;
  private waterPlane: THREE.Plane | null = null;
  
  protected time: WritableSignal<string> = signal('0');
  protected rainAmount: WritableSignal<number> = signal(0);

  private minBound: number = 0;
  private maxBound: number = 0;

  protected chart = viewChild(BaseChartDirective);

  protected simulationChart: ChartData<'line', SimulationParameter[]> = {
      datasets: [{
        data: this.simulationParameter(),
        parsing: {
          xAxisKey: 'time',
          yAxisKey: 'waterLevel'
        },
      }],
    };
  
  constructor() {
    effect(() => {
      const newLevel = this.waterLevel();
      this.animateWaterToLevel(newLevel);
    });

    effect(() => {
      const data = this.simulationParameter();
      const chart = this.chart()?.chart;
      
      if (chart) {
        chart.data.datasets[0].data = data;
        chart.update();
      }
    });
  };
  
  ngOnInit(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);
  
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.set(this.cam.x, this.cam.y, this.cam.z); 
  
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);
  }
  
  ngAfterViewInit(): void {
    const container = this.rendererContainer();
    if (!container) return;
  
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.nativeElement.clientWidth, container.nativeElement.clientHeight);
    this.renderer.localClippingEnabled = true;
    container.nativeElement.appendChild(this.renderer.domElement);
  
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    const loader = new GLTFLoader();

    loader.load('/public/model/' + this.filename, (gltf) => {
      const model = gltf.scene;
      this.scene.add(model);
      model.rotation.y = - Math.PI / 4;
      this.setUpWater(model);
      this.animateWaterToLevel(this.waterLevel());
    });

    this.animate();
    this.resizeObserver = new ResizeObserver(() => this.scheduleResize());
    this.resizeObserver.observe(container.nativeElement);
  }
  
  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    if (this.renderer) this.renderer.dispose();
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
  }

  private scheduleResize() {
    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    this.resizeRaf = requestAnimationFrame(() => this.onContainerResize());
  }
  
  private onContainerResize = () => {
    const container = this.rendererContainer();
    if (!container) return;
  
    const width = container.nativeElement.clientWidth;
    const height = container.nativeElement.clientHeight;
  
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private setUpWater(model: THREE.Object3D) {
    const water = model.getObjectByName('WaterVolume');

    if (!(water instanceof THREE.Mesh)) {
      console.error('WaterVolume nicht gefunden oder kein Mesh');
      return;
    }

    this.waterPlane = new THREE.Plane(
      new THREE.Vector3(0, -1, 0), // nach unten
      0
    );

    const mat = water.material as THREE.MeshStandardMaterial;
    mat.transparent = true;
    mat.opacity = 0.6;
    mat.depthWrite = false;
    mat.clippingPlanes = [this.waterPlane];
    mat.clipIntersection = true;

    water.renderOrder = 1;

    this.minBound = new THREE.Box3().setFromObject(water).min.y;
    this.maxBound = new THREE.Box3().setFromObject(water).max.x;
  };

  protected animateWaterToLevel(newScale: number) {
    if (!this.waterPlane) return;

    this.waterPlane.constant = this.minBound + (newScale / 100) * (this.maxBound - this.minBound);

    this.waterLevel.set(newScale);
  };

  protected startWaterSimulation() {
    this.computeSimulationParameter();

    let index = 0;
    
    const runStep = () => {
      const nextLevel = this.simulationParameter()[index];
      
      this.animateWaterToLevel(nextLevel.waterLevel);
      this.time.set(nextLevel.time);
      this.rainAmount.set(nextLevel.rainAmount);

      index++;
      if (index < this.simulationParameter().length) {
        setTimeout(runStep, 1000);
      }
    };

    runStep();
  };

  protected computeSimulationParameter() {
    let currentLevel = this.waterLevel();

    this.simulationParameter.set(this.simulationParameter().map(param => {
      const waterAmount: number = (this.pavedArea() * 0.85 + this.unpavedArea() * 0.05) * param.rainAmount * 10; // ("* 10000": ha => m²; "/ 1000": l => m³)

      let outflow: number = 0;
      outflow = this.computeOutflow(currentLevel);

      currentLevel = currentLevel + (waterAmount - outflow) / this.volume() * 100; 
      param.waterLevel = currentLevel > 0 ? currentLevel : 0;
      return param;
    }));
  };

  private computeOutflow(waterLevel: number): number {
    if (waterLevel < 10) return 0;

    const timeFactor = this.intervalForecast() === '5 min' ? 300 :
                       this.intervalForecast() === '10 min' ? 600 :
                       this.intervalForecast() === '15 min' ? 900 :
                       this.intervalForecast() === '30 min' ? 1800 : 3600;
    
    return 0.14 * timeFactor ; // (140  m³/s * time in s)
  };
}