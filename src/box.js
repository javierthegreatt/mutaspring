import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class BoxController {
    constructor(params) {
        this._scene = params.scene;
        this._nextSpawn = 0;
        this._spawnInterval = 3;
        this._cubes = [];
        this._cubeSpeed = 10;
        this._init();
        this._spawnedCubes = 0;
    }

    _init() {
    }

    _spawnCube() {
        const size = 2;
        let width = 1;

        if (Math.random() > 0.3) {
            width = 1.5; 
        }
 
        var geom = new THREE.BoxGeometry(size * width, size, size);
        var material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0x1c1c1c),
            flatShading: true,
            vertexColors: THREE.VertexColors,
        });

        var cube = new THREE.Mesh(geom, material)
        cube.name = "cube";

        cube.position.y = size / 2;
        cube.position.x = 30;

        cube.updateMatrixWorld(true);

        //if (this._spawnedCubes % 3 == 1) {
        //    cube.position.y = 8;
        //}

        cube.geometry.computeBoundingBox();
        cube.layers.set(1);

        this._spawnedCubes += 1;

        this._cubes.push(cube);
        this._scene.add(cube);
    }

    update(dt) {
        this._nextSpawn -= dt;
        if (this._nextSpawn <= 0) {
            this._spawnCube();
            this._nextSpawn = this._spawnInterval;
        }

        const cubeChange = this._cubeSpeed * dt;

        const deadCubes = [];

        for (let i = 0; i < this._cubes.length; i++) {
            const cube = this._cubes[i];
            cube.position.x -= cubeChange;

            if (cube.position.x < -100) {
                deadCubes.push(cube);
            }
        }

        for(let cube of deadCubes) {
            this._cubes.splice(this._cubes.indexOf(cube), 1);
            this._scene.remove(cube);
            cube.geometry.dispose();
            cube.material.dispose();
        }
    }

    getBoxes() {
        return this._cubes.map(cube => {
            const box = new THREE.Box3();
            box.copy(cube.geometry.boundingBox).applyMatrix4(cube.matrixWorld);
            return box;
        });
    }

    remove() {
        for (let i = 0; i < this._cubes.length; i++) {
            const cube = this._cubes[i];
            this._scene.remove(cube);
            cube.geometry.dispose();
            cube.material.dispose();
        }
        this._cubes = [];
    }
}
