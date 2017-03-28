var Cell = require('./Cell');
var Virus = require('./Virus');
// Test Your Luck :)

function Lottery() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    
    this.cellType = 2;
    this.isSpiked = true;
    this.isMotherCell = false;       // Not to confuse bots
    this.LotteryVirusSize = 136;
    this.setColor({ r: 255, g: 209, b: 26 });
       if (!this._size) {
        this.setSize(this.LotteryVirusSize);
    }
}

module.exports = Lottery;
Lottery.prototype = new Cell();

Lottery.prototype.onEat = function (prey) {
    // Called to eat prey cell
    this.setSize(Math.sqrt(this._sizeSquared + prey._sizeSquared));
    
    if (this._size >= this.gameServer.config.virusMaxSize) {
        this.setSize(this.gameServer.config.virusMinSize); // Reset mass
        this.gameServer.shootVirus(this, prey.boostDirection.angle);
    }
};
Lottery.prototype.onEaten = function (c) {
        this.prize = Math.round((Math.random() * (3.75 - 0.8)) + 0.8); // 1 = Gold, 2 = Silver, 3 = Bronze Don't Change It does it automatically
        if (this.prize == 1) { // Gold Best Prize
        if (c.owner == null) return;

        var minSize = this.gameServer.config.playerMinSize,
        min = (minSize == 32) ? 30 : minSize, // minimun size of small splits
        cellsLeft = this.gameServer.config.playerMaxCells - c.owner.cells.length,
        numSplits = cellsLeft < (c._mass / 16) ? cellsLeft : (c._mass / 16),
        splitMass = (c._mass / numSplits) < min ? (c._mass / numSplits) : min;
    
        // Diverse explosion(s)
            // ckeck size of exploding
            var threshold = c._mass - numSplits * splitMass; 
            
            if (threshold > 466) {
                // virus explosion multipliers
                var exp = (Math.random() * (2.5 - 1.5)) + 1.5;
                while (threshold / exp > 24) {
                    threshold /= exp;
                    exp = 2;
            }
        }
    // Split
            var max = this.gameServer.config.playerMaxCells * this.gameServer.config.playerMaxCells;
            for (var k = 0; k < max; k++) {
            var angle = 2 * Math.PI * Math.random(); // random directions
            this.gameServer.splitPlayerCell(c.owner, c, angle, min);
    }
}
    else if (this.prize == 2) { // Silver Second Best Prize
        Virus.onEaten(c);
    }

    else if (this.prize >= 3) { // Bronze Worst Prize
  
    // Split once xD
            var angle = 2 * Math.PI * Math.random(); // random directions
            var mass = (Math.random() * (c._mass / 20 - c._mass / 7)) + c._mass / 7; 
            this.gameServer.splitPlayerCell(c.owner, c, angle, mass);


    }
}



Lottery.prototype.onAdd = function () {
};

Lottery.prototype.onRemove = function () {
};
