import { Component, ElementRef, OnDestroy, OnInit, AfterViewInit, viewChild } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader, OrbitControls } from 'three-stdlib'

@Component({
  selector: 'braintank-overview',
  imports: [],
  templateUrl: './overview.component.html'
})
export class OverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  rendererContainer = viewChild<ElementRef<HTMLDivElement>>('rendererContainer');

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationFrameId!: number;

  ngOnInit(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0.25, 2);

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
    loader.load('/assets/uploads_files_5179123_IBC.glb', (gltf) => {
      const model = gltf.scene;
      this.scene.add(model);

      this.colorMesh(model, 'Water', 0x0000ff);
      this.colorMesh(model, 'Cube', 0xffffff);

      model.rotation.y = - Math.PI / 4;
    });

    this.animate();
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    if (this.renderer) {
      this.renderer.dispose();
    }
    window.removeEventListener('resize', this.onWindowResize);
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = () => {
    const container = this.rendererContainer();
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private colorMesh = (model: THREE.Group<THREE.Object3DEventMap>, objectName: string, color: string|number) => {
    const mesh = model.getObjectByName(objectName) as THREE.Mesh;

    if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.color.set(color);
    }
  };
}
