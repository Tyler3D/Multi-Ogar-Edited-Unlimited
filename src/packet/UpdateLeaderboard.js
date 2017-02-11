// Import
var BinaryWriter = require("./BinaryWriter");


function UpdateLeaderboard(playerTracker, leaderboard, leaderboardType) {
    this.playerTracker = playerTracker;
    this.leaderboard = leaderboard;
    this.leaderboardType = leaderboardType;
    this.leaderboardCount = Math.min(leaderboard.length, playerTracker.gameServer.config.serverMaxLB);
}

module.exports = UpdateLeaderboard;

UpdateLeaderboard.prototype.build = function(protocol) {
    switch (this.leaderboardType) {
        case 0x30:
            // UserText
            if (protocol < 11)
                return this.buildUserText6(protocol);
            else
                return this.buildUserText11();
        case 0x31:
            // FFA
            if (protocol < 6)
                return this.buildFfa5();
            else if (protocol < 11)
                return this.buildFfa6();
            else return this.buildFfa11();
        case 0x32:
            // Team
            return this.buildTeam();
        default:
            return null;
    }
}

// UserText
UpdateLeaderboard.prototype.buildUserText6 = function(protocol) {
    var writer = new BinaryWriter();
    writer.writeUInt8(protocol < 6 ? 0x31 : 0x30);
    writer.writeUInt32(this.leaderboard.length >>> 0);
    for (var i = 0; i < this.leaderboard.length; i++) {
        var item = this.leaderboard[i] || "";

        if (protocol < 6)
            writer.writeUInt32(0);

        if (protocol < 6)
            writer.writeStringZeroUnicode(item);
        else
            writer.writeStringZeroUtf8(item);
    }
    return writer.toBuffer();
};

UpdateLeaderboard.prototype.buildUserText11 = function() {
    var writer = new BinaryWriter();
    writer.writeUInt8(0x31);
    writer.writeUInt32(this.leaderboard.length >>> 0);
    for (var i = 0; i < this.leaderboard.length; i++) {
        var item = this.leaderboard[i] || "";

        writer.writeStringZeroUtf8(item);
    }
    return writer.toBuffer();
};


// FFA protocol 5
UpdateLeaderboard.prototype.buildFfa5 = function() {
    var player = this.playerTracker;

    var writer = new BinaryWriter();
    writer.writeUInt8(0x31);                               // Packet ID
    writer.writeUInt32(this.leaderboardCount >>> 0);       // Number of elements
    for (var i = 0; i < this.leaderboardCount; i++) {
        var item = this.leaderboard[i];
        if (item == null) return null;  // bad leaderboardm just don't send it

        var name = item._nameUnicode;
        var id = 0;
        if (item == player && item.cells.length > 0)
            id = item.cells[0].nodeId ^ this.playerTracker.scrambleId;


        writer.writeUInt32(id >>> 0);   // Player cell Id
        if (name != null)
            writer.writeBytes(name);
        else
            writer.writeUInt16(0);
    }
    return writer.toBuffer();
};

// FFA protocol 6
UpdateLeaderboard.prototype.buildFfa6 = function() {
    var player = this.playerTracker;

    var writer = new BinaryWriter();
    writer.writeUInt8(0x31);                               // Packet ID
    writer.writeUInt32(this.leaderboardCount >>> 0);       // Number of elements
    for (var i = 0; i < this.leaderboardCount; i++) {
        var item = this.leaderboard[i];
        if (item == null) return null;   // bad leaderboardm just don't send it

        var name = item._nameUtf8;
        var id = item == player ? 1 : 0;

        writer.writeUInt32(id >>> 0);   // isMe flag
        if (name != null)
            writer.writeBytes(name);
        else
            writer.writeUInt8(0);
    }
    return writer.toBuffer();
};

// FFA protocol 11
UpdateLeaderboard.prototype.buildFfa11 = function() {
    var player = this.playerTracker;

    var writer = new BinaryWriter();
    writer.writeUInt8(0x31);                                 // Packet ID
    writer.writeUInt32(this.leaderboardCount >>> 0);         // Number of elements
    for (var i = 0; i < this.leaderboardCount; i++) {
        var item = this.leaderboard[i];
        if (item == null) return null;  // bad leaderboardm just don't send it

        var name = item._nameUtf8;
        if (name != null)
            writer.writeBytes(name);
        else
            writer.writeUInt8(0);
    }
    return writer.toBuffer();
};

// Team
UpdateLeaderboard.prototype.buildTeam = function() {
    var writer = new BinaryWriter();
    writer.writeUInt8(0x32);                                // Packet ID
    writer.writeUInt32(this.leaderboard.length >>> 0);       // Number of elements
    for (var i = 0; i < this.leaderboard.length; i++) {
        var value = this.leaderboard[i];
        if (value == null) return null;  // bad leaderboardm just don't send it

        if (isNaN(value)) value = 0;
        value = value < 0 ? 0 : value;
        value = value > 1 ? 1 : value;

        writer.writeFloat(value);                // isMe flag (previously cell ID)
    }
    return writer.toBuffer();
};
