var Logger = require('./Logger');
var UserRoleEnum = require("../enum/UserRoleEnum");

function PlayerCommand(gameServer, playerTracker) {
    this.gameServer = gameServer;
    this.playerTracker = playerTracker;
    this.roleList = [];
}

module.exports = PlayerCommand;

PlayerCommand.prototype.writeLine = function (text) {
    this.gameServer.sendChatMessage(null, this.playerTracker, text);
};

PlayerCommand.prototype.executeCommandLine = function(commandLine) {
    if (!commandLine) return;
    
    // Splits the string
    var args = commandLine.split(" ");
    
    // Process the first string value
    var first = args[0].toLowerCase();
    
    // Get command function
    var execute = playerCommands[first];
    if (typeof execute != 'undefined') {
        execute.bind(this)(args);
    } else {
        this.writeLine("ERROR: Unknown command, type /help for command list");
    }
};


PlayerCommand.prototype.userLogin = function (username, password) {
    if (!username || !password) return null;
    for (var i = 0; i < this.gameServer.userList.length; i++) {
        var user = this.gameServer.userList[i];
        if (user.username != username)
            break;
        if (user.password != password)
            break;
        return user;
    }
    return null;
};

var playerCommands = {
    help: function (args) {
        var page = parseInt(args[1]);
        if (this.playerTracker.userRole == UserRoleEnum.ADMIN || this.playerTracker.userRole == UserRoleEnum.MODER) {
            if (isNaN(page)) {
                this.writeLine("Please Enter a Page Number!");
                return;
            }
            if (page == 1) { // 10 Fit per Page
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            this.writeLine("/skin %shark - change skin");
            this.writeLine("/kill - self kill");
            this.writeLine("/help [page #] - this command list");
            this.writeLine("/id - Gets your playerID");
            this.writeLine("/mass - gives mass to yourself or to other players");
            this.writeLine("/merge - Instantly Recombines all of your cells or other players cells");
            this.writeLine("/rec - Toggles rec mode for you or for other players - MUST BE ADMIN");
            this.writeLine("/spawnmass - gives yourself or other players spawnmass - MUST BE ADMIN");
            this.writeLine("/minion - gives yourself or other players minions");
            this.writeLine("/minion remove - removes all of your minions or other players minions");
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            this.writeLine("Showing Page 1 of 3.");
            } else if (page == 2) {
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            this.writeLine("/userrole - Allows you to give User Role to a player ID - MUST BE ADMIN");
            this.writeLine("/userrole list - Lists all the people you have given a Role - MUST BE ADMIN");
            this.writeLine("/kick - Kicks a Player ID to make them lose their Temporarily Role");
            this.writeLine("/addbot - Adds Bots to the Server - MUST BE ADMIN");
            this.writeLine("/change - Allows you to Temporarily change the config of the Server! - MUST BE ADMIN");
            this.writeLine("/reloadconfig - Reloads the config of the Server to the gameServer.ini file - MUST BE ADMIN");
            this.writeLine("/shutdown - SHUTDOWNS THE SERVER - MUST BE ADMIN");
            this.writeLine("/restart - RESTARTS THE SERVER - MUST BE ADMIN");
            this.writeLine("/status - Shows Status of the Server");
            this.writeLine("/gamemode - Allows you to change the Game Mode of the Server. - MUST BE ADMIN");
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            this.writeLine("Showing Page 2 of 3.");
            } else if (page == 3) {
                this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                this.writeLine("/popsplit - Gives you the ability to do perfect popsplits (within reason)");
                this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            }
        }
        else {
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            this.writeLine("/skin %shark - change skin");
            this.writeLine("/kill - self kill");
            this.writeLine("/help - this command list");
            this.writeLine("/id - Gets your playerID");
            this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            }
    },
    id: function (args) {
        this.writeLine("Your PlayerID is " + this.playerTracker.pID);
    },
    skin: function (args) {
        if (this.playerTracker.cells.length) {
            this.writeLine("ERROR: Cannot change skin while player in game!");
            return;
        }
        var skinName = "";
        if (args[1]) skinName = args[1];
        this.playerTracker.setSkin(skinName);
        if (skinName == "")
            this.writeLine("Your skin was removed");
        else
            this.writeLine("Your skin set to " + skinName);
    },
    kill: function (args) {
        if (!this.playerTracker.cells.length) {
            this.writeLine("You cannot kill yourself, because you're still not joined to the game!");
            return;
        }
        while (this.playerTracker.cells.length) {
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
        var mass = parseInt(args[1]);
        var id = parseInt(args[2]);
        var size = Math.sqrt(mass * 100);
        
        if (isNaN(mass)) {
            this.writeLine("ERROR: missing mass argument!");
            return;
        }
        
        if (isNaN(id)) {
            this.writeLine("Warn: missing ID arguments. This will change your mass.");
            for (var i in this.playerTracker.cells) {
                this.playerTracker.cells[i].setSize(size);
            }
            this.writeLine("Set mass of " + this.playerTracker._name + " to " + size * size / 100);
            
        } else {
            for (var i in this.gameServer.clients) {
                var client = this.gameServer.clients[i].playerTracker;
                if (client.pID == id) {
                    for (var j in client.cells) {
                        client.cells[j].setSize(size);
                    }
                    this.writeLine("Set mass of " + client._name + " to " + size * size / 100);
                    var text = this.playerTracker._name + " changed your mass to " + size * size / 100;
                    this.gameServer.sendChatMessage(null, client, text);
                    break;
                }
            }
        }

    },
    spawnmass: function (args) {        
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var mass = parseInt(args[1]);
        var id = parseInt(args[2]);
        var size = Math.sqrt(mass * 100);
        
        if (isNaN(mass)) {
            this.writeLine("ERROR: missing mass argument!");
            return;
        }
        
        if (isNaN(id)) {
            this.playerTracker.spawnmass = size; 
            this.writeLine("Warn: missing ID arguments. This will change your spawnmass.");
            this.writeLine("Set spawnmass of " + this.playerTracker._name + " to " + size * size / 100);
        } else {
            for (var i in this.gameServer.clients) {
                var client = this.gameServer.clients[i].playerTracker;
                if (client.pID == id) {
                    client.spawnmass = size;
                    this.writeLine("Set spawnmass of " + client._name + " to " + size * size / 100);
                    var text = this.playerTracker._name + " changed your spawn mass to " + size * size / 100; 
                    this.gameServer.sendChatMessage(null, client, text);
                }
            }
        }
    },
    minion: function(args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var add = args[1];
        var id = parseInt(args[2]);
        var player = this.playerTracker;
        
        /** For you **/
        if (isNaN(id)) {
            this.writeLine("Warn: missing ID arguments. This will give you minions.");
            // Remove minions
            if (player.minionControl == true && add == "remove") {
                player.minionControl = false;
                player.miQ = 0;
                this.writeLine("Succesfully removed minions for " + player._name);
            // Add minions
            } else {
                player.minionControl = true;
                // Add minions for self
                if (isNaN(parseInt(add))) add = 1;
                for (var i = 0; i < add; i++) {
                    this.gameServer.bots.addMinion(player);
                }
                this.writeLine("Added " + add + " minions for " + player._name);
            }
        
        } else {
            /** For others **/
            for (var i in this.gameServer.clients) {
                var client = this.gameServer.clients[i].playerTracker;
                if (client.pID == id) {
                    // Remove minions
                    if (client.minionControl == true) {
                        client.minionControl = false;
                        client.miQ = 0;
                        this.writeLine("Succesfully removed minions for " + client._name);
                        var text = this.playerTracker._name + " removed all off your minions.";
                        this.gameServer.sendChatMessage(null, client, text);
                    // Add minions
                    } else {
                        client.minionControl = true;
                        // Add minions for client
                        if (isNaN(add)) add = 1;
                        for (var i = 0; i < add; i++) {
                            this.gameServer.bots.addMinion(client);
                        }
                        this.writeLine("Added " + add + " minions for " + client._name);
                        var text = this.playerTracker._name + " gave you " + add + " minions.";
                        this.gameServer.sendChatMessage(null, client, text);
                    }
                }
            }
        }
    },
    userrole: function(args) {
        // Temporarily changes the User Role of a player until that player leaves the server.
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied");
            return;
        }
        var id = args[1];
        var role = args[2];
        if(isNaN(parseInt(id))) {
            this.writeLine("Please specify a valid player ID!");
        if (id == "list") {
            if (!this.roleList.length) {
                this.writeLine("You have not given anyone a Role!");
                return;
            }
            this.writeLine(" ID   |   SCORE   |   NICK");
            for (var i in this.roleList) {
                var client = this.roleList[i];
                var id = client.pID;
                var nick = client._name;
                var score = Math.round(client._score);
                this.writeLine(id + "    " + score + "    " + nick);
            }
            return;
        }
            return;
        } else {
        if (role != "moder" && role != "user" && role != "guest" || role == null) {
            this.writeLine("Please specify a valid Role!");
            return;
        }
        if (this.playerTracker.pID == id) {
            this.writeLine("You cannot change your own Role!");
            return;
        }
        for (var i in this.gameServer.clients) {
            var client = this.gameServer.clients[i].playerTracker;
            if (client.pID == id) {
                if (client.userRole == UserRoleEnum.ADMIN) {
                    this.writeLine("You cannot change Admins Roles!");
                    return;
                }
                if (role == "moder") {
                        client.userRole = UserRoleEnum.MODER;
                        this.writeLine("Successfully changed " + client._name + "'s Role to Moder");
                        this.gameServer.sendChatMessage(null, client, "You have been temporarily changed to MODER."); // notify
                        this.roleList.push(client);
                    } else if (role == "user") {
                        client.userRole = UserRoleEnum.USER;
                        this.writeLine("Successfully changed " + client._name + "'s Role to User!");
                        this.gameServer.sendChatMessage(null, client, "You have been temporarily changed to USER."); // notify
                        this.roleList.push(client);
                    } else {
                        client.userRole = UserRoleEnum.GUEST;
                        this.writeLine("Successfully changed " + client._name + "'s Role to Guest!");
                        this.gameServer.sendChatMessage(null, client, "You have been temporarily changed to GUEST."); // notify
                        this.roleList.push(client);
                    }
                }
            }
        }
    },
    kick: function(args) {
        var id = parseInt(args[1]);
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: acces denied!");
            return;
        }
        if (isNaN(id)) {
            this.writeLine("Please specify a valid player ID!");
            return;
        }
        // kick player
        var count = 0;
        this.gameServer.clients.forEach(function (socket) {
            if (socket.isConnected === false)
               return;
            if (id !== 0 && socket.playerTracker.pID != id)
                return;
            if (socket.playerTracker.userRole == UserRoleEnum.ADMIN) {
                this.writeLine("You cannot kick a ADMIN in game!");
                return;
            }
            // remove player cells
                for (var j = 0; j < socket.playerTracker.cells.length; j++) {
                    this.gameServer.removeNode(socket.playerTracker.cells[0]);
                    count++;
                }
            // disconnect
            socket.close(1000, "Kicked from server");
            var name = socket.playerTracker._name;
            this.writeLine("Successfully kicked " + name);
            count++;
        }, this);
        if (count) return;
        if (!id) this.writeLine("Warn: No players to kick!");
        else this.writeLine("Warn: Player with ID " + id + " not found!");
    },
    addbot: function(args) {
        var add = parseInt(args[1]);
        if (isNaN(add)) add = 1;
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        for (var i = 0; i < add; i++) {
            this.gameServer.bots.addBot();
        }
        Logger.warn(this.playerTracker.socket.remoteAddress + " ADDED " + add + " BOTS");
        this.writeLine("Added " + add + " Bots");
    },
    status: function(args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
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
        var ini = require('./ini.js');
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        this.writeLine("Connected players: " + this.gameServer.clients.length + "/" + this.gameServer.config.serverMaxConnections);
        this.writeLine("Players: " + humans + " - Bots: " + bots);
        this.writeLine("Server has been running for " + Math.floor(process.uptime() / 60) + " minutes");
        this.writeLine("Current memory usage: " + Math.round(process.memoryUsage().heapUsed / 1048576 * 10) / 10 + "/" + Math.round(process.memoryUsage().heapTotal / 1048576 * 10) / 10 + " mb");
        this.writeLine("Current game mode: " + this.gameServer.gameMode.name);
        this.writeLine("Current update time: " + this.gameServer.updateTimeAvg.toFixed(3) + " [ms]  (" + ini.getLagMessage(this.gameServer.updateTimeAvg) + ")");
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    },
    merge: function(args) {
        // Validation checks
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var id = parseInt(args[1]);
        if (isNaN(id)) {
            this.writeLine("Warn: Missing ID arguments. This will merge you.");
            if (this.playerTracker.cells.length == 1) {
                this.writeLine("You already have one cell!");
                return;
            }
            this.playerTracker.mergeOverride = !this.playerTracker.mergeOverride;
            if (this.playerTracker.mergeOverride) this.writeLine(this.playerTracker._name + " is now force mergeing");
            else this.writeLine(this.playerTracker._name + " isn't force merging anymore");
        } else {
        
        // Find client with same ID as player entered
        for (var i = 0; i < this.gameServer.clients.length; i++) {
            if (id == this.gameServer.clients[i].playerTracker.pID) {
                var client = this.gameServer.clients[i].playerTracker;
                    if (client.cells.length == 1) {
                        this.writeLine("Client already has one cell!");
                        return;
                    }
                    // Set client's merge override
                    client.mergeOverride = !client.mergeOverride;
                    if (client.mergeOverride) {
                        this.writeLine(client._name + " is now force merging");
                        var text = this.playerTracker._name + " Caused you to merge!";
                        this.gameServer.sendChatMessage(null, client, text); // notify
                    }
                    else {
                        this.writeLine(client._name + " isn't force merging anymore");
                        var text = this.playerTracker._name + " Stopped your mergeing"
                        this.gameServer.sendChatMessage(null, client, text); // notify
                    }
                }
            }
        }
    },
    gamemode: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var mode = parseInt(args[1]);
        if (isNaN(mode)) {
            this.writeLine("Invalid Game Mode Selected!");
            return;
        }
        if (mode > 8 || mode < 0) {
            this.writeLine("Invalid Game Mode Selected!");
            return;
        }
        var GameMode = require('../Gamemodes');
        var Command = require('./CommandList');
        var gamemode = GameMode.get(mode);
        // Reset
        this.gameServer.gameMode.packetLB = gamemode.packetLB;
        this.gameServer.gameMode.updateLB = gamemode.updateLB;
        Command.list.reset(this.gameServer, args);
        this.gameServer.loadConfig(); // Load Config In case Previous Gamemodes changed them
        this.gameServer.gameMode = gamemode;
        gamemode.onServerInit(this.gameServer);
        Command.list.reset(this.gameServer, args); // Just in Case
        this.writeLine("Successfully Changed Game Mode to: " + this.gameServer.gameMode.name);
        Logger.warn("GAMEMODE CHANGE FROM  " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort + " AS " + this.playerTracker.socket.userAuth);
        for (var i in this.gameServer.clients) {
            var client = this.gameServer.clients[i].playerTracker;
            var text = this.playerTracker._name + " Changed to Game Mode to: " + this.gameServer.gameMode.name;
            this.gameServer.sendChatMessage(null, client, text);
        }
    },
    rec: function(args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var id = parseInt(args[1]);
        if (isNaN(id)) {
            this.writeLine("Warn: Missing ID arguments. This will give you rec mode.");
            this.playerTracker.rec = !this.playerTracker.rec;
            if (this.playerTracker.rec) this.writeLine(this.playerTracker._name + " is now in rec mode!");
            else this.writeLine(this.playerTracker._name + " is no longer in rec mode");
        }
        
        // set rec for client
        for (var i in this.gameServer.clients) {
            if (this.gameServer.clients[i].playerTracker.pID == id) {
                var client = this.gameServer.clients[i].playerTracker;
                client.rec = !client.rec;
                if (client.rec) {
                    this.writeLine(client._name + " is now in rec mode!");
                    var text = this.playerTracker._name + " gave you rec mode!";
                    this.gameServer.sendChatMessage(null, client, text); // notify
                } else {
                    this.writeLine(client._name + " is no longer in rec mode");
                    var text = this.playerTracker._name + " Removed your rec mode";
                    this.gameServer.sendChatMessage(null, client, text); // notify
                }
            }
        }
    },
    popsplit: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var id = parseInt(args[1]);
        if (isNaN(id)) {
            this.writeLine("Warn: Missing ID arguments. This will give you rec mode.");
            this.playerTracker.perfectpopsplit = !this.playerTracker.perfectpopsplit;
            if (this.playerTracker.perfectpopsplit) this.writeLine(this.playerTracker._name + " is now in popsplit mode!");
            else this.writeLine(this.playerTracker._name + " is no longer in popsplit mode");
        }

        // set popsplit for client
        for (var i in this.gameServer.clients) {
            var client = this.gameServer.clients[i].playerTracker;
            if (client.pID == id) {
                
                client.popsplit = !client.popsplit;
                if (client.popsplit) {
                    this.writeLine(client._name + " is now in popsplit mode!");
                    var text = this.playerTracker._name + " gave you the ability to do perfect popsplits!";
                    this.gameServer.sendChatMessage(null, client, text); // notify
                } else {
                    this.writeLine(client._name + " is no longer in popsplit mode");
                    var text = this.playerTracker._name + " Removed your ability to do perfect popsplits!";
                    this.gameServer.sendChatMessage(null, client, text); // notify
                }
            }
        }
    },
    change: function(args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        if (args.length < 3) {
            this.writeLine("Invalid command arguments");
            return;
        }
        var key = args[1];
        var value = args[2];
        
        // Check if int/float
        if (value.indexOf('.') != -1) {
            value = parseFloat(value);
        } else {
            value = parseInt(value);
        }
        
        if (value == null || isNaN(value)) {
            this.writeLine("Invalid value: " + value);
            return;
        }
        if (!this.gameServer.config.hasOwnProperty(key)) {
            this.writeLine("Unknown config value: " + key);
            return;
        }
        this.gameServer.config[key] = value;
        
        // update/validate
        this.gameServer.config.playerMinSize = Math.max(32, this.gameServer.config.playerMinSize);
        Logger.setVerbosity(this.gameServer.config.logVerbosity);
        Logger.setFileVerbosity(this.gameServer.config.logFileVerbosity);
        this.writeLine("Set " + key + " = " + this.gameServer.config[key]);
        Logger.warn("CONFIGURATION CHANGE REQUEST FROM " + this.playerTracker.socket.remoteAddress + " as " + this.playerTracker.userAuth);
        Logger.info(key + " WAS CHANGED TO " + value);
    },
    reloadconfig: function(args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        this.gameServer.loadConfig();
        this.gameServer.loadIpBanList();
        Logger.warn("CONFIGURATION RELOAD REQUEST FROM " + this.playerTracker.socket.remoteAddress + " as " + this.playerTracker.userAuth);
        this.writeLine("Configuration was Successfully Reloaded!");
    },
    login: function (args) {
        try {
        var username = args[1].trim();
    } catch (error) {
        this.writeLine("ERROR: you have to type in a username!");
        return;
    }
    try {
        var password = args[2].trim();
        } catch (error) {
            this.writeLine("ERROR: You have to type in a password!");
            return;
        }
        var user = this.userLogin(username, password);
        if (!user) {
            this.writeLine("ERROR: login failed!");
            return;
        }
        Logger.info(username + " Logined in as " + user.name + " from " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort);
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
        var username = this.playerTracker.username;
        Logger.info(username + " Logged out from " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort);
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
