module.exports = {
    Mode: require('./Mode'),
    FFA: require('./FFA'),
    Teams: require('./Teams'),
    Experimental: require('./Experimental'),
    Rainbow: require('./Rainbow'),
    Popsplit: require('./Popsplit'),
    Rush: require('./Rush'),
    SuperPowers: require('./SuperPowers'),
    Spliting: require('./Spliting'),
    VanillaAntiTeam: require('./AntiTeamVanillaFFA'),
};

var get = function (id) {
    var mode;
    switch (id) {
        case 1: // Teams
            mode = new module.exports.Teams();
            break;
        case 2: // Experimental
            mode = new module.exports.Experimental();
            break;
        case 3: // Rainbow
            mode = new module.exports.Rainbow();
            break;
        case 4: // Popsplit
        	mode = new module.exports.Popsplit();
        	break;
        case 5: // Rush
            mode = new module.exports.Rush();
            break;
        case 6: // SuperPowers
            mode = new module.exports.SuperPowers();
            break;
        case 7: // Spliting
            mode = new module.exports.Spliting();
            break;
        case 8: // Anti - Team Vanilla
            mode = new module.exports.VanillaAntiTeam();
            break;
        default: // FFA is default
            mode = new module.exports.FFA();
            break;
    }
    return mode;
};

module.exports.get = get;
