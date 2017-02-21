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
    // remove if owner loses control or disconnects
    if (!this.owner.socket.isConnected || !this.owner.minionControl)
        this.socket.close();
    // frozen or not
    if (this.owner.minionFrozen) this.frozen = true;
    else this.frozen = false;
    // split cells
    if (this.owner.minionSplit)
        this.socket.packetHandler.pressSpace = true;
    // eject mass
    if (this.owner.minionEject)
        this.socket.packetHandler.pressW = true;
    // follow owners mouse by default
    this.mouse = this.owner.mouse;
};
