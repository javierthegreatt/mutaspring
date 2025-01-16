export class InfoBoard {

    constructor(model) {
        this._model = model;
        this.score = 0;
        this.alive = 0;
        this.generation = 0;
    }
    
    set score(val) {
        this._model.score = val;
    }

    get score() {
        return this._model.score;
    }

    set alive(val) {
        this._model.alive = val;
    }

    get alive() {
        return this._model.alive;
    }

    set generation(val) {
        this._model.generation = val;
    }

    get generation() {
        return this._model.generation;
    }
}