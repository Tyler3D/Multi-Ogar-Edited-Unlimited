var Commands = require('./modules/CommandList');
var PlayerCommand = require('./modules/PlayerCommand');
var fs = require('fs');
var walk = require('walk');
var walker = walk.walk('./plugins', {followLinks: true});
var Logger = require('./modules/Logger');

function PluginHandler (gameServer) {
	this.gameServer = gameServer;
	this.files = [];
	this.plugins = [];
	this.commands = {};
}

function getFiles (dir, files_) {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

module.exports = PluginHandler;

PluginHandler.prototype.load = function () {
	this.files = getFiles('../src/plugins');
	this.start();
};

PluginHandler.prototype.start = function () {
	for (var i in this.files) {
		this.plugins.push(this.files[i]);
	}
	for (var i in this.plugins) {
		var plugindir = require(this.plugins[i]);
		var plugin = new plugindir(this.gameServer, this, Logger);
		plugin.start();
	}
};

PluginHandler.prototype.addCommand = function (name, funct) {
	this.commands[name] = funct;
};
