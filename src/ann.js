export class Neuron {
    constructor(params) {
        this.isNeuron = true;
        this.inputs = params.inputs;
        this.w = params.w;
        this.b = params.b;
    }

    setInputs(inputs) {
        this.inputs = inputs;
    }

    activation(value) {
        const t = 0.1;
        return value > t ? value : undefined;
    }

    compute(step) {
        if (this.cachedStep == step) {
            return this.cachedValue;
        }

        const values = this.inputs.map(input => {
            return input && input.isNeuron ? input.compute(step) : input;
        }).filter(v => v != undefined || v != null);

        let sum = values.reduce((a, b) => a + b, 0);

        const result = this.activation((sum / values.length) * this.w + this.b);

        this.cachedStep = step;
        this.cachedValue = result;

        return result;
    }
}

export class ExampleNeuralNetwork {

    constructor(params) {
        const genes = params.genes;
        const sensors = params.sensors;

        const inputSize = sensors;
        const hiddenSize = 3;
        const outputSize = 2;

        const totalSize = inputSize + hiddenSize + outputSize
        if ((genes.length / 2) < totalSize) {
            throw new Error("Too few genes to initialise NN! Unique genes: " + genes.length / 2 + " Layer size: " + totalSize);
        }

        const inputLayer = [];
        for (let i = 0; i < inputSize; i++) {
            const index = i * 2;
            inputLayer.push(new Neuron({ inputs: [], w: genes[index], b: genes[index + 1] }));
        }

        const hiddenLayer = [];
        for (let i = 0; i < hiddenSize; i++) {
            const index = i * 2 + inputSize;
            hiddenLayer.push(new Neuron({ inputs: inputLayer, w: genes[index], b: genes[index + 1] }));
        }

        const outputLayer = [];
        for (let i = 0; i < outputSize; i++) {
            const index = i * 2 + inputSize + hiddenSize;
            outputLayer.push(new Neuron({ inputs: hiddenLayer, w: genes[index], b: genes[index + 1] }));
        }

        this._inputLayer = inputLayer;
        this._outputLayer = outputLayer;
    }

    setSensorValues(sensorValues) {
        if (sensorValues.length != this._inputLayer.length) {
            throw new Error("Sensor value and input layer missmatch!");
        }

        for (let i = 0; i < this._inputLayer.length; i++) {
            const neuron = this._inputLayer[i];
            neuron.setInputs([sensorValues[i]]);
        }
    }

    compute(step) {
        const results = this._outputLayer.map(n => n.compute(step));
        let sum = results.reduce((a, b) => a + b, 0);
        return results.map(r => r / sum);
    }
}

/*
// ANN example

const genes = Array.from({ length: 20 }, () => Math.random());
// const genes = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

const ann = new ExampleNeuralNetwork({ genes });
ann.setSensorValues([1, 0, 1, 0, 0]);
console.log(ann.compute(1));
ann.setSensorValues([0, 0, 1, 1, 0]);
console.log(ann.compute(2));
ann.setSensorValues([1, 0, 1, 1, 1]);
console.log(ann.compute(3));
*/