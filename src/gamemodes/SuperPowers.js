var FFA = require('./FFA'); // Base gamemode
var Entity = require('../entity');
var GameServer = require('../GameServer');

function Powers() {
    FFA.apply(this, Array.prototype.slice.call(arguments));
    
    this.ID = 6;
    this.name = "Super Powers";
    this.specByLeaderboard = true;
    
    // Gamemode Specific Variables
    this.powerSpawnInterval = 25 * 10; // 10 Seconds
    this.powerMinAmount = 20;
    this.tickpowerSpawn = 0;
    this.nodesPower = [];
}

module.exports = Powers;
Powers.prototype = new FFA();

// Gamemode Specific Functions

// Override
Powers.prototype.onServerInit = function (gameServer) {
    var self = this;
GameServer.prototype.movePlayer = function(cell1, client) {
    if (client.socket.isConnected == false || client.frozen)
        return;
    // TODO: use vector for distance(s)
    // get distance
    var dx = ~~(client.mouse.x - cell1.position.x);
    var dy = ~~(client.mouse.y - cell1.position.y);
    var squared = dx * dx + dy * dy;
    if (squared < 1 || isNaN(dx) || isNaN(dy)) {
        return;
    }
    // get movement speed
    var d = Math.sqrt(squared);
    if (this.config.slithermode && client.slither) {
        var speed = cell1.getSpeed(d) * 2;
        var self = this;
        self.slitherEject(client);
    } else if (client.doublespeed) {
    	if (this.config.slithermode && client.slither)
    	speed = cell1.getSpeed(d) * 4;
        else speed = cell1.getSpeed(d) * 2;
    }
    else speed = cell1.getSpeed(d);
    if (!speed) return; // avoid shaking

    // move player cells
    cell1.position.x += dx / d * speed;
    cell1.position.y += dy / d * speed;
    cell1.checkBorder(this.border);
};
GameServer.prototype.ejectMass = function(client) {
    if (!this.canEjectMass(client) || client.frozen)
        return;
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i];
        
        if (!cell || cell._size < this.config.playerMinSplitSize) {
            continue;
        }
        
        var dx = client.mouse.x - cell.position.x;
        var dy = client.mouse.y - cell.position.y;
        var dl = dx * dx + dy * dy;
        if (dl > 1) {
            dx /= Math.sqrt(dl);
            dy /= Math.sqrt(dl);
        } else {
            dx = 1;
            dy = 0;
        }
        
        // Remove mass from parent cell first
        var sizeLoss = this.config.ejectSizeLoss;
        var sizeSquared = cell._sizeSquared - sizeLoss * sizeLoss;
        cell.setSize(Math.sqrt(sizeSquared));
        
        // Get starting position
        var pos = {
            x: cell.position.x + dx * cell._size,
            y: cell.position.y + dy * cell._size
        };
        var angle = Math.atan2(dx, dy);
        if (isNaN(angle)) angle = Math.PI / 2;
        
        // Randomize angle
        angle += (Math.random() * 0.6) - 0.3;
        
        // Create cell
        if (client.canShootVirus || this.config.ejectVirus) {
            var ejected = new Entity.Virus(this, null, pos, this.config.ejectSize);
        } else if (client.canShootPopsplitVirus) {
            ejected = new Entity.PopsplitVirus(this, null, pos, this.config.ejectSize);
            client.canShootPopsplitVirus = false;
        } 
         else {
            ejected = new Entity.EjectedMass(this, null, pos, this.config.ejectSize);
        }
        ejected.setColor(cell.color);
        ejected.setBoost(780, angle);
        this.addNode(ejected);
    }
};
    Entity.PowerUP.prototype.onAdd = function () {
        self.nodesPower.push(this);
    };
    Entity.PowerUP.prototype.onRemove = function () {
        var index = self.nodesPower.indexOf(this);
        if (index != -1) 
        self.nodesPower.splice(index, 1);
}

};
Powers.prototype.spawnPowerUp = function (gameServer) {
    if (this.nodesPower.length >= this.powerMinAmount) {
        return;
    }
    var pos = gameServer.randomPos();
    if (gameServer.willCollide(pos, 149)) {
        // cannot find safe position => do not spawn
        return;
    }
    var Power = new Entity.PowerUP(gameServer, null, pos, null);
    gameServer.addNode(Power);
};

Powers.prototype.onTick = function (gameServer) {
    if (this.tickpowerSpawn >= this.powerSpawnInterval) {
        this.tickPowerSpawn = 0;
        this.spawnPowerUp(gameServer);
    } else {
        this.tickpowerSpawn++;
    }
};
