import { Component, ElementRef, OnDestroy, OnInit, AfterViewInit, viewChild, Input, signal, WritableSignal, effect, Signal } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader, OrbitControls } from 'three-stdlib';
import { gsap } from 'gsap';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { TranslateDirective } from '@ngx-translate/core';
import { remixCalendar2Line, remixContrastDrop2Line, remixRainyLine, remixTimeLine } from '@ng-icons/remixicon';
import { SimulationIntervalOption, SimulationParameter } from '../../rain-retention-basin/tabs/simulation/simulation.component';

@Component({
  selector: 'model-view',
  imports: [
    NgIconComponent,
    TranslateDirective
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
  
  private originalY: number = 1;
  protected time: WritableSignal<string> = signal('0');
  protected rainAmount: WritableSignal<number> = signal(0);
  
  constructor() {
    effect(() => {
      const newLevel = this.waterLevel();
      this.animateWaterToLevel(newLevel);
    });
  };
  
  ngOnInit(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);
  
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.set(this.cam.x, this.cam.y, this.cam.z); 
  
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);
  }
  
  ngAfterViewInit(): void {
    const container = this.rendererContainer();
    if (!container) return;
  
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.nativeElement.clientWidth, container.nativeElement.clientHeight);
    container.nativeElement.appendChild(this.renderer.domElement);
  
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    const loader = new GLTFLoader();

    loader.load('/public/model/' + this.filename, (gltf) => {
      const model = gltf.scene;
      this.scene.add(model);
      this.setColorMesh(model, 'Water', 0x0000ff);
      this.setColorMesh(model, 'Pool', 0xffffff);
      this.setScaleYWater(model, this.waterLevel());
      model.rotation.y = - Math.PI / 4;
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
  
  private setColorMesh = (model: THREE.Group<THREE.Object3DEventMap>, objectName: string, color: string|number) => {
    const mesh = model.getObjectByName(objectName) as THREE.Mesh;
  
    if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.color.set(color);
    }
  };
  
  private setScaleYWater = (model: THREE.Group<THREE.Object3DEventMap>, scaleY: number) => {
    const water = model.getObjectByName('Water');

    if (!water) return;

    this.originalY = water.scale.y;
    let newY = (scaleY / 100) * this.originalY;
  
    if (newY < 0 || newY > this.originalY) {
      newY = 0;
    }
  
    if (water) {
      water.scale.set(water.scale.x, newY, water.scale.z);
      water.position.y = this.originalY * this.originalY * (newY - this.originalY);
    } 
  
    water.renderOrder = 1;
  };

  private animateWaterToLevel(newScale: number) {
    const water = this.scene.getObjectByName('Water');

    if (!water) return;

    gsap.to(water.scale, {
      y: (newScale / 100) * this.originalY,
      duration: 0.5,
      ease: "power2.out"
    });

    // keep bottom anchored
    gsap.to(water.position, {
      y: this.originalY * this.originalY * (((newScale / 100) * this.originalY) - this.originalY),
      duration: 0.5,
      ease: "power2.out"
    });

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
    const timeFactor = this.intervalForecast() === '5 min' ? 1/12 :
                       this.intervalForecast() === '15 min' ? 1/4 :
                       this.intervalForecast() === '30 min' ? 1/2 : 1;

    this.simulationParameter.set(this.simulationParameter().map(param => {
      const waterAmount: number = (this.pavedArea() * 0.85 + this.unpavedArea() * 0.05) * param.rainAmount * timeFactor * 10; // ("* 10000": ha => m²; "/ 1000": l => m³)

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
                       this.intervalForecast() === '15 min' ? 900 :
                       this.intervalForecast() === '30 min' ? 1800 : 3600;
    
    return 0.14 * timeFactor ; // (140  m³/s * time in s)
  };
}