var Cell = require('./Cell');
var Logger = require('../modules/Logger');

function Virus() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.cellType = 2;
    this.isSpiked = true;
    this.fed = 0;
    this.isMotherCell = false; // Not to confuse bots
    this.setColor({ r: 0x33, g: 0xff, b: 0x33 });
}

module.exports = Virus;
Virus.prototype = new Cell();

// Main Functions

Virus.prototype.canEat = function (cell) {
    return cell.cellType == 3; // virus can eat ejected mass only
};

Virus.prototype.onEat = function (prey) {
    // Called to eat prey cell
    this.setSize(Math.sqrt(this._sizeSquared + prey._sizeSquared));
    
    if (this._size >= this.gameServer.config.virusMaxSize) {
        this.setSize(this.gameServer.config.virusMinSize); // Reset mass
        this.gameServer.shootVirus(this, prey.boostDirection.angle);
    }
};

Virus.prototype.onEaten = function (consumer) {
    var client = consumer.owner;
    if (client == null) return;
    
    var mass = consumer.getMass(),
    maxSplits = ((mass / 16) >> 0) - 1, // maximum amount of splits
    cellsLeft = this.gameServer.config.playerMaxCells - client.cells.length,
    numSplits = Math.min(cellsLeft, maxSplits), // get number of splits
    splitMass = Math.min(consumer.getMass() / numSplits, 24); 

    // cannot split any further
    if (numSplits <= 0) return;
    
    // won't split regular way unless numSplits > 4
    var bigSplits = [];
    if (numSplits == 1) bigSplits = [mass / 2];
    else if (numSplits == 2) bigSplits = [mass / 4, mass / 4];
    else if (numSplits == 3) bigSplits = [mass / 4, mass / 4, mass / 7];
    else if (numSplits == 4) bigSplits = [mass / 5, mass / 7, mass / 8, mass / 10];
    else {
        var m = mass - numSplits * splitMass; // threshold
        var r = Math.random(), mult = 0;      // starting mult
        var mults = {                         // random selection
            v1: ((r * (4 - 3.8)) + 3.8),      // vanilla mult 1
            v2: ((r * (3.8 - 3.7)) + 3.7),    // vanilla mult 2
            v3: ((r * (3.7 - 3.33)) + 3.33),  // vanilla mult 3
            v4: ((r * (2.5 - 2.3)) + 2.3),    // second vanilla mult 1
            v5: ((r * (2.3 - 2.25)) + 2.25),  // second vanilla mult 2
            v6: ((r * (2.25 - 2)) + 2),       // second vanilla mult 3
        };
        
        // Diverse explosions, 1 of 3 selected randomly
        if (m > 466) {
            if (r * 3 <= 1) mult = mults.v1;
            if (r * 3 <= 2) mult = mults.v2;
            if (r * 3 <= 3) mult = mults.v3;
            while (m / mult > 24) {
                m /= mult;
                if (r * 3 <= 1) mult = mults.v4;
                if (r * 3 <= 2) mult = mults.v5;
                if (r * 3 <= 3) mult = mults.v6;
                bigSplits.push(m >> 0);
            }
        }
    }
    numSplits -= bigSplits.length;
    
    // big splits
    var angle = 0;
    for (var k = 0; k < bigSplits.length; k++) {
        angle = 2 * Math.PI * Math.random(); // random directions
        this.gameServer.splitPlayerCell(
            client, consumer, angle, bigSplits[k]
        );
    }

    // small splits
    for (var k = 0; k < numSplits; k++) {
        angle = 2 * Math.PI * Math.random(); // random directions
        this.gameServer.splitPlayerCell(
            client, consumer, angle, splitMass
        );
    }
};

Virus.prototype.onAdd = function (gameServer) {
    gameServer.nodesVirus.push(this);
};

Virus.prototype.onRemove = function (gameServer) {
    var index = gameServer.nodesVirus.indexOf(this);
    if (index != -1) {
        gameServer.nodesVirus.splice(index, 1);
    } else {
        Logger.warn("Virus.onRemove: Tried to remove a non existing virus!");
    }
};
