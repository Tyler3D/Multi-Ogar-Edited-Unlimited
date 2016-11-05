var PlayerTracker = require('../PlayerTracker');

function MinionPlayer() {
    PlayerTracker.apply(this, Array.prototype.slice.call(arguments));
    this.isMi = true; // Marks as minion
    this.splitCooldown = 0;
}

module.exports = MinionPlayer;
MinionPlayer.prototype = new PlayerTracker();

// Functions
MinionPlayer.prototype.getLowestCell = function () {
    // Sort the cells by Array.sort() function to avoid errors
    var sorted = this.cells.valueOf();
    sorted.sort(function (a, b) {
        return b.getSize() - a.getSize();
    });
    
    return sorted[0];
};

MinionPlayer.prototype.checkConnection = function () {
    if (this.socket.isCloseRequest) {
        while (this.cells.length > 0) {
            this.gameServer.removeNode(this.cells[0]);
        }
        this.isRemoved = true;
        return;
    }
    
    // Respawn if minion is dead
    if (this.cells.length <= 0) {
        this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
        if (this.cells.length == 0) {
            // If the minion cannot spawn any cells, then disconnect it
            this.socket.close();
        }
    }
    if (!this.gameServer.minionLeader.socket.isConnected || 
        this.gameServer.minionEnabled == false) {
        this.socket.close();
    }
};

// Overrides the update function from player tracker
MinionPlayer.prototype.sendUpdate = function () { 
    if (this.splitCooldown > 0) this.splitCooldown--;
    var cell = this.getLowestCell();
    this.decide(cell);
};

MinionPlayer.prototype.decide = function (cell) {
    if (!cell) return; // Cell was eaten, check in the next tick
    
    // Since this is for minions, just follow the players mouse
    var player = this.gameServer.minionLeader.mouse;
    if (!this.gameServer.minionLeader.isRemoved) {
        this.mouse = player;
    } else {
        this.mouse = player;
    }
};
