var Cell = require('./Cell');
var Food = require('./Food');

function PopsplitVirus() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    
    this.cellType = 2;
    this.isSpiked = true;
    this.isMotherCell = false;       // Not to confuse bots
    this.PopsplitVirusSize = 136;
    this.setColor({ r: 0, g: 153, b: 153 });
        if (!this._size) {
        this.setSize(this.PopsplitVirusSize);
    }
}

module.exports = PopsplitVirus;
PopsplitVirus.prototype = new Cell();

PopsplitVirus.prototype.onEat = function (prey) {
    // Called to eat prey cell
    this.setSize(Math.sqrt(this._sizeSquared + prey._sizeSquared));
    
    if (this._size >= this.gameServer.config.virusMaxSize) {
        this.setSize(this.gameServer.config.virusMinSize); // Reset mass
        this.gameServer.shootVirus(this, prey.boostDirection.angle);
    }
};

PopsplitVirus.prototype.onEaten = function (c) {
    if (c.owner == null) return;

    var minSize = this.gameServer.config.playerMinSize,
    min = (minSize == 32) ? 30 : minSize, // minimun size of small splits
    cellsLeft = this.gameServer.config.playerMaxCells - c.owner.cells.length,
    numSplits = cellsLeft < (c._mass / 16) ? cellsLeft : (c._mass / 16),
    splitMass = (c._mass / numSplits) < min ? (c._mass / numSplits) : min;
    
    // Diverse explosion(s)
        // ckeck size of exploding
        var threshold = c._mass - numSplits * splitMass; 
        // Monotone explosion(s)
        if (threshold > 466) {
            // virus explosion multipliers
            var exp = (Math.random() * (3.5 - 1.5)) + 1.5;
            while (threshold / exp > 24) {
                threshold /= exp;
                exp = 2;
            }
        }
    // Split
        for (var k = 0; k < 16; k++) {
        var angle = 2 * Math.PI * Math.random(); // random directions
        var mass = (Math.random() * (c._mass / 20 - c._mass / 7)) + c._mass / 7; 
        this.gameServer.splitPlayerCell(c.owner, c, angle, mass);

    }
        for (var k = 0; k < 128; k++) {
        var angle = 2 * Math.PI * Math.random(); // random directions
        var mass = (Math.random() * (c._mass / 35 - c._mass / 18)) + c._mass / 18;
        if (mass < 20) mass = 20;
        this.gameServer.splitPlayerCell(c.owner, c, angle, mass);
            
        }
        for (var k = 0; k < 512; k++) {
        var angle = 2 * Math.PI * Math.random(); // random directions
        this.gameServer.splitPlayerCell(c.owner, c, angle, min);
    }

    }


PopsplitVirus.prototype.onAdd = function () {
};

PopsplitVirus.prototype.onRemove = function () {
};
