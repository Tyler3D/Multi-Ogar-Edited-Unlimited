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
	if(this.owner.minionCollectPellets){
		if (this.gameServer.tickCounter % 10 == 0) {
		this.updateCenterInGame();
		this.updateViewBox();
		this.viewNodes = [];
		var self = this;
		this.gameServer.quadTree.find(this.viewBox, function (quadItem) {
            if (quadItem.cell.cellType == 1)
                self.viewNodes.push(quadItem.cell);
        });
		var bestDistance = 1e999;
		for (var i in this.viewNodes) {
			var cell = this.viewNodes[i];
			var dx = this.cells[0].position.x - cell.position.x;
			var dy = this.cells[0].position.y - cell.position.y;
			var distance = dx * dx + dy * dy;
			if (distance < bestDistance) {
			bestDistance = distance;
			this.mouse.x = cell.position.x;
			this.mouse.y = cell.position.y;
			}
		}
		}
	} else {
		this.mouse.x = this.owner.mouse.x;
	    this.mouse.y = this.owner.mouse.y;
	}
};
