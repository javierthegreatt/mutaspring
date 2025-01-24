import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';


export class HumanInputController {
  constructor() {
    this._Init();
  }

  _Init() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
    };
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = true;
        break;
      case 65: // a
        this._keys.left = true;
        break;
      case 83: // s
        this._keys.backward = true;
        break;
      case 68: // d
        this._keys.right = true;
        break;
      case 32: // SPACE
        this._keys.space = true;
        break;
      case 16: // SHIFT
        this._keys.shift = true;
        break;
    }
  }

  _onKeyUp(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = false;
        break;
      case 65: // a
        this._keys.left = false;
        break;
      case 83: // s
        this._keys.backward = false;
        break;
      case 68: // d
        this._keys.right = false;
        break;
      case 32: // SPACE
        this._keys.space = false;
        break;
      case 16: // SHIFT
        this._keys.shift = false;
        break;
    }
  }

  shouldJump(sensorInput) {
    return this._keys.space;
  }
};

export class CharacterController {

  constructor(params) {
    this._defaultState = "Running";
    this._scene = params.scene;
    this._gravity = 0.75;
    this._opacity = params.opacity ?? 1.0;
    this._isInitialised = false;

    this._sensors = [];

    this._headOffset = new THREE.Vector3(0, 3, 0);
  }

  start(params) {
    if (!this.isReady() || this._started) {
      return;
    }

    this._decceleration = new THREE.Vector3(0, -2, 0);
    this._acceleration = new THREE.Vector3(0, 60, 0.0);
    this._velocity = new THREE.Vector3(0, 0, 0);
    this._model.y = 0;

    this.id = params.id;
    this._isHuman = params.isHuman;
    this._input = params.input;

    const color = params.color;
    this._setColor(color);

    this._scene.add(this._model);
    this._startDefaultAction();
    this._started = true;
  }

  stop() {
    if (!this.isReady() || !this._started) {
      return;
    }

    this._started = false;
    this._scene.remove(this._model);
  }

  isReady() {
    return this._isInitialised;
  }

  init() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load('models/robot.glb', (gltf) => {
        this._onMeshLoaded(gltf);
        resolve();
      }, undefined, (e) => {
        reject(e);
      });
    });
  }

  _onMeshLoaded(gltf) {
    this._model = gltf.scene;
    this._initActions(gltf.animations);

    this._bbox = new THREE.Box3().setFromObject(this._model);
    this._bbox.expandByVector(new THREE.Vector3(-1, 0, -0.5));

    //this._addBoundingBoxMesh();
    this._addSensorsMesh();

    this._model.rotation.y = Math.PI / 2;
    this._isInitialised = true;
  }

  _setColor(color) {
    this._color = color;

    this._model.traverse(n => {
      if (n.isMesh && n.material) {
        const mat = n.material;
        mat.transparent = true;
        mat.opacity = this._opacity;

        if (!this._isHuman) {
          mat.color = color;
          mat.wireframe = true;
        }
      }
    });
  }

  _addBoundingBoxMesh() {
    var dim = new THREE.Vector3();
    dim.copy(this._bbox.max);
    dim.sub(this._bbox.min);

    var geometry = new THREE.BoxGeometry(dim.x, dim.y, dim.z);
    var material = new THREE.MeshBasicMaterial({ color: this._color });
    material.wireframe = true;
    material.transparent = true;
    material.opacity = 0.3;
    var bboxMesh = new THREE.Mesh(geometry, material);
    bboxMesh.position.y += dim.y / 2;

    this._model.add(bboxMesh);
  }

  _addSensorsMesh() {
    var start = new THREE.Vector3();
    start.addVectors(this._model.position, this._headOffset);

    var distance = 50;
    var spread = 0.04;
    var angles = [-2 * spread * Math.PI, 0 * spread * Math.PI, 2 * spread * Math.PI];

    for (let angle of angles) {

      var material = new THREE.LineBasicMaterial({ color: new THREE.Color(1, 1, 1) });
      material.transparent = true;
      material.opacity = 0.2;

      var direction = new THREE.Vector3(0, 0, 1);
      direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), angle);
      direction.normalize();

      var end = new THREE.Vector3();
      end.addVectors(start, direction.multiplyScalar(distance));

      var geometry = new THREE.Geometry();
      geometry.vertices.push(start);
      geometry.vertices.push(end);

      const sensor = new THREE.Line(geometry, material);
      direction.normalize();
      sensor.dir = direction;

      this._model.add(sensor);
      this._sensors.push(sensor);
    }
  }

  _raycastFromSensor(sensor) {
    var start = new THREE.Vector3();
    start.addVectors(this._model.position, this._headOffset);

    var dir = new THREE.Vector3();
    dir.copy(sensor.dir);
    dir.applyMatrix4(this._model.matrixWorld);

    const raycaster = new THREE.Raycaster(start, dir);
    raycaster.layers.set(1);

    const intersects = raycaster.intersectObjects(this._scene.children);

    if (intersects.length > 0) {
      sensor.value = intersects[0].distance;
      if (sensor.material) {
        sensor.material.opacity = 1.0;
      }
    }
    else {
      sensor.value = undefined;
      if (sensor.material) {
        sensor.material.opacity = 0.2;
      }
    }
  }

  _initActions(animations) {
    const states = ['Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing'];
    const emotes = ['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp'];

    this._mixer = new THREE.AnimationMixer(this._model);

    this._actions = {};

    for (let i = 0; i < animations.length; i++) {
      const clip = animations[i];
      const action = this._mixer.clipAction(clip);
      this._actions[clip.name] = action;

      if (emotes.indexOf(clip.name) >= 0 || states.indexOf(clip.name) >= 4) {
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
      }
    }

    this._startDefaultAction();
  }

  _startDefaultAction() {
    this._activeAction = this._actions[this._defaultState];
    this._activeAction.startAt(Math.random() * 0.5);
    this._activeAction.play();
  }

  _doJump() {
    this._fadeToAction("Jump", 0.2);

    const restoreState = () => {
      this._mixer.removeEventListener('finished', restoreState);
      this._fadeToAction(this._defaultState, 0.2);
    }

    this._mixer.addEventListener('finished', restoreState);
  }


  update(dt) {
    if (!this._started) {
      return;
    }

    if (this._mixer) this._mixer.update(dt);

    const velocity = this._velocity;

    const frameDecceleration = new THREE.Vector3(
      velocity.x * this._decceleration.x,
      velocity.y * this._decceleration.y,
      velocity.z * this._decceleration.z
    );

    frameDecceleration.multiplyScalar(dt);

    velocity.add(frameDecceleration);

    const acc = this._acceleration.clone();

    this._sensors.forEach(s => {
      this._raycastFromSensor(s);
    })

    const sensorInput = this._sensors.map(s => s.value);
    if (this._input && this._input.shouldJump(sensorInput)
      && this._model.position.y <= 0) {
      velocity.y += acc.y * 0.016;
      //console.log(velocity.y, acc.y, dt);
      this._doJump();
    }

    velocity.y -= this._gravity * dt;
    this._model.position.add(velocity);
    this._model.position.y = Math.max(0, this._model.position.y);
  }

  _fadeToAction(name, duration) {
    this._previousAction = this._activeAction;
    this._activeAction = this._actions[name];

    if (this._previousAction !== this._activeAction) {
      this._previousAction.fadeOut(duration);
    }

    this._activeAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();
  }

  checkIntersection(others) {
    if (!this._model) {
      return;
    }

    const box = new THREE.Box3();
    box.copy(this._bbox);
    box.applyMatrix4(this._model.matrixWorld);

    for (let other of others) {
      if (box.intersectsBox(other)) {
        return true;
      }
    }
  }
}