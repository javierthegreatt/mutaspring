import { CharacterController, HumanInputController } from "./character.js";
import {
  RandomInputController,
  SmarterInputController,
  ANNDrivenInputController,
} from "./ai.js";
import { BoxController } from "./box.js";
import { generateGen, crossGens, mutateGen } from "./gene.js";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";

export class Simulation {
  constructor(params) {
    this._populationSize = params.populationSize;
    this._scene = params.scene;
    this._characters = [];
    this._charactersAlive = [];
    this._generation = 0;
    this._scoreboard = params.scoreboard;
    this._runtimeParams = params.runtime;
    this._graph = params.graph;
  }

  init() {
    for (let i = 0; i < this._populationSize; i++) {
      const character = new CharacterController({
        scene: this._scene,
        opacity: 0.2,
      });
      this._characters.push(character);
    }

    return Promise.all(this._characters.map((c) => c.init()));
  }

  startNewRound() {
    this._generation++;
    this._isReady = false;
    console.log("Starting generation: " + this._generation);
    this._scoreboard.generation = this._generation;
    this.reset();

    this._prevGen = this._curGen;
    this._curGen = this._generateGeneration(this._prevGen);

    if (this._prevGen) {
      const pg = this._prevGen;
      const scoreSum = pg.map((x) => x.score).reduce((acc, cur) => acc + cur);
      const medianScore = scoreSum / pg.length;
      this._graph.addRunInfo({
        generation: this._generation - 1,
        score: medianScore,
      });
    }

    this._boxController = new BoxController({ scene: this._scene });
    this._scoreboard.score = 0;

    this._charactersAlive = [];

    for (let i = 0; i < this._populationSize; i++) {
      /*
            const random = new RandomInputController({ prob: 0.01 });
            const smarter = new SmarterInputController();
            const input = i % 3 == 1 ? smarter : random;
            */
      const genes = this._curGen[i].genes;
      const input = new ANNDrivenInputController({ genes });

      const character = this._characters[i];
      this._charactersAlive.push(character);

      const colorVector = new THREE.Vector3(
        genes[20] * genes[20],
        genes[21] * genes[21],
        genes[22] * genes[22]
      );
      colorVector.normalize();

      const color = new THREE.Color(
        colorVector.x,
        colorVector.y,
        colorVector.z
      );
      character.start({ id: i, input, color });
    }

    this._scoreboard.alive = this._charactersAlive.length;
  }

  _generateGeneration(prev) {
    if (!prev) {
      return Array.from({ length: this._populationSize }, () => ({
        genes: generateGen(),
        score: 0,
      }));
    }

    prev.sort((a, b) => {
      return a.score >= b.score ? -1 : 1;
    });

    const nextGen = [];

    const numParentGenes = 4;
    for (let i = 0; i < numParentGenes; i++) {
      nextGen.push(prev[i].genes);
    }

    let i = 0;
    while (nextGen.length < this._populationSize) {
      const x = Math.floor(i / numParentGenes) % numParentGenes;
      const y = i % numParentGenes;
      i++;

      if (x == y) {
        continue;
      }

      const a = prev[x].genes;
      const b = prev[y].genes;
      const mixed = crossGens(a, b);
      const mutated = mutateGen(mixed);
      nextGen.push(mutated);
    }

    return nextGen.map((genes) => ({ genes, score: 0 }));
  }

  reset() {
    if (this._boxController) {
      this._boxController.remove();
    }

    for (let i = 0; i < this._charactersAlive.length; i++) {
      const character = this._charactersAlive[i];
      character.stop();
    }

    this._charactersAlive = [];
  }

  isReady() {
    if (this._charactersAlive.length == 0) {
      return false;
    }

    if (this._isReady == true) {
      return true;
    }

    for (let i = 0; i < this._charactersAlive.length; i++) {
      const character = this._charactersAlive[i];
      if (!character.isReady()) {
        return false;
      }
    }
    this._isReady = true;
    return true;
  }

  update(dt) {
    if (!this.isReady()) {
      return;
    }

    this._charactersAlive.forEach((c) => c.update(dt));
    this._boxController.update(dt);
    this._scoreboard.score += dt;

    const boxes = this._boxController.getBoxes();

    const markedDeath = [];

    for (let i = 0; i < this._charactersAlive.length; i++) {
      const character = this._charactersAlive[i];

      if (!character.isHuman) {
        this._curGen[character.id].score = this._scoreboard.score;
      }

      if (character.checkIntersection(boxes)) {
        markedDeath.push(character);
      }
    }

    if (markedDeath.length > 0) {
      //console.log(markedDeath.length + " characters hit the box!");
      for (let character of markedDeath) {
        character.stop();

        this._charactersAlive.splice(
          this._charactersAlive.indexOf(character),
          1
        );
        this._scoreboard.alive = this._charactersAlive.length;
      }

      if (this._charactersAlive.length == 0) {
        this.startNewRound();
      }
    }

    if (this._scoreboard.score >= this._runtimeParams.successTime) {
      this.startNewRound();
    }
  }
}
