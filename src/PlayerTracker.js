var Packet = require('./packet');
var BinaryWriter = require("./packet/BinaryWriter");
var UserRoleEnum = require("./enum/UserRoleEnum");

function PlayerTracker(gameServer, socket) {
    this.gameServer = gameServer;
    this.socket = socket;
    this.pID = -1;
    this.userAuth = null;
    this.isRemoved = false;
    this.isCloseRequested = false;
    this._name = "";
    this._skin = "";
    this._nameUtf8 = null;
    this._nameUnicode = null;
    this._skinUtf8 = null;
    this._skinUtf8protocol11 = null;
    this.color = { r: 0, g: 0, b: 0 };
    this.viewNodes = [];
    this.clientNodes = [];
    this.cells = [];
    this.mergeOverride = false; // Triggered by console command
    this._score = 0; // Needed for leaderboard
    this._scale = 1;
    this._scaleF = 1;
    this.isMassChanged = true;
    this.borderCounter = 0;
    this.skinChanger = false;
    
    this.tickLeaderboard = 0;
    this.team = 0;
    this.spectate = false;
    this.freeRoam = false;      // Free-roam mode enables player to move in spectate mode
    this.spectateTarget = null; // Spectate target, null for largest player
    this.lastSpectateSwitchTick = 0;
    
    this.centerPos = {
        x: 0,
        y: 0
    };
    this.mouse = {
        x: 0,
        y: 0
    };
    this.viewBox = {
        minx: 0,
        miny: 0,
        maxx: 0,
        maxy: 0,
        width: 0,
        height: 0,
        halfWidth: 0,
        halfHeight: 0
    };
        // Gamemode function
    if (gameServer) {
        this.connectedTime = gameServer.stepDateTime;
        this.centerPos.x = gameServer.border.centerx;
        this.centerPos.y = gameServer.border.centery;
        // Player id
        this.pID = gameServer.lastPlayerId++ >> 0;
        // Gamemode function
        gameServer.gameMode.onPlayerInit(this);
        // Only scramble if enabled in config
        this.scramble();
    }
    // Account system
    this.level = 0;
    this.levelexps = [
    	50,
    	125,
    	250,
    	500,
    	1000,
    	1600,
    	2300,
    	3100,
    	4000,
    	5000,
    	6100,
    	7300,
    	8600,
    	10000,
    	11500,
    	13100,
    	14800,
    	16600,
    	18500,
    	20500,
    	22600,
    	24800,
    	27100,
    	29500,
    	32000,
    	34600,
    	37300,
    	40100,
    	43000,
    	46000,
    	49100,
    	52300,
    	55600,
    	59000,
    	62500,
    	66100,
    	69800,
    	73600,
    	77500,
    	81500,
    	85600,
    	89800,
    	94100,
    	98500,
    	103000,
    	107600,
    	112300,
    	127000,
    	132100,
    	137300,
    	142600,
    	148000,
    	153500,
    	159100,
    	164800,
    	170600,
    	176500,
    	182500,
    	188600,
    	194800,
    	201100,
    	207500,
    	214000,
    	220600,
    	227300,
    	234100,
    	241000,
    	248000,
    	255100,
    	262300,
    	269600,
    	277000,
    	284500,
    	292100,
    	299800,
    	307600,
    	315500,
    	323500,
    	331600,
    	339800,
    	348100,
    	356500,
    	365000,
    	373600,
    	382300,
    	391100,
    	400000,
    	409000,
    	418100,
    	427300,
    	436600,
    	446000,
    	455500,
    	465100,
    	474800,
    	484600,
    	494500,
    ];
    this.exp = 0;
    this.accountusername = this.pID;
    this.accountpassword = "";


    // Scramble the coordinate system for anti-raga
    this.scrambleX = 0;
    this.scrambleY = 0;
    this.scrambleId = 0;
    this.connectedTime = 0;
    this.isMinion = false;
    this.spawnCounter = 0;
    this.isMuted = false;
    
    // GameMode
    this.canShootPopsplitVirus = false;
    this.canShootVirus = false;
    this.doublespeed = false;
    this.timeuntilsplit = 0;
    this.antiteamstate = false;
    this.wcount = 0;
    this.viruspopcount = 0;
    this.lastwtick = 0;
    this.lastviruspoptick = 0;
    this.timeuntilsplit = 0;

    // Custom commands
    this.spawnmass = 0;
    this.frozen = false;
    this.customspeed = 0;
    this.rec = false;
    this.disableSpawn = false;
    this.perfectpopsplit = false;
    this.beingpopsplited = false;
    
    // Minions
    this.miQ = 0;
    this.isMi = false;
    this.minionSplit = false;
    this.minionEject = false;
    this.minionFrozen = false;
    this.minionControl = false;
    this.collectPellets = false;
    
    this.userRole = UserRoleEnum.GUEST;
}

module.exports = PlayerTracker;

// Setters/Getters

PlayerTracker.prototype.scramble = function () {
    if (!this.gameServer.config.serverScrambleLevel) {
        this.scrambleId = 0;
        this.scrambleX = 0;
        this.scrambleY = 0;
    } else {
        this.scrambleId = (Math.random() * 0xFFFFFFFF) >>> 0;
        // avoid mouse packet limitations
        var maxx = Math.max(0, 32767 - 1000 - this.gameServer.border.width);
        var maxy = Math.max(0, 32767 - 1000 - this.gameServer.border.height);
        var x = maxx * Math.random();
        var y = maxy * Math.random();
        if (Math.random() >= 0.5) x = -x;
        if (Math.random() >= 0.5) y = -y;
        this.scrambleX = x;
        this.scrambleY = y;
    }
    this.borderCounter = 0;
};
PlayerTracker.prototype.onLevel = function () {
	var fs = require('fs');
	var newuser = {
		username: this.accountusername,
		password: this.accountpassword,
		role: this.userRole,
		name: this.userAuth,
		level: this.level,
        exp: this.exp
	}
    for (var i in this.gameServer.userList) {
        var user = this.gameServer.userList[i];

        if (user.username == this.accountusername && user.password == this.accountpassword) {
    		this.gameServer.userList[i] = newuser;
    		json = JSON.stringify(this.gameServer.userList);
    		var file = '../src/enum/UserRoles.json';
    		fs.writeFileSync(file, json, 'utf-8');
    		this.gameServer.loadUserList();
        }
    }
    this.spawnmass = (this.gameServer.config.playerStartSize + (2 * (Math.sqrt(this.level * 100))) < 500) ? this.gameServer.config.playerStartSize + (2 * (Math.sqrt(this.level * 100))) : 500; // 2500 Spawnmass is wayy too much
};

PlayerTracker.prototype.getFriendlyName = function () {
    if (!this._name) this._name = "";
    this._name = this._name.trim();
    if (!this._name.length) 
        this._name = "An unnamed cell";
    return this._name;
};

PlayerTracker.prototype.setName = function (name) {
    this._name = name;
    if (!name || !name.length) {
        this._nameUnicode = null;
        this._nameUtf8 = null;
        return;
    }
    var writer = new BinaryWriter();
    writer.writeStringZeroUnicode(name);
    this._nameUnicode = writer.toBuffer();
    writer = new BinaryWriter();
    writer.writeStringZeroUtf8(name);
    this._nameUtf8 = writer.toBuffer();
};

PlayerTracker.prototype.setSkin = function (skin) {
    this._skin = skin;
    if (!skin || !skin.length) {
        this._skinUtf8 = null;
        return;
    }
    var writer = new BinaryWriter();
    writer.writeStringZeroUtf8(skin);
    this._skinUtf8 = writer.toBuffer();
    var writer1 = new BinaryWriter();
    writer1.writeStringZeroUtf8("%" + skin);
    this._skinUtf8protocol11 = writer1.toBuffer();
};

PlayerTracker.prototype.setColor = function (color) {
    this.color.r = color.r;
    this.color.g = color.g;
    this.color.b = color.b;
};

PlayerTracker.prototype.getScore = function () {
    if (this.isMassChanged) this.updateMass();
    return this._score;
};

PlayerTracker.prototype.getScale = function () {
    if (this.isMassChanged) this.updateMass();
    return this._scale;
};
PlayerTracker.prototype.updateMass = function () {
    var totalSize = 0;
    var totalScore = 0;
    for (var i = 0; i < this.cells.length; i++) {
        var node = this.cells[i];
        totalSize += node._size;
        totalScore += node._sizeSquared;
    }
    if (!totalSize) {
        //do not change scale for spectators or not in game players
        this._score = 0;
    } else {
        this._score = totalScore;
        this._scale = Math.pow(Math.min(64 / totalSize, 1), 0.4);
    }
    this.isMassChanged = false;
};

PlayerTracker.prototype.joinGame = function (name, skin) {
    if (this.cells.length) return;
    if (name == null) name = "";
    else {
        // 4 = Admin 2 = Mod
        if (this.userRole == UserRoleEnum.ADMIN) name = name + "ᴬᴰᴹᴵᴺ";
        else if (this.userRole == UserRoleEnum.MODER) name = name + "ᴹᴼᴰᴱᴿ";
    // Perform check to see if someone that isn't admin has a check
    if (this.userRole != UserRoleEnum.ADMIN && this.userRole != UserRoleEnum.MODER) {
                for (var i in name) {
                name = name.replace('ᴬᴰᴹᴵᴺ', '');
                name = name.replace('ᴹᴼᴰᴱᴿ', '');
            }
        }
    }
    this.setName(name);
    if (skin != null)
        this.setSkin(skin);
    this.spectate = false;
    this.freeRoam = false;
    this.spectateTarget = null;
    
    // some old clients don't understand ClearAll message
    // so we will send update for them
    if (this.socket.packetHandler.protocol < 6) {
        this.socket.sendPacket(new Packet.UpdateNodes(this, [], [], [], this.clientNodes));
    }
    this.socket.sendPacket(new Packet.ClearAll());
    this.clientNodes = [];
    this.scramble();
    if (this.gameServer.config.serverScrambleLevel < 2) {
        // no scramble / lightweight scramble
        this.socket.sendPacket(new Packet.SetBorder(this, this.gameServer.border));
    }
    else if (this.gameServer.config.serverScrambleLevel == 3) {
        var ran = 0x10000 + 10000000 * Math.random();
        // Scramble level 3 (no border)
        // Ruins most known minimaps
        var border = {
            minx: this.gameServer.border.minx - (ran),
            miny: this.gameServer.border.miny - (ran),
            maxx: this.gameServer.border.maxx + (ran),
            maxy: this.gameServer.border.maxy + (ran)
        };
        this.socket.sendPacket(new Packet.SetBorder(this, border));
    }
    this.spawnCounter++;
    this.timeuntilsplit = 0;
    this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
};

PlayerTracker.prototype.checkConnection = function () {
    // Handle disconnection
    if (!this.socket.isConnected) {
        // wait for playerDisconnectTime
        var dt = (this.gameServer.stepDateTime - this.socket.closeTime) / 1000;
        if (!this.cells.length || dt >= this.gameServer.config.playerDisconnectTime) {
            // Remove all client cells
            var cells = this.cells;
            this.cells = [];
            for (var i = 0; i < cells.length; i++) {
                this.gameServer.removeNode(cells[i]);
            }
            // Mark to remove
            this.isRemoved = true;
            return;
        }
        this.mouse.x = this.centerPos.x;
        this.mouse.y = this.centerPos.y;
        this.socket.packetHandler.pressSpace = false;
        this.socket.packetHandler.pressQ = false;
        this.socket.packetHandler.pressW = false;
        return;
    }
    // Check timeout
    if (!this.isCloseRequested && this.gameServer.config.serverTimeout) {
        dt = (this.gameServer.stepDateTime - this.socket.lastAliveTime) / 1000;
        if (dt >= this.gameServer.config.serverTimeout) {
            this.socket.close(1000, "Connection timeout");
            this.isCloseRequested = true;
        }
    }
};

PlayerTracker.prototype.updateTick = function () {
    if (this.isRemoved) return;
    this.socket.packetHandler.process();
    if (this.gameServer.clients.length > 800 && this.isMi) return;
    if (this.spectate) {
        if (this.freeRoam || this.getSpectateTarget() == null) {
            // free roam
            this.updateCenterFreeRoam();
            this._scale = this.gameServer.config.serverSpectatorScale; // 0.25;
        } else {
            // spectate target
            return;
        }
    } else {
        // in game
        this.updateCenterInGame();
    }
    // update viewbox
    var scale = this.getScale();
    scale = Math.max(scale, this.gameServer.config.serverMinScale);
    this._scaleF += 0.1 * (scale - this._scaleF);
    if (isNaN(this._scaleF)) this._scaleF = 1;
    var width = (this.gameServer.config.serverViewBaseX + 100) / this._scaleF;
    var height = (this.gameServer.config.serverViewBaseY + 100) / this._scaleF;
    var halfWidth = width / 2;
    var halfHeight = height / 2;
    this.viewBox = {
        minx: this.centerPos.x - halfWidth,
        miny: this.centerPos.y - halfHeight,
        maxx: this.centerPos.x + halfWidth,
        maxy: this.centerPos.y + halfHeight,
        width: width,
        height: height,
        halfWidth: halfWidth,
        halfHeight: halfHeight
    };
    // update visible nodes
    this.viewNodes = [];
    if (!this.isMinion || !this.isMi) {
        var self = this;
        this.gameServer.quadTree.find(this.viewBox, function (quadItem) {
            if (quadItem.cell.owner != self)
                self.viewNodes.push(quadItem.cell);
        });
    }
    this.viewNodes = this.viewNodes.concat(this.cells);
    this.viewNodes.sort(function (a, b) { return a.nodeId - b.nodeId; });
};

PlayerTracker.prototype.sendUpdate = function () {
    if (this.isRemoved || !this.socket.packetHandler.protocol ||
        !this.socket.isConnected || this.isMi ||
        (this.socket._socket.writable != null && !this.socket._socket.writable) || 
        this.socket.readyState != this.socket.OPEN) {
        // do not send update for disconnected clients
        // also do not send if initialization is not complete yet
        return;
    }
    
    if (this.spectate) {
        if (!this.freeRoam) {
            // spectate target
            var player = this.getSpectateTarget();
            if (player != null) {
                this.setCenterPos(player.centerPos.x, player.centerPos.y);
                this._scale = player.getScale();
                this.viewBox = player.viewBox;
                this.viewNodes = player.viewNodes;
            }
        }
        // sends camera packet
        this.socket.sendPacket(new Packet.UpdatePosition(
            this, this.centerPos.x, this.centerPos.y, this.getScale()
        ));
    }
    
    if (this.gameServer.config.serverScrambleLevel == 2) {
        // scramble (moving border)
        if (!this.borderCounter) {
            var b = this.gameServer.border, v = this.viewBox;
            var bound = {
                minx: Math.max(b.minx, v.minx - v.halfWidth),
                miny: Math.max(b.miny, v.miny - v.halfHeight),
                maxx: Math.min(b.maxx, v.maxx + v.halfWidth),
                maxy: Math.min(b.maxy, v.maxy + v.halfHeight)
            };
            this.socket.sendPacket(new Packet.SetBorder(this, bound));
        }
        this.borderCounter++;
        if (this.borderCounter >= 20)
            this.borderCounter = 0;
    }
    
    var delNodes = [];
    var eatNodes = [];
    var addNodes = [];
    var updNodes = [];
    var oldIndex = 0;
    var newIndex = 0;
    for (; newIndex < this.viewNodes.length && oldIndex < this.clientNodes.length;) {
        if (this.viewNodes[newIndex].nodeId < this.clientNodes[oldIndex].nodeId) {
            addNodes.push(this.viewNodes[newIndex]);
            newIndex++;
            continue;
        }
        if (this.viewNodes[newIndex].nodeId > this.clientNodes[oldIndex].nodeId) {
            var node = this.clientNodes[oldIndex];
            if (node.isRemoved && node.killedBy != null && node.owner != node.killedBy.owner)
                eatNodes.push(node);
            else
                delNodes.push(node);
            oldIndex++;
            continue;
        }
        node = this.viewNodes[newIndex];
        // skip food & eject if not moving
        if (node.isMoving || (node.cellType != 1 && node.cellType != 3))
            updNodes.push(node);
        newIndex++;
        oldIndex++;
    }
    for (; newIndex < this.viewNodes.length; ) {
        addNodes.push(this.viewNodes[newIndex]);
        newIndex++;
    }
    for (; oldIndex < this.clientNodes.length; ) {
        node = this.clientNodes[oldIndex];
        if (node.isRemoved && node.killedBy != null && node.owner != node.killedBy.owner)
            eatNodes.push(node);
        else
            delNodes.push(node);
        oldIndex++;
    }
    this.clientNodes = this.viewNodes;
    
    // Send packet
    if (this.socket.isConnected != null) {
        this.socket.sendPacket(new Packet.UpdateNodes(
            this, addNodes, updNodes, eatNodes, delNodes
        ));
        // Send Leaderboard Packet
        this.sendLeaderboard();
    }
};
PlayerTracker.prototype.sendLeaderboard = function() {
    // Update leaderboard if changed
    if (this.gameServer.leaderboardChanged) {
        var lbType = this.gameServer.leaderboardType,
            lbList = this.gameServer.leaderboard;

        if (lbType >= 0) {
            if (this.socket.packetHandler.protocol >= 11 && this.gameServer.gameMode.specByLeaderboard)
                this.socket.sendPacket(new Packet.LeaderboardPosition(this, lbList.indexOf(this) + 1));
            this.socket.sendPacket(new Packet.UpdateLeaderboard(this, lbList, lbType, lbList.indexOf(this) + 1));
        }
    }
};
PlayerTracker.prototype.updateCenterInGame = function () { // Get center of cells
    if (!this.cells.length) return;
    var cx = 0;
    var cy = 0;
    var count = 0;
    for (var i = 0; i < this.cells.length; i++) {
        var node = this.cells[i];
        cx += node.position.x;
        cy += node.position.y;
        count++;
    }
    if (!count) return;
    this.centerPos.x = cx / count;
    this.centerPos.y = cy / count;
};

PlayerTracker.prototype.updateCenterFreeRoam = function () {
    var dx = this.mouse.x - this.centerPos.x;
    var dy = this.mouse.y - this.centerPos.y;
    var squared = dx * dx + dy * dy;
    if (squared < 1) return; // stop threshold
    // distance
    var d = Math.sqrt(squared);
    var nx = dx / d;
    var ny = dy / d;
    // speed of viewbox
    var speed = Math.min(d, 32);
    if (!speed) return;
    
    var x = this.centerPos.x + nx * speed;
    var y = this.centerPos.y + ny * speed;
    this.setCenterPos(x, y);
};

PlayerTracker.prototype.pressSpace = function () {
    if (this.spectate) {
        // Check for spam first (to prevent too many add/del updates)
        var tick = this.gameServer.tickCounter;
        if (tick - this.lastSpectateSwitchTick < 40)
            return;
        this.lastSpectateSwitchTick = tick;
        
        // Space doesn't work for freeRoam mode
        if (this.freeRoam || this.gameServer.largestClient == null)
            return;
    } else if (this.gameServer.run) {
        // Disable mergeOverride on the last merging cell
        if (this.cells.length <= 2) {
            this.mergeOverride = false;
        }
        if (this.mergeOverride || this.frozen) 
            return;
        this.gameServer.splitCells(this);
    }
};

PlayerTracker.prototype.pressW = function () {
    if (this.spectate) {
        return;
    }
    else if (this.gameServer.run) {
        this.gameServer.ejectMass(this);
    }
};

PlayerTracker.prototype.pressQ = function () {
    if (this.spectate) {
        // Check for spam first (to prevent too many add/del updates)
        var tick = this.gameServer.tickCounter;
        if (tick - this.lastSpectateSwitchTick < 40)
            return;
        this.lastSpectateSwitchTick = tick;
        
        if (this.spectateTarget == null) {
            this.freeRoam = !this.freeRoam;
        }
        this.spectateTarget = null;
    }

};

PlayerTracker.prototype.getSpectateTarget = function () {
    if (this.spectateTarget == null || this.spectateTarget.isRemoved || this.spectateTarget.cells.length < 1) {
        this.spectateTarget = null;
        return this.gameServer.largestClient;
    }
    return this.spectateTarget;
};

PlayerTracker.prototype.setCenterPos = function (x, y) {
    x = Math.max(x, this.gameServer.border.minx);
    y = Math.max(y, this.gameServer.border.miny);
    x = Math.min(x, this.gameServer.border.maxx);
    y = Math.min(y, this.gameServer.border.maxy);
    this.centerPos.x = x;
    this.centerPos.y = y;
};
