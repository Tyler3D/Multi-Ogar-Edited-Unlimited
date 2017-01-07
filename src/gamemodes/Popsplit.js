var FFA = require('./FFA'); // Base gamemode
var Entity = require('../entity');
var Logger = require('../modules/Logger');

function Popsplit() {
    FFA.apply(this, Array.prototype.slice.call(arguments));
    // Popsplit Viruses are 100 % Popsplit while Lottery Viruses have about a 33 % Choice to become a Popsplit Virus
    this.ID = 5;
    this.name = "Popsplit";
    this.specByLeaderboard = true;
    
    // Gamemode Specific Variables
    this.nodesPopsplitVirus = [];
    this.tickPopsplitVirusSpawn = 0;
    this.tickPopsplitVirusUpdate = 0;
    // Lottery Virus
    this.nodesLotteryVirus = [];
    this.tickLotteryVirusSpawn = 0;
    this.tickLotteyVirusUpdate = 0;
    
    // Config
    this.PopsplitVirusSpawnInterval = 25 * 45;  // How many ticks it takes to spawn another Popsplit Virus (5 seconds)
    this.PopsplitVirusMinAmount = 10;
    // Lottery Viruses only spawn once a minute.
    this.LotteryVirusSpawnInterval = 25 * 10;
    this.LotteryVirusMinAmount = 10;

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

Popsplit.prototype.spawnLotteryVirus = function (gameServer) {
    // Checks if there are enough Popsplit on the map
    if (this.nodesLotteryVirus.length >= this.LotteryVirusMinAmount) {
        return;
    }
    // Spawns a Popsplit Virus
    var pos = gameServer.randomPos();
    if (gameServer.willCollide(pos, 149)) {
        // cannot find safe position => do not spawn
        return;
    }
    // Spawn if no cells are colliding
    var LotteryVirus = new Entity.Lottery(gameServer, null, pos, null);
    gameServer.addNode(LotteryVirus);
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

    Entity.Lottery.prototype.onAdd = function () {
        self.nodesPopsplitVirus.push(this);
    };
    Entity.Lottery.prototype.onRemove = function () {
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
    // Lottery Virus Spawning
    if (this.tickLotteryVirusSpawn >= this.LotteryVirusSpawnInterval) {
        this.tickLotteryVirusSpawn = 0;
        this.spawnLotteryVirus(gameServer);
    } else {
        this.tickLotteryVirusSpawn++;
    }
    if (this.tickLotteryVirusUpdate >= this.LotteryVirusIntervalInterval) {
        this.tickLotteryVirusUpdate = 0;
        for (var i = 0; i < this.nodesLotteryVirus.length; i++) {
            this.nodesLotteryVirus[i].onUpdate();
        }
    } else {
        this.tickLotteryVirusUpdate++;
    }

    }

