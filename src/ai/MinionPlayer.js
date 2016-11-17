var PlayerTracker = require('../PlayerTracker');

function MinionPlayer() {
    PlayerTracker.apply(this, Array.prototype.slice.call(arguments));
    this.isMi = true;   // Marks as minion
}

module.exports = MinionPlayer;
MinionPlayer.prototype = new PlayerTracker();

MinionPlayer.prototype.checkConnection = function () {
    if (this.socket.isCloseRequest) {
        while (this.cells.length > 0) {
            this.gameServer.removeNode(this.cells[0]);
        }
        this.isRemoved = true;
        return;
    }
    if (this.cells.length <= 0) {
        this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
        if (this.cells.length == 0) this.socket.close();
    }
    if (!this.owner.socket.isConnected || !this.owner.minionControl) 
        this.socket.close();
    this.mouse = this.owner.mouse;
};
