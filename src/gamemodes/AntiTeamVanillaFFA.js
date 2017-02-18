var FFA = require('./FFA'); // Base gamemode
var Entity = require('../entity');
var PlayerTracker = require('../PlayerTracker');
var Logger = require('../modules/Logger');

function AntiTeam() {
    FFA.apply(this, Array.prototype.slice.call(arguments));
    
    this.ID = 8;
    this.name = "Anti Team FFA";
    this.specByLeaderboard = true;
    
    // Gamemode Specific Variables
    this.FeedAmount = 75 // 75 W's
    this.VirusPop = 3;
    this.timeuntilreset = 25 * 60 * 2 // 2 Minutes
    this.antiteamduration = 1000 * 30 // 30 Seconds
    this.nodes = [];
}

module.exports = AntiTeam;
AntiTeam.prototype = new FFA();

// Gamemode Specific Functions

// Override
AntiTeam.prototype.onServerInit = function (gameServer) {
    PlayerTracker.prototype.pressW = function () {
    if (this.spectate) {
        return;
    }
    else if (this.gameServer.run) {
        this.wcount++;
        this.lastwtick = 0;
        this.gameServer.ejectMass(this);
    }
};
Entity.Virus.prototype.onEaten = function (c) {
    if (c.owner == null) return;

    var minSize = this.gameServer.config.playerMinSize,
    min = (minSize == 32) ? 30 : minSize, // minimun size of small splits
    cellsLeft = this.gameServer.config.playerMaxCells - c.owner.cells.length,
    numSplits = cellsLeft < (c._mass / 16) ? cellsLeft : (c._mass / 16),
    splitMass = (c._mass / numSplits) < min ? (c._mass / numSplits) : min;
    
    // Diverse explosion(s)
    var big = [];
    if (!numSplits) return; // can't split anymore
    if (numSplits == 1) big = [c._mass/2]
    else if (numSplits == 2) big = [c._mass/4,c._mass/4];
    else if (numSplits == 3) big = [c._mass/4,c._mass/4,c._mass/7];
    else if (numSplits == 4) big = [c._mass/5,c._mass/7,c._mass/8,c._mass/10];
    else {
        // ckeck size of exploding
        var threshold = c._mass - numSplits * splitMass; 
        // Monotone explosion(s)
        if (threshold > 466) {
            // virus explosion multipliers
            var v = c.isMoving ? 4 : 4.5;
            var exp = (Math.random() * (v - 3.33)) + 3.33;
            while (threshold / exp > 24) {
                threshold /= exp;
                exp = 2;
                big.push(threshold >> 0);
            }
        }
    }
    c.owner.viruspopcount++;
    c.owner.lastviruspoptick = 0;
    numSplits -= big.length;
    // big splits
    for (var k = 0; k < big.length; k++) {
        var angle = 2 * Math.PI * Math.random(); // random directions
        this.gameServer.splitPlayerCell(c.owner, c, angle, big[k]);
    }
    // small splits
    for (var k = 0; k < numSplits; k++) {
        angle = 2 * Math.PI * Math.random(); // random directions
        this.gameServer.splitPlayerCell(c.owner, c, angle, min);
    }
};
};

AntiTeam.prototype.onPlayerSpawn = function (gameServer, player) {
    this.nodes.push(player);
    player.setColor(gameServer.getRandomColor());
    player.antiteamstate = false;
    gameServer.spawnPlayer(player, gameServer.randomPos());
};
AntiTeam.prototype.AntiTeam = function (gameServer, player) {
        for (var j in player.cells) {
            var cell = player.cells[j];
            if (cell == null || cell.isRemoved)
                continue;
            var size = cell._size;
            if (size <= gameServer.config.playerMinSize)
                continue;
            var rate = 0.005
            var decay = 1 - rate * 1;
            size = Math.sqrt(size * size * decay);
            size = Math.max(size, gameServer.config.playerMinSize);
            if (size != cell._size) {
                cell.setSize(size);
            }
       }
       setTimeout(function() {player.antiteamstate = false}, this.antiteamduration);
};

AntiTeam.prototype.onTick = function (gameServer) {
    for (var i in gameServer.clients) {
        var client = gameServer.clients[i].playerTracker;
        if (client.lastwtick > this.timeuntilreset) client.wcount = 0;
        else client.lastwtick++;
        if (client.lastviruspoptick > this.timeuntilreset) client.viruspopcount = 0;
        else client.lastviruspoptick++;
    }
        for (var i in this.nodes) {
            if (this.nodes[i].wcount == this.FeedAmount || this.nodes[i].viruspopcount == this.VirusPop) {
                this.nodes[i].antiteamstate = true;
                this.nodes[i].wcount = 0;
                this.nodes[i].viruspopcount = 0;
            }
            if (this.nodes[i].antiteamstate) {
                this.AntiTeam(gameServer, this.nodes[i]);
            }
        }
};
