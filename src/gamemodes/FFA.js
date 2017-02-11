var Mode = require('./Mode');

function FFA() {
    Mode.apply(this, Array.prototype.slice.call(arguments));

    this.ID = 0;
    this.name = "Free For All";
    this.specByLeaderboard = true;
}

module.exports = FFA;
FFA.prototype = new Mode();

// Gamemode-specific functions

FFA.prototype.onPlayerSpawn = function(gameServer, player) {
    player.setColor(gameServer.getRandomColor());
    // Spawn player
    gameServer.spawnPlayer(player, gameServer.randomPos());
};

FFA.prototype.updateLB = function(gameServer) {
    gameServer.leaderboardType = this.packetLB;
    var lb = [],
        i = 0, l = gameServer.clients.length,
        client, pushi, s, ri = 0;

    for (; i < l; i++) {
        client = gameServer.clients[i];
        if (client.isRemoved) continue;
        if (client.playerTracker.cells.length <= 0) continue;

        for (pushi = 0; pushi < ri; pushi++)
            if (lb[pushi]._score < client.playerTracker._score) break;

        lb.splice(pushi, 0, client.playerTracker);
        ri++;
    }

    gameServer.leaderboard = lb;
    this.rankOne = lb[0];
    gameServer.leaderboardChanged = true;
};
