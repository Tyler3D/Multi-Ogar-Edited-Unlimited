var FFA = require('./FFA'); // Base gamemode
var Entity = require('../entity');
var Logger = require('../modules/Logger');

function Rush() {
    FFA.apply(this, Array.prototype.slice.call(arguments));
    
    this.ID = 5;
    this.name = "Rush Mode";
    this.specByLeaderboard = true;
    this.timelimit = 300; //In seconds. 300 = 5 minutes
    this.packetLB = 48;
    this.state;
    this.restartingtimelimit;
}

module.exports = Rush;
Rush.prototype = new FFA();

Rush.prototype.onServerInit = function (gameServer) {
    // Called when the server starts
    gameServer.run = true;
    this.state = false;
    this.restartingtimelimit = this.timelimit;
};
Rush.prototype.onPlayerSpawn = function (gameServer, player) {
    // Called when a player is spawned
    if (!this.state) {
    player.setColor(gameServer.getRandomColor()); // Random color
    gameServer.spawnPlayer(player, gameServer.randomPos());
    }
};
Rush.prototype.formatTime = function (time) { //300
    if (time < 0 || time == 4) {
        return "0:00";
    }
    // Format
    var min = ~~(time / 60);
    var sec = time % 60;
    sec = (sec > 9) ? sec : "0" + sec.toString();
    
    if (sec < 10) return min + ":0" + Math.round(sec) + " Minutes"
    if (Math.floor(sec) == 60) return min + 1 + ":00 Minutes"
    else return min + ":" +  Math.floor(sec , 1) + " Minutes"
};

Rush.prototype.onTick = function () {
    this.restartingtimelimit-=.0365;
};
Rush.prototype.updateLB2 = function(gameServer) {
    gameServer.leaderboardType = 49;
    var lb = gameServer.leaderboard;
    // Loop through all clients
    for (var i = 0; i < gameServer.clients.length; i++) {
        var client = gameServer.clients[i];
        if (client == null) continue;
        
        var player = client.playerTracker;
        if (player.socket.isConnected == false)
            continue; // Don't add disconnected players to list
        
        var playerScore = player.getScore();
        
        if (player.cells.length <= 0)
            continue;
        
        if (lb.length == 0) {
            // Initial player
            lb.push(player);
            continue;
        } else if (lb.length < gameServer.config.serverMaxLB) {
            this.leaderboardAddSort(player, lb);
        } else {
            // 10 in leaderboard already
            if (playerScore > lb[gameServer.config.serverMaxLB - 1].getScore()) {
                lb.pop();
                this.leaderboardAddSort(player, lb);
            }
        }
    }
    setTimeout(function() {
        process.exit(3);
        }, 20000)
}
Rush.prototype.updateLB = function (gameServer) {
    var lb = gameServer.leaderboard;
    gameServer.leaderboardType = this.packetLB;
 
            if (this.formatTime(this.restartingtimelimit) == "0:00") {
                //End Game
                this.state = true;
                this.updateLB2(gameServer);
                gameServer.run = false;
                }
            else {
            gameServer.run = true;
            lb[0] = "TIME LEFT";
            var time = this.formatTime(this.restartingtimelimit);
            lb[1] = time;
            this.onTick();
            }
            
        
};
