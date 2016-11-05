// Project imports
var MinionPlayer = require('./MinionPlayer');
var MinionSocket = require('./MinionSocket');
var PacketHandler = require('../PacketHandler');

function MinionLoader(gameServer) {
    this.gameServer = gameServer;
}

module.exports = MinionLoader;

MinionLoader.prototype.addBot = function () {
    var s = new MinionSocket(this.gameServer);
    s.playerTracker = new MinionPlayer(this.gameServer, s);
    s.packetHandler = new PacketHandler(this.gameServer, s);
    
    // Add to client list
    this.gameServer.clients.push(s);
    
    // Add to world & set name
    s.packetHandler.setNickname(this.gameServer.minionName);
};
