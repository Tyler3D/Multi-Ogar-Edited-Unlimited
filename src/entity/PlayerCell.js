var Cell = require('./Cell');

function PlayerCell() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.cellType = 0;
    this._canRemerge = false;
}

module.exports = PlayerCell;
PlayerCell.prototype = new Cell();

// Main Functions

PlayerCell.prototype.canEat = function (cell) {
    return true; // player cell can eat anyone
};

PlayerCell.prototype.getSpeed = function (dist) {
    var speed = 2.2 * Math.pow(this._size, -0.439);
    speed *= 40 * this.gameServer.config.playerSpeed;
    return Math.min(dist, speed) / dist;
};

PlayerCell.prototype.onAdd = function (gameServer) {
    // Add to player nodes list
    this.gameServer.nodesPlayer.unshift(this);
};

PlayerCell.prototype.onRemove = function (gameServer) {
    // Remove from player cell list
    var index = this.owner.cells.indexOf(this);
    if (index != -1) this.owner.cells.splice(index, 1);

    index = this.gameServer.nodesPlayer.indexOf(this);
    if (index != -1) this.gameServer.nodesPlayer.splice(index, 1);
};

PlayerCell.prototype.onEat = function (prey) {
    if (!this.gameServer.config.playerBotGrow) {
        if (this._mass >= 625 && prey._mass <= 17 && prey.cellType == 0)
            prey._sizeSquared = 0; // Can't grow from players under 17 mass
    }
    this.setSize(Math.sqrt(this._sizeSquared + prey._sizeSquared));
    if (prey.cellType == 0 && prey.owner.perfectpopsplit && prey.owner != this.owner) {
        this.owner.beingpopsplited = true;
        var self = this;
        setTimeout(function() {
        self.owner.beingpopsplited = false;
        }, 500) // 0.5 Seconds after inital popsplit
    }
    this.owner.exp += ((Math.sqrt(prey._sizeSquared)) / 20);
};