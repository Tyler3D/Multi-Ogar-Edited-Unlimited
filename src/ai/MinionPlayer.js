var PlayerTracker = require('../PlayerTracker');

function MinionPlayer() {
    PlayerTracker.apply(this, Array.prototype.slice.call(arguments));
    this.isMi = true; // Marks as minion
}

module.exports = MinionPlayer;
MinionPlayer.prototype = new PlayerTracker();

// Functions
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
    if (!this.gameServer.minionLeader.socket.isConnected || this.gameServer.minionEnabled == false) {
        this.socket.close();
    }
};

// Overrides the update function from player tracker
MinionPlayer.prototype.sendUpdate = function () { 
    // Since this is for minions, just follow the players mouse
    var m = this.gameServer.minionLeader.mouse;
    this.mouse = !this.gameServer.minionLeader.isRemoved ? m : m;
};
