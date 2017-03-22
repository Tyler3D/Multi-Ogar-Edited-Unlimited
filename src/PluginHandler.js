var Commands = require('./modules/CommandList');
var PlayerCommand = require('./modules/PlayerCommand');
var fs = require('fs');

function PluginHandler (gameServer) {
	this.gameServer = gameServer;
	this.pluginsdir = [];
	this.plugins = {};
	this.commands = {};
	this.playerCommands = {};
};

function Log (message) {
	console.log("\u001B[1m\u001B[32m[PLUGINHANDLER] " + message);
};

function getFiles (dir, files_) {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

module.exports = PluginHandler;

PluginHandler.prototype.load = function () {
	this.pluginsdir = getFiles('../src/plugins');
	this.start();
};

PluginHandler.prototype.start = function () {
	Log(this.pluginsdir.length + " Plugins loaded!");
	for (var i in this.pluginsdir) {
		if (this.pluginsdir[i] == '../src/plugins/Readme.md')
			continue;
		var plugindir = require(this.pluginsdir[i]);
		var plugin = new plugindir(this.gameServer, this, function (message, name) {
			console.log("\u001B[34m\u001B[1m[" + name + "] " + "\u001B[37m" + message);
		});
		if (!plugin.active)
			continue;
		this.plugins[plugin.name] = plugin;
		Log(plugin.name + " " + plugin.version + " By " + plugin.author + " Has been loaded!");
		plugin.start();
	}
};

PluginHandler.prototype.addCommand = function (name, funct) {
	this.commands[name] = funct;
};

PluginHandler.prototype.addPlayerCommand = function (name, funct) {
	this.playerCommands[name] = funct;
}
