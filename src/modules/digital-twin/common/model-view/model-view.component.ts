import { Component, ElementRef, OnDestroy, OnInit, AfterViewInit, viewChild, Input } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader, OrbitControls } from 'three-stdlib';

@Component({
  selector: 'model-view',
  imports: [],
  templateUrl: './model-view.component.html',
})
export class ModelViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() filename : string = '';
  @Input() cam: {x: number, y: number, z: number} = {x: 0, y: 0, z: 0};

  rendererContainer = viewChild<ElementRef<HTMLDivElement>>('rendererContainer');
  
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationFrameId!: number;
  private resizeObserver!: ResizeObserver;
  private resizeRaf!: number | null;
  
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
      this.setScaleYWater(model, 0.66);
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
    const water = model.getObjectByName('Water') as THREE.Mesh;
    const originalY = water.scale.y;
    let newY = scaleY * originalY;
  
    if (newY < 0 || newY > originalY) {
      newY = 0;
    }
  
    if (water) {
      water.scale.set(water.scale.x, newY, water.scale.z);
      water.position.y = originalY * originalY * (newY - originalY);
    } 
  
    water.renderOrder = 1;
  };
}
