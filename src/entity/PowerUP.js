var Cell = require('./Cell');
var PlayerCell = require('./PlayerCell');
function PowerUP(gameServer) {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.cellType = 2;
    this.isSpiked = false;
    this.isMotherCell = false; // Not to confuse bots
    this.setColor({ r: 0xff, g: 0x00, b: 0x94 });
    this.setSize(50);
    this.powertimer = 20 * 1000 // 20 Seconds
    this.power = Math.round(Math.random() * (4 - 1) + 1); // 1 = Speed 2 = Minions 3 = Virus shoot for 5 seconds 4 = One Popsplit Virus w shot
    this.gameServer = gameServer;
}
module.exports = PowerUP;
PowerUP.prototype = new Cell();

// Main Functions

PowerUP.prototype.onEaten = function (c) {
    var player = c.owner;
    var self = this;
    if (this.power == 1) {
        player.doublespeed = true;
            // OverRide
        this.gameServer.sendChatMessage(null, player, "You have been gived with Double Speed For 20 Seconds!");
        setTimeout(function() {
        player.doublespeed = false;
        self.gameServer.sendChatMessage(null, player, "YOUR DOUBLE SPEED POWERUP HAS RAN OUT!");
        }, this.powertimer);
    } else if (this.power == 2) {
        player.minionControl = true;
        for (var i = 0; i < 5; i++) {
            this.gameServer.bots.addMinion(player);
        }
        this.gameServer.sendChatMessage(null, player, "YOU HAVE BEEN GIVED WITH 5 MINIONS! FOR 20 SECONDS");

        setTimeout(function() {
            player.minionControl = false;
            player.miQ = 0;
            self.gameServer.sendChatMessage(null, player, "YOUR MINIONS HAVE SUDDENLY VANISHED!");
        }, this.powertimer);
    } else if (this.power == 3) {
        player.canShootVirus = true;
        this.gameServer.sendChatMessage(null, player, "YOUR HAVE BEEN GRANTED THE ABILITY TO SHOOT VIRUSES!");
        setTimeout(function() {
            player.canShootVirus = false;
            self.gameServer.sendChatMessage(null, player, "YOU CAN NO LONGER SHOOT VIRUSES!");
        }, 5000);
    } else {
        // One popsplt shot
        player.canShootPopsplitVirus = true;
        this.gameServer.sendChatMessage(null, player, "YOU CAN SHOOT ONE POPSPLIT VIRUS NOW! TURN PLAYERS INTO HUNDREDS OF PIECES!");
    }
};

PowerUP.prototype.onAdd = function (gameServer) {
    gameServer.nodesVirus.push(this);
};

PowerUP.prototype.onRemove = function (gameServer) {
    var index = gameServer.nodesVirus.indexOf(this);
    if (index != -1) 
        gameServer.nodesVirus.splice(index, 1);
};
