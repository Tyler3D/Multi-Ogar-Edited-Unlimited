var FFA = require('./FFA'); // Base gamemode
var Entity = require('../entity');
var Logger = require('../modules/Logger');

function Popsplit() {
    FFA.apply(this, Array.prototype.slice.call(arguments));
    
    this.ID = 5;
    this.name = "Popsplit";
    this.specByLeaderboard = true;
    
    // Gamemode Specific Variables
    this.nodesPopsplitVirus = [];
    this.tickPopsplitVirusSpawn = 0;
    this.tickPopsplitVirusUpdate = 0;
    
    // Config
    this.PopsplitVirusSpawnInterval = 25 * 5;  // How many ticks it takes to spawn another Popsplit Virus (5 seconds)
    this.PopsplitVirusMinAmount = 10;
}

module.exports = Popsplit;
Popsplit.prototype = new FFA();

// Gamemode Specific Functions

Popsplit.prototype.spawnPopsplitVirus = function (gameServer) {
    // Checks if there are enough Popsplit on the map
    if (this.nodesPopsplitVirus.length >= this.PopsplitVirusMinAmount) {
        return;
    }
    // Spawns a Popsplit Virus
    var pos = gameServer.randomPos();
    if (gameServer.willCollide(pos, 149)) {
        // cannot find safe position => do not spawn
        return;
    }
    // Spawn if no cells are colliding
    var PopsplitVirus = new Entity.PopsplitVirus(gameServer, null, pos, null);
    gameServer.addNode(PopsplitVirus);
};

// Override

Popsplit.prototype.onServerInit = function (gameServer) {
    // Called when the server starts
    gameServer.run = true;
    
    // Ovveride functions for special virus mechanics
    var self = this;

    Entity.PopsplitVirus.prototype.onAdd = function () {
        self.nodesPopsplitVirus.push(this);
    };
    Entity.PopsplitVirus.prototype.onRemove = function () {
        var index = self.nodesPopsplitVirus.indexOf(this);
        if (index != -1) 
            self.nodesPopsplitVirus.splice(index, 1);
    };
};

Popsplit.prototype.onTick = function (gameServer) {
    // Popsplit Virus Spawning
    if (this.tickPopsplitVirusSpawn >= this.PopsplitVirusSpawnInterval) {
        this.tickPopsplitVirusSpawn = 0;
        this.spawnPopsplitVirus(gameServer);
    } else {
        this.tickPopsplitVirusSpawn++;
    }
    if (this.tickPopsplitVirusUpdate >= this.PopsplitVirusIntervalInterval) {
        this.tickPopsplitVirusUpdate = 0;
        for (var i = 0; i < this.nodesPopsplitVirus.length; i++) {
            this.nodesPopsplitVirus[i].onUpdate();
        }
    } else {
        this.tickPopsplitVirusUpdate++;
    }
};
