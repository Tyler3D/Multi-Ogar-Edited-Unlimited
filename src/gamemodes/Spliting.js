var FFA = require('./FFA'); // Base gamemode
var Entity = require('../entity');
var Logger = require('../modules/Logger');
var PlayerTracker = require('../PlayerTracker');

function Split() {
    FFA.apply(this, Array.prototype.slice.call(arguments));
    this.ID = 5;
    this.name = "Split";
    this.specByLeaderboard = true;
    this.max = 30 //* 3 // 3 Minutes
    this.min = 10 //* 1.5 // 90 Seconds or 1.5 Minutes
}

module.exports = Split;
Split.prototype = new FFA();

// Gamemode Specific Functions


Split.prototype.onServerInit = function (gameServer) {
    // Override Config
    gameServer.run = true;
    gameServer.config.playerMaxCells = 256;
};
Split.prototype.onTick = function (gameServer) {
    for (var i in gameServer.clients) {
        var client = gameServer.clients[i].playerTracker;
        this.time = Math.random() * (this.max - this.min) + this.min;
        if (client.timeuntilsplit > this.time) {
            client.pressSpace();
            client.timeuntilsplit = 0;
        } else client.timeuntilsplit += 0.04;
    }
};
