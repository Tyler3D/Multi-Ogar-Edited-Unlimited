var BinaryWriter = require('./BinaryWriter');

function LeaderboardPosition(playerTracker, i) {
    this.playerTracker = playerTracker;
    this.place = Math.max(i, 0);
}

module.exports = LeaderboardPosition;

LeaderboardPosition.prototype.build = function() {
    if (this.playerTracker.__place === this.place) return null;
    this.playerTracker.__place = this.place;
    var buf = new BinaryWriter();
    buf.writeUInt8(0x30);
    buf.writeUInt16(this.place);
    return buf.toBuffer();
};
