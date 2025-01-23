import { ExampleNeuralNetwork } from './ann.js';

export class RandomInputController {
    constructor(params) {
        this._prob = params.prob ?? 0;
    }

    shouldJump(sensorInput) {
        return Math.random() >= (1.0 - this._prob);
    }
};

export class SmarterInputController {
    constructor() {
        this._threshhold = 6;
    }

    shouldJump(sensorInput) {
        const sensor = sensorInput[4];
        return sensor && sensor < this._threshhold;
    }
};

export class ANNDrivenInputController {
    constructor(params) {
        this._stepCounter = 0;
        this._genes = params.genes;
        this._ann = new ExampleNeuralNetwork({ genes: this._genes, sensors: 3  });
    }

    shouldJump(sensorInput) {
       this._ann.setSensorValues(sensorInput);
       const result = this._ann.compute(this._stepCounter++);
       return result[0] > 0.5;
    }
}


/*
// Neuron Example

const a = new Neuron({inputs: [1], w: 0.2, b: 0.4});
const b = new Neuron({inputs: [1], w: 0.1, b: 0.0});
const c = new Neuron({inputs: [1], w: 0.5, b: 0.5});

const r = new Neuron({inputs: [a, b, c], w: 1, b: 0});

console.log(r.compute(1));

b.setInputs([10]);

console.log(r.compute(2));
*/
