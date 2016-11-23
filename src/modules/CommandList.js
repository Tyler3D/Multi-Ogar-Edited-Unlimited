// Imports
var GameMode = require('../gamemodes');
var Logger = require('./Logger');

function Commands() {
    this.list = {}; // Empty
}

module.exports = Commands;

// Utils
var fillChar = function (data, char, fieldLength, rTL) {
    var result = data.toString();
    if (rTL === true) {
        for (var i = result.length; i < fieldLength; i++)
            result = char.concat(result);
    } else {
        for (var i = result.length; i < fieldLength; i++)
            result = result.concat(char);
    }
    return result;
};

// Commands
Commands.list = {
    help: function (gameServer, split) {
        console.log("======================== HELP ======================");
        console.log("addbot [number]              : adds bots to the server");
        console.log("kickbot [number]             : kick a number of bots");
        console.log("ban [PlayerID | IP]          : bans a(n) (player's) IP");
        console.log("banlist                      : get list of banned IPs.");
        console.log("board [string] [string] ...  : set scoreboard text");
        console.log("change [setting] [value]     : change specified settings");
        console.log("clear                        : clear console output");
        console.log("color [PlayerID] [R] [G] [B] : set cell(s) color by client ID");
        console.log("exit                         : stop the server");
        console.log("kick [PlayerID]              : kick player or bot by client ID");
        console.log("kickall                      : kick all players and bots");
        console.log("mute [PlayerID]              : mute player (block chat messages from him)");
        console.log("unmute [PlayerID]            : unmute player (allow chat messages from him)");
        console.log("kill [PlayerID]              : kill cell(s) by client ID");
        console.log("killall                      : kill everyone");
        console.log("mass [PlayerID] [mass]       : set cell(s) mass by client ID");
        console.log("merge [PlayerID]             : merge all client's cells once");
        console.log("name [PlayerID] [name]       : change cell(s) name by client ID");
        console.log("playerlist                   : get list of players and bots");
        console.log("pause                        : pause game , freeze all cells");
        console.log("reload                       : reload config");
        console.log("status                       : get server status");
        console.log("unban [IP]                   : unban an IP");
        console.log("minion [PlayerID] [#] [name] : adds suicide minions to the server");
        console.log("spawnmass [PlayerID] [mass]  : sets players spawn mass");
        console.log("freeze [PlayerID]            : freezes a player");
        console.log("speed [PlayerID]             : sets a players base speed");
        console.log("rec [PlayerID]               : puts a player in rec mode");
        console.log("st                           : alias for status");
        console.log("pl                           : alias for playerlist");
        console.log("m                            : alias for mass");
        console.log("sm                           : alias for spawnmass");
        console.log("ka                           : alias for killall");
        console.log("k                            : alias for kill");
        console.log("mg                           : alias for merge");
        console.log("s                            : alias for speed");
        console.log("====================================================");
    },
    debug: function (gameServer, split) {
        // Used for checking node lengths (for now)
        
        // Count client cells
        var clientCells = 0;
        for (var i in gameServer.clients) {
            clientCells += gameServer.clients[i].playerTracker.cells.length;
        }
        // Output node information
        console.log("Clients:        " + fillChar(gameServer.clients.length, " ", 4, true) + " / " + gameServer.config.serverMaxConnections + " + bots");
        console.log("Total nodes:" + fillChar(gameServer.nodes.length, " ", 8, true));
        console.log("- Client cells: " + fillChar(clientCells, " ", 4, true) + " / " + (gameServer.clients.length * gameServer.config.playerMaxCells));
        console.log("- Ejected cells:" + fillChar(gameServer.nodesEjected.length, " ", 4, true));
        console.log("- Foods:        " + fillChar(gameServer.currentFood, " ", 4, true) + " / " + gameServer.config.foodMaxAmount);
        console.log("- Viruses:      " + fillChar(gameServer.nodesVirus.length, " ", 4, true) + " / " + gameServer.config.virusMaxAmount);
        console.log("Moving nodes:   " + fillChar(gameServer.movingNodes.length, " ", 4, true));
        console.log("Quad nodes:     " + fillChar(gameServer.quadTree.scanNodeCount(), " ", 4, true));
        console.log("Quad items:     " + fillChar(gameServer.quadTree.scanItemCount(), " ", 4, true));
    },
    minion: function(gameServer, split) {
        var id = parseInt(split[1]);
        var add = parseInt(split[2]);
        var name = split.slice(3, split.length).join(' ');
            
        // Error! ID is NaN
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player id!");
            return;
        }
        
        // Find ID specified and add/remove minions for them
        for (var i in gameServer.clients) {
            var client = gameServer.clients[i].playerTracker;
            
            if (client.pID == id) {
                // Remove minions
                if (client.minionControl == true && isNaN(add)) {
                    client.minionControl = false;
                    client.miQ = 0;
                    console.log("Succesfully removed minions for " + client.getFriendlyName());
                // Add minions
                } else {
                    client.minionControl = true;
                    // If no amount is specified
                    if (isNaN(add)) add = 1; 
                    // Add minions for client
                    for (var i = 0; i < add; i++) {
                        gameServer.bots.addMinion(client, name);
                    }
                    console.log("Added " + add + " minions for " + client.getFriendlyName());
                }
                break;
            }
        }
    },
    addbot: function (gameServer, split) {
        var add = parseInt(split[1]);
        if (isNaN(add)) {
            add = 1; // Adds 1 bot if user doesnt specify a number
        }
        
        for (var i = 0; i < add; i++) {
            gameServer.bots.addBot();
        }
        console.log("Added " + add + " player bots");
    },
    ban: function (gameServer, split) {
        // Error message
        var logInvalid = "Please specify a valid player ID or IP address!";
        
        if (split[1] == null) {
            // If no input is given; added to avoid error
            Logger.warn(logInvalid);
            return;
        }
        
        if (split[1].indexOf(".") >= 0) {
            // If input is an IP address
            var ip = split[1];
            var ipParts = ip.split(".");
            
            // Check for invalid decimal numbers of the IP address
            for (var i in ipParts) {
                if (i > 1 && ipParts[i] == "*") {
                    // mask for sub-net
                    continue;
                }
                // If not numerical or if it's not between 0 and 255
                // TODO: Catch string "e" as it means "10^".
                if (isNaN(ipParts[i]) || ipParts[i] < 0 || ipParts[i] >= 256) {
                    Logger.warn(logInvalid);
                    return;
                }
            }
            
            if (ipParts.length != 4) {
                // an IP without 3 decimals
                Logger.warn(logInvalid);
                return;
            }
            ban(ip);
            return;
        }
        // if input is a Player ID
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            // If not numerical
            Logger.warn(logInvalid);
            return;
        }
        ip = null;
        for (var i in gameServer.clients) {
            var client = gameServer.clients[i];
            if (client == null || !client.isConnected)
                continue;
            if (client.playerTracker.pID == id) {
                ip = client._socket.remoteAddress;
                break;
            }
        }
        if (ip) ban(ip);
        else Logger.warn("Player ID " + id + " not found!");
            
        // ban the player
        function ban (ip) {
            var ipBin = ip.split('.');
            if (ipBin.length != 4) {
                Logger.warn("Invalid IP format: " + ip);
                return;
            }
            gameServer.ipBanList.push(ip);
            if (ipBin[2] == "*" || ipBin[3] == "*") {
                Logger.print("The IP sub-net " + ip + " has been banned");
            } else {
                Logger.print("The IP " + ip + " has been banned");
            }
            gameServer.clients.forEach(function (socket) {
                // If already disconnected or the ip does not match
                if (socket == null || !socket.isConnected || !gameServer.checkIpBan(socket.remoteAddress))
                    return;
            
                // remove player cells
                socket.playerTracker.cells.forEach(function (cell) {
                    gameServer.removeNode(cell);
                }, gameServer);
            
                // disconnect
                socket.close(1000, "Banned from server");
                var name = socket.playerTracker.getFriendlyName();
                Logger.print("Banned: \"" + name + "\" with Player ID " + socket.playerTracker.pID);
                gameServer.sendChatMessage(null, null, "Banned \"" + name + "\""); // notify to don't confuse with server bug
            }, gameServer);
            gameServer.saveIpBanList();
        }
    },
    banlist: function (gameServer, split) {
        Logger.print("Showing " + gameServer.ipBanList.length + " banned IPs: ");
        Logger.print(" IP              | IP ");
        Logger.print("-----------------------------------");
        for (var i = 0; i < gameServer.ipBanList.length; i += 2) {
            Logger.print(" " + fillChar(gameServer.ipBanList[i], " ", 15) + " | " 
                    + (gameServer.ipBanList.length === i + 1 ? "" : gameServer.ipBanList[i + 1])
            );
        }
    },
    kickbot: function (gameServer, split) {
        var toRemove = parseInt(split[1]);
        if (isNaN(toRemove)) {
            toRemove = -1; // Kick all bots if user doesnt specify a number
        }
        if (toRemove < 1) {
            Logger.warn("Invalid argument!");
            return;
        }
        var removed = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            var socket = gameServer.clients[i];
            if (socket.isConnected != null) continue;
            socket.close();
            removed++;
            if (removed >= toRemove)
                break;
        }
        if (removed == 0)
            Logger.warn("Cannot find any bots");
        else if (toRemove == removed)
            Logger.warn("Kicked " + removed + " bots");
        else
            Logger.warn("Only " + removed + " bots were kicked");
    },
    board: function (gameServer, split) {
        var newLB = [], reset = split[1];
        for (var i = 1; i < split.length; i++) {
            if (split[i]) {
                newLB[i - 1] = split[i];
            } else {
                newLB[i - 1] = " ";
            }
        }
        
        // Clears the update leaderboard function and replaces it with our own
        gameServer.gameMode.packetLB = 48;
        gameServer.gameMode.specByLeaderboard = false;
        gameServer.gameMode.updateLB = function (gameServer) {
            gameServer.leaderboard = newLB;
            gameServer.leaderboardType = 48;
        };
        console.log("Successfully changed leaderboard values");
        console.log('Do "board reset" to reset leaderboard');
        if (reset == "reset") {
            // Gets the current gamemode
            var gm = GameMode.get(gameServer.gameMode.ID);
        
            // Replace functions
            gameServer.gameMode.packetLB = gm.packetLB;
            gameServer.gameMode.updateLB = gm.updateLB;
            console.log("Successfully reset leaderboard");
        }
    },
    change: function (gameServer, split) {
        if (split.length < 3) {
            Logger.warn("Invalid command arguments");
            return;
        }
        var key = split[1];
        var value = split[2];
        
        // Check if int/float
        if (value.indexOf('.') != -1) {
            value = parseFloat(value);
        } else {
            value = parseInt(value);
        }
        
        if (value == null || isNaN(value)) {
            Logger.warn("Invalid value: " + value);
            return;
        }
        if (!gameServer.config.hasOwnProperty(key)) {
            Logger.warn("Unknown config value: " + key);
            return;
        }
        gameServer.config[key] = value;
        
        // update/validate
        gameServer.config.playerMinSize = Math.max(32, gameServer.config.playerMinSize);
        Logger.setVerbosity(gameServer.config.logVerbosity);
        Logger.setFileVerbosity(gameServer.config.logFileVerbosity);
        Logger.print("Set " + key + " = " + gameServer.config[key]);
    },
    clear: function () {
        process.stdout.write("\u001b[2J\u001b[0;0H");
    },
    color: function (gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        
        var color = {
            r: 0,
            g: 0,
            b: 0
        };
        color.r = Math.max(Math.min(parseInt(split[2]), 255), 0);
        color.g = Math.max(Math.min(parseInt(split[3]), 255), 0);
        color.b = Math.max(Math.min(parseInt(split[4]), 255), 0);
        
        // Sets color to the specified amount
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.setColor(color); // Set color
                for (var j in client.cells) {
                    client.cells[j].setColor(color);
                }
                break;
            }
        }
    },
    exit: function (gameServer, split) {
        Logger.warn("Closing server...");
        gameServer.wsServer.close();
        process.exit(1);
    },
    kick: function (gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        // kick player
        var count = 0;
        gameServer.clients.forEach(function (socket) {
            if (socket.isConnected == false)
               return;
            if (id != 0 && socket.playerTracker.pID != id)
                return;
            // remove player cells
            socket.playerTracker.cells.forEach(function (cell) {
                gameServer.removeNode(cell);
            }, gameServer);
            // disconnect
            socket.close(1000, "Kicked from server");
            var name = socket.playerTracker.getFriendlyName();
            Logger.print("Kicked \"" + name + "\"");
            gameServer.sendChatMessage(null, null, "Kicked \"" + name + "\""); // notify to don't confuse with server bug
            count++;
        }, this);
        if (count > 0) return;
        if (id == 0)
            Logger.warn("No players to kick!");
        else
            Logger.warn("Player with ID " + id + " not found!");
    },
    mute: function (gameServer, args) {
        if (!args || args.length < 2) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        var id = parseInt(args[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        var player = gameServer.getPlayerById(id);
        if (player == null) {
            Logger.warn("Player with id=" + id + " not found!");
            return;
        }
        if (player.isMuted) {
            Logger.warn("Player with id=" + id + " already muted!");
            return;
        }
        Logger.print("Player \"" + player.getFriendlyName() + "\" was muted");
        player.isMuted = true;
    },
    unmute: function (gameServer, args) {
        if (!args || args.length < 2) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        var id = parseInt(args[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        var player = gameServer.getPlayerById(id);
        if (player == null) {
            Logger.warn("Player with id=" + id + " not found!");
            return;
        }
        if (!player.isMuted) {
            Logger.warn("Player with id=" + id + " already not muted!");
            return;
        }
        Logger.print("Player \"" + player.getFriendlyName() + "\" were unmuted");
        player.isMuted = false;
    },
    kickall: function (gameServer, split) {
        var id = 0; //kick ALL players
        // kick player
        var count = 0;
        gameServer.clients.forEach(function (socket) {
            if (socket.isConnected == false)
               return;
            if (id != 0 && socket.playerTracker.pID != id)
                return;
            // remove player cells
            socket.playerTracker.cells.forEach(function (cell) {
                gameServer.removeNode(cell);
            }, gameServer);
            // disconnect
            socket.close(1000, "Kicked from server");
            var name = socket.playerTracker.getFriendlyName();
            Logger.print("Kicked \"" + name + "\"");
            gameServer.sendChatMessage(null, null, "Kicked \"" + name + "\""); // notify to don't confuse with server bug
            count++;
        }, this);
        if (count > 0) return;
        if (id == 0)
            Logger.warn("No players to kick!");
        else
            Logger.warn("Player with ID " + id + " not found!");
    },
    kill: function (gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        
        var count = 0;
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                var len = client.cells.length;
                for (var j = 0; j < len; j++) {
                    gameServer.removeNode(client.cells[0]);
                    count++;
                }
                
                console.log("Killed " + client.getFriendlyName() + " and removed " + count + " cells");
                break;
            }
        }
    },
    killall: function (gameServer, split) {
        var count = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            var playerTracker = gameServer.clients[i].playerTracker;
            while (playerTracker.cells.length > 0) {
                gameServer.removeNode(playerTracker.cells[0]);
                count++;
            }
        }
        console.log("Removed " + count + " cells");
    },
    mass: function (gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        
        var amount = Math.max(parseInt(split[2]), 9);
        if (isNaN(amount)) {
            Logger.warn("Please specify a valid number");
            return;
        }
        var size = Math.sqrt(amount * 100);
        
        // Sets mass to the specified amount
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                for (var j in client.cells) {
                    client.cells[j].setSize(size);
                }
                
                console.log("Set mass of " + client.getFriendlyName() + " to " + (size * size / 100).toFixed(3));
                break;
            }
        }
    },
    spawnmass: function (gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        
        var amount = Math.max(parseInt(split[2]), 9);
        var size = Math.sqrt(amount * 100);
        if (isNaN(amount)) {
            Logger.warn("Please specify a valid mass!");
            return;
        }

        // Sets spawnmass to the specified amount
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.spawnmass = size;
                console.log("Set spawnmass of "+ client.getFriendlyName() + " to " + (size * size / 100).toFixed(3));
            }
        }
    },   
    speed: function (gameServer, split) {
        var id = parseInt(split[1]);
        var speed = parseInt(split[2]);
        if (isNaN(id)) {
            console.log("Please specify a valid player ID!");
            return;
        }
        
        if (isNaN(speed)) {
            console.log("Please specify a valid speed!");
            return;
        }

        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.customspeed = speed;
            }
        }
        console.log("Set base speed of "+ client.getFriendlyName() + " to " + speed);
    },
    merge: function (gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        var set = split[2];
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        
        // Find client with same ID as player entered
        var client;
        for (var i = 0; i < gameServer.clients.length; i++) {
            if (id == gameServer.clients[i].playerTracker.pID) {
                client = gameServer.clients[i].playerTracker;
                break;
            }
        }
        
        if (!client) {
            Logger.warn("Client is nonexistent!");
            return;
        }
        
        if (client.cells.length == 1) {
            Logger.warn("Client already has one cell!");
            return;
        }
        
        // Set client's merge override
        var state;
        if (set == "true") {
            client.mergeOverride = true;
            client.mergeOverrideDuration = 100;
            state = true;
        } else if (set == "false") {
            client.mergeOverride = false;
            client.mergeOverrideDuration = 0;
            state = false;
        } else {
            if (client.mergeOverride) {
                client.mergeOverride = false;
                client.mergeOverrideDuration = 0;
            } else {
                client.mergeOverride = true;
                client.mergeOverrideDuration = 100;
            }
            
            state = client.mergeOverride;
        }
        
        // Log
        if (state) console.log(client.getFriendlyName() + " is now force merging");
        else console.log(client.getFriendlyName() + " isn't force merging anymore");
    },
    rec: function (gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        
        // set rec for client
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.rec = !client.rec;
                if (client.rec) console.log(client.getFriendlyName() + " is now in rec mode!");
                else console.log(client.getFriendlyName() + " is no longer in rec mode");
            }
        }
    },
    name: function (gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        
        var name = split.slice(2, split.length).join(' ');
        if (typeof name == 'undefined') {
            Logger.warn("Please type a valid name");
            return;
        }
        
        // Change name
        for (var i = 0; i < gameServer.clients.length; i++) {
            var client = gameServer.clients[i].playerTracker;
            
            if (client.pID == id) {
                console.log("Changing " + client.getFriendlyName() + " to " + name);
                client.setName(name);
                return;
            }
        }
        
        // Error
        Logger.warn("Player " + id + " was not found");
    },
    unban: function (gameServer, split) {
        if (split.length < 2 || split[1] == null || split[1].trim().length < 1) {
            Logger.warn("Please specify a valid IP!");
            return;
        }
        var ip = split[1].trim();
        var index = gameServer.ipBanList.indexOf(ip);
        if (index < 0) {
            Logger.warn("IP " + ip + " is not in the ban list!");
            return;
        }
        gameServer.ipBanList.splice(index, 1);
        gameServer.saveIpBanList();
        Logger.print("Unbanned IP: " + ip);
    },
    playerlist: function (gameServer, split) {
        Logger.print("Current players: " + gameServer.clients.length);
        Logger.print('Do "playerlist m" or "pl m" to list minions');
        Logger.print(" ID     | IP              | P | " + fillChar('NICK', ' ', gameServer.config.playerMaxNickLength) + " | CELLS | SCORE  | POSITION    "); // Fill space
        Logger.print(fillChar('', '-', ' ID     | IP              |   |  | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength));
        var sockets = gameServer.clients.slice(0);
        sockets.sort(function (a, b) { return a.playerTracker.pID - b.playerTracker.pID; });
        for (var i = 0; i < sockets.length; i++) {
            var socket = sockets[i];
            var client = socket.playerTracker;
            var ip = (client.isMi) ? "[MINION]" : "[BOT]";
            var type = split[1];
            
            // list minions
            if (client.isMi) {
                if (typeof type == "undefined" || type == "" || type != "m") {
                    continue;
                } else if (type == "m") {
                    ip = "[MINION]";
                }
            }
            
            // ID with 3 digits length
            var id = fillChar((client.pID), ' ', 6, true);
            
            // Get ip (15 digits length)
            if (socket.isConnected != null) {
                ip = socket.remoteAddress;
            }
            ip = fillChar(ip, ' ', 15);
            var protocol = gameServer.clients[i].packetHandler.protocol;
            if (protocol == null)
                protocol = "?";
            // Get name and data
            var nick = '',
                cells = '',
                score = '',
                position = '',
                data = '';
            if (socket.closeReason != null) {
                // Disconnected
                var reason = "[DISCONNECTED] ";
                if (socket.closeReason.code)
                    reason += "[" + socket.closeReason.code + "] ";
                if (socket.closeReason.message)
                    reason += socket.closeReason.message;
                Logger.print(" " + id + " | " + ip + " | " + protocol + " | " + reason);
            } else if (!socket.packetHandler.protocol && socket.isConnected) {
                Logger.print(" " + id + " | " + ip + " | " + protocol + " | " + "[CONNECTING]");
            } else if (client.spectate) {
                nick = "in free-roam";
                if (!client.freeRoam) {
                    var target = client.getSpectateTarget();
                    if (target != null) {
                        nick = target.getFriendlyName();
                    }
                }
                data = fillChar("SPECTATING: " + nick, '-', ' | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength, true);
                Logger.print(" " + id + " | " + ip + " | " + protocol + " | " + data);
            } else if (client.cells.length > 0) {
                nick = fillChar(client.getFriendlyName(), ' ', gameServer.config.playerMaxNickLength);
                cells = fillChar(client.cells.length, ' ', 5, true);
                score = fillChar((client.getScore() / 100) >> 0, ' ', 6, true);
                position = fillChar(client.centerPos.x >> 0, ' ', 5, true) + ', ' + fillChar(client.centerPos.y >> 0, ' ', 5, true);
                Logger.print(" " + id + " | " + ip + " | " + protocol + " | " + nick + " | " + cells + " | " + score + " | " + position);
            } else {
                // No cells = dead player or in-menu
                data = fillChar('DEAD OR NOT PLAYING', '-', ' | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength, true);
                Logger.print(" " + id + " | " + ip + " | " + protocol + " | " + data);
            }
        }
    },
    pause: function (gameServer, split) {
        gameServer.run = !gameServer.run; // Switches the pause state
        var s = gameServer.run ? "Unpaused" : "Paused";
        console.log(s + " the game.");
    },
    freeze: function (gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            console.log("Please specify a valid player ID!");
            return;
        }

        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.frozen = !client.frozen;
                if (client.frozen) {
                    console.log("Froze " + client.getFriendlyName());
                } else {
                    console.log("Unfroze " + client.getFriendlyName());
                }
                break;
            }
        }
    },
    reload: function (gameServer) {
        gameServer.loadConfig();
        gameServer.loadIpBanList();
        console.log("Reloaded the config file succesully");
    },
    status: function (gameServer, split) {
        var ini = require('./ini.js');
        // Get amount of humans/bots
        var humans = 0,
            bots = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            if ('_socket' in gameServer.clients[i]) {
                humans++;
            } else {
                bots++;
            }
        }
        
        console.log("Connected players: " + gameServer.clients.length + "/" + gameServer.config.serverMaxConnections);
        console.log("Players: " + humans + " - Bots: " + bots);
        console.log("Server has been running for " + Math.floor(process.uptime() / 60) + " minutes");
        console.log("Current memory usage: " + Math.round(process.memoryUsage().heapUsed / 1048576 * 10) / 10 + "/" + Math.round(process.memoryUsage().heapTotal / 1048576 * 10) / 10 + " mb");
        console.log("Current game mode: " + gameServer.gameMode.name);
        console.log("Current update time: " + gameServer.updateTimeAvg.toFixed(3) + " [ms]  (" + ini.getLagMessage(gameServer.updateTimeAvg) + ")");
    },
    
    //Aliases
    st: function (gameServer, split) { // Status
        Commands.list.status(gameServer, split);
    },
    pl: function (gameServer, split) { // Playerlist
        Commands.list.playerlist(gameServer, split);
    },
    m: function (gameServer, split) { // Mass
        Commands.list.mass(gameServer, split);
    },
    sm: function (gameServer, split) { // Spawnmass
        Commands.list.spawnmass(gameServer, split);
    },
    ka: function (gameServer, split) { // Killall
        Commands.list.killall(gameServer, split);
    },
    k: function (gameServer, split) { // Kill
        Commands.list.kill(gameServer, split);
    },
    mg: function (gameServer, split) { // Merge
        Commands.list.merge(gameServer, split);
    },
    s: function (gameServer, split) { // Speed
        Commands.list.speed(gameServer, split);
    }
};
