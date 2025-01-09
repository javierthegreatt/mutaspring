import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";
import Stats from "https://cdn.jsdelivr.net/npm/three@0.130.1/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.116.0/examples/jsm/controls/OrbitControls.js";
import { GUI } from "https://cdn.jsdelivr.net/npm/three@0.130.1/examples/jsm/libs/dat.gui.module.js";
import { Simulation } from "./simulation.js";
import { InfoBoard } from "./info.js";
import { Graph } from "./graph.js";

class Program {
  async init() {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.25,
      100
    );
    camera.layers.enable(1);

    //camera.position.set(10, 10, 20);
    //camera.lookAt(new THREE.Vector3(10, 5, 0));

    camera.position.set(0, 4, 30);
    camera.lookAt(new THREE.Vector3(0, 4, 0));

    //camera.position.set(0, 20, 0);
    //camera.lookAt(new THREE.Vector3(0, 0, 0));

    //camera.position.set(-10, 4, 0);
    //camera.lookAt(new THREE.Vector3(4, 4, 0));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe0e0e0);
    scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);

    this._clock = new THREE.Clock();

    // Settings and GUI

    const graph = new Graph();

    const params = {
      populationSize: 50,
      addHumanPlayer: false,
      runtime: {
        successTime: 6,
      },
    };

    const scoreModel = {
      alive: 0,
      score: 0,
      generation: 0,
    };

    const gui = new GUI();
    const staticSettings = gui.addFolder("Static Settings");
    staticSettings
      .add(params, "populationSize", 0, 200)
      .name("Population Size");
    staticSettings.open();

    const trainingInfo = gui.addFolder("Training Info");
    trainingInfo.add(scoreModel, "score").name("Score").step(0.1).listen();
    trainingInfo.add(scoreModel, "generation").name("Generation").listen();
    trainingInfo.add(scoreModel, "alive").name("Alive").listen();
    trainingInfo.open();

    const trainingSettings = gui.addFolder("Training Settings");
    trainingSettings
      .add(params.runtime, "successTime", 0, 25, 0.1)
      .name("Success time");
    trainingSettings.open();

    // Lightning

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(0, 20, 10);
    scene.add(dirLight);

    // Ground mesh

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);

    const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
    controls.minZoom = 1.0;
    controls.maxZoom = 5;
    this._cameraControls = controls;

    window.addEventListener("resize", this._onWindowResize.bind(this));

    // Stats and scoreboard
    const stats = new Stats();
    container.appendChild(stats.dom);

    const scoreboard = new InfoBoard(scoreModel);

    this._scene = scene;
    this._camera = camera;
    this._renderer = renderer;
    this._stats = stats;

    this._scoreboard = scoreboard;
    this._simulation = new Simulation({ scene, scoreboard, graph, ...params });
    await this._simulation.init();
    this._simulation.startNewRound();
  }

  update() {
    const dt = this._clock.getDelta();
    this._stats.update();

    this._cameraControls.update();
    this._renderer.render(this._scene, this._camera);
    this._simulation.update(dt);
  }

  _onWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

async function main() {
  const program = new Program();

  const loop = () => {
    program.update();
    requestAnimationFrame(loop);
  };

  await program.init();
  loop();
}

main();
