var Logger = require('./Logger');
var UserRoleEnum = require("../enum/UserRoleEnum");

var ErrorTextInvalidCommand = "ERROR: Unknown command, type /help for command list";
var ErrorTextBadCommand = "ERROR: Bad command!";


function PlayerCommand(gameServer, playerTracker) {
    this.gameServer = gameServer;
    this.playerTracker = playerTracker;
}

module.exports = PlayerCommand;

PlayerCommand.prototype.writeLine = function (text) {
    this.gameServer.sendChatMessage(null, this.playerTracker, text);
};

PlayerCommand.prototype.executeCommandLine = function (commandLine) {
    if (!commandLine) return;
    var command = commandLine;
    var args = "";
    var index = commandLine.indexOf(' ');
    if (index >= 0) {
        command = commandLine.slice(0, index);
        args = commandLine.slice(index + 1, commandLine.length);
    }
    command = command.trim().toLowerCase();
    if (command.length > 16) {
        this.writeLine(ErrorTextInvalidCommand);
        return;
    }
    for (var i = 0; i < command.length; i++) {
        var c = command.charCodeAt(i);
        if (c < 0x21 || c > 0x7F) {
            this.writeLine(ErrorTextInvalidCommand);
            return;
        }
    }
    if (!playerCommands.hasOwnProperty(command)) {
        this.writeLine(ErrorTextInvalidCommand);
        return;
    }
    var execute = playerCommands[command];
    if (typeof execute == 'function') {
        execute.bind(this)(args);
    } else {
        this.writeLine(ErrorTextBadCommand);
    }
};

PlayerCommand.prototype.userLogin = function (ip, password) {
    if (!password) return null;
    password = password.trim();
    if (!password) return null;
    for (var i = 0; i < this.gameServer.userList.length; i++) {
        var user = this.gameServer.userList[i];
        if (user.password != password)
            continue;
        if (user.ip && user.ip != ip)
            continue;
        return user;
    }
    return null;
};

var playerCommands = {
    id: function (args) {
        this.writeLine("ID: " + this.playerTracker.pID);
    },
    help: function (args) {
        if (this.playerTracker.userRole == UserRoleEnum.ADMIN || this.playerTracker.userRole == UserRoleEnum.MODER) {
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        this.writeLine("/skin %shark - change skin");
        this.writeLine("/kill - self kill");
        this.writeLine("/help - this command list");
        this.writeLine("/mass - gives mass to yourself - Must be ADMIN or MODER");
        this.writeLine("/spawnmass - gives yourself spawnmass - Must be ADMIN");
        this.writeLine("/minion - gives yourself minions - Must be ADMIN or MODER");
        this.writeLine("/minion remove - removes all of your minions - Must be ADMIN or MODER");
        this.writeLine("/addbot - Adds Bots to the server - Must be ADMIN");
        this.writeLine("/shutdown - SHUTDOWNS THE SERVER - MUST BE ADMIN");
        this.writeLine("/restart - RESTARTS THE SERVER - MUST BE ADMIN");
        this.writeLine("/status - Shows Status of the Server - Must be ADMIN or Moder");
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    } else {
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        this.writeLine("/skin %shark - change skin");
        this.writeLine("/kill - self kill");
        this.writeLine("/help - this command list");
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    }
    },
    skin: function (args) {
        if (this.playerTracker.cells.length > 0) {
            this.writeLine("ERROR: Cannot change skin while player in game!");
            return;
        }
        var skinName = "";
        if (args) skinName = args.trim();
        this.playerTracker.setSkin(skinName);
        if (skinName == "")
            this.writeLine("Your skin was removed");
        else
            this.writeLine("Your skin set to " + skinName);
    },
    kill: function (args) {
        if (this.playerTracker.cells.length < 1) {
            this.writeLine("You cannot kill yourself, because you're still not joined to the game!");
            return;
        }
        while (this.playerTracker.cells.length > 0) {
            var cell = this.playerTracker.cells[0];
            this.gameServer.removeNode(cell);
            // replace with food
            var food = require('../entity/Food');
            food = new food(this.gameServer, null, cell.position, cell._size);
            food.setColor(cell.color);
            this.gameServer.addNode(food);
        }
        this.writeLine("You killed yourself");
    },
    mass: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var mass = (args || "").trim();
        if (mass.length < 1) {
            this.writeLine("ERROR: missing mass argument!");
            return;
        }
        var size = Math.sqrt(mass * 100);
        for (var i in this.playerTracker.cells) {
        this.playerTracker.cells[i].setSize(size);
        }
        this.writeLine("Set mass of " + this.playerTracker._name + " to " + (size * size / 100).toFixed(3));

    },
    spawnmass: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var mass = (args || "").trim();
        if (mass.length < 1) {
            this.writeLine("ERROR: missing mass argument!");
            return;
        }
        var size = Math.sqrt(mass * 100);
        this.playerTracker.spawnmass = size;     
        this.writeLine("Set spawnmass of " + this.playerTracker._name + " to " + (size * size / 100).toFixed(3));
    },
    minion: function(args) {
        var add = (args || "").trim();
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
                // Remove minions
                if (this.playerTracker.minionControl === true && add == "remove") {
                    this.playerTracker.minionControl = false;
                    this.playerTracker.miQ = 0;
                    this.writeLine("Succesfully removed minions for " + this.playerTracker._name);
                // Add minions
                } else {
                    this.playerTracker.minionControl = true;
                    // Add minions for client
                    if (isNaN(add)) add = 1;

                    for (var i = 0; i < add; i++) {
                        this.gameServer.bots.addMinion(this.playerTracker);
                    }
                    this.writeLine("Added " + add + " minions for " + this.playerTracker._name);
                }
    },
    addbot: function(args) {
    var add = (args || "").trim();
    if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
        this.writeLine("ERROR: access denied!");
        return;
    }
        for (var i = 0; i < add; i++) {
            this.gameServer.bots.addBot();
        }
        Logger.warn(this.playerTracker.socket.remoteAddress + "ADDED " + add + " BOTS");
        this.writeLine("Added " + add + " Bots");
    },
    status: function(args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var ini = require('./ini.js');
        // Get amount of humans/bots
        var humans = 0,
            bots = 0;
        for (var i = 0; i < this.gameServer.clients.length; i++) {
            if ('_socket' in this.gameServer.clients[i]) {
                humans++;
            } else {
                bots++;
            }
        }
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        this.writeLine("Connected players: " + this.gameServer.clients.length + "/" + this.gameServer.config.serverMaxConnections);
        this.writeLine("Players: " + humans + " - Bots: " + bots);
        this.writeLine("Server has been running for " + Math.floor(process.uptime() / 60) + " minutes");
        this.writeLine("Current memory usage: " + Math.round(process.memoryUsage().heapUsed / 1048576 * 10) / 10 + "/" + Math.round(process.memoryUsage().heapTotal / 1048576 * 10) / 10 + " mb");
        this.writeLine("Current game mode: " + this.gameServer.gameMode.name);
        this.writeLine("Current update time: " + this.gameServer.updateTimeAvg.toFixed(3) + " [ms]  (" + ini.getLagMessage(this.gameServer.updateTimeAvg) + ")");
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    },
    login: function (args) {
        var password = (args || "").trim();
        if (password.length < 1) {
            this.writeLine("ERROR: missing password argument!");
            return;
        }
        var user = this.userLogin(this.playerTracker.socket.remoteAddress, password);
        if (!user) {
            this.writeLine("ERROR: login failed!");
            return;
        }
        Logger.write("LOGIN        " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort + " as \"" + user.name + "\"");
        this.playerTracker.userRole = user.role;
        this.playerTracker.userAuth = user.name;
        this.writeLine("Login done as \"" + user.name + "\"");
        return;
    },
    logout: function (args) {
        if (this.playerTracker.userRole == UserRoleEnum.GUEST) {
            this.writeLine("ERROR: not logged in");
            return;
        }
        Logger.write("LOGOUT       " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort + " as \"" + this.playerTracker.userAuth + "\"");
        this.playerTracker.userRole = UserRoleEnum.GUEST;
        this.playerTracker.userAuth = null;
        this.writeLine("Logout done");
    },
    shutdown: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        Logger.warn("SHUTDOWN REQUEST FROM " + this.playerTracker.socket.remoteAddress + " as " + this.playerTracker.userAuth);
        process.exit(0);
    },
    restart: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: acces denied!");
            return;
        }
        Logger.warn("RESTART REQUEST FROM " + this.playerTracker.socket.remoteAddress + " as " + this.playerTracker.userAuth);
        process.exit(3);
    }
};
