// A fake socket for minions

function MinionSocket(gameServer) {
    this.server = gameServer;
    this.isCloseRequested = false;
}

module.exports = MinionSocket;

MinionSocket.prototype.sendPacket = function (packet) {
    // Fakes sending a packet
    return;
};

MinionSocket.prototype.close = function (error) {
    // Removes the minion
    this.isCloseRequest = true;
};