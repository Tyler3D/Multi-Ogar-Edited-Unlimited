function Cell(gameServer, owner, position, size) {
    this.gameServer = gameServer;
    this.owner = owner;     // playerTracker that owns this cell
    
    this.tickOfBirth = 0;
    this.color = { r: 0, g: 0, b: 0 };
    this.position = { x: 0, y: 0 };
    this._sizeSquared = 0;
    this._size = 0;
    this._mass = 0;
    this._speed = null;
    this.cellType = -1;     // 0 = Player Cell, 1 = Food, 2 = Virus, 3 = Ejected Mass
    this.isSpiked = false;  // If true, then this cell has spikes around it
    this.isAgitated = false;// If true, then this cell has waves on it's outline
    this.killedBy = null;   // Cell that ate this cell
    this.isMoving = false;  // Indicate that cell is in boosted mode
    
    this.boostDistance = 0;
    this.boostDirection = { x: 1, y: 0, angle: Math.PI / 2 };
    this.boostMaxSpeed = 78;// boost speed limit, sqrt(780*780/100)
    this.ejector = null;
    
    if (this.gameServer != null) {
        this.nodeId = this.gameServer.getNextNodeId();
        this.tickOfBirth = this.gameServer.tickCounter;
        if (size != null) {
            this.setSize(size);
        }
        if (position != null) {
            this.setPosition(position);
        }
    }
}

module.exports = Cell;

// Fields not defined by the constructor are considered private and need a getter/setter to access from a different class

Cell.prototype.setColor = function (color) {
    this.color.r = color.r;
    this.color.g = color.g;
    this.color.b = color.b;
};

Cell.prototype.setSize = function (size) {
    this._size = size;
    this._sizeSquared = size * size;
    this._mass = this._sizeSquared / 100;
    if (this.owner) 
        this.owner.isMassChanged = true;
};

Cell.prototype.getSpeed = function () {
    var speed = 2.1106 / Math.pow(this._size, 0.449);
    // tickStep = 40ms
    this._speed = (this.owner.customspeed > 0) ? 
    speed * 40 * this.owner.customspeed : // Set by command
    speed * 40 * this.gameServer.config.playerSpeed;
    return this._speed;
};

Cell.prototype.setAngle = function (angle) {
    this.boostDirection = {
        x: Math.sin(angle),
        y: Math.cos(angle),
        angle: angle
    };
};

// Returns cell age in ticks for specified game tick
Cell.prototype.getAge = function (tick) {
    if (this.tickOfBirth == null) return 0;
    return Math.max(0, tick - this.tickOfBirth);
};

Cell.prototype.setKiller = function (cell) {
    this.killedBy = cell;
};

Cell.prototype.setPosition = function (pos) {
    this.position.x = pos.x;
    this.position.y = pos.y;
};

// by default cell cannot eat anyone
Cell.prototype.canEat = function (cell) {
    return false;
};

// Called to eat prey cell
Cell.prototype.onEat = function (prey) {
    // Cant grow from cells under 17 mass (vanilla)
    if (this._mass >= 625 && prey._mass <= 17 && prey.cellType != 3) {
        prey._sizeSquared = 0;
    }
    this.setSize(Math.sqrt(this._sizeSquared + prey._sizeSquared));
};

Cell.prototype.onEaten = function (hunter) {
};

Cell.prototype.onAdd = function (gameServer) {
};

Cell.prototype.onRemove = function (gameServer) {
};

Cell.prototype.setBoost = function (distance, angle) {
    this.boostDistance = distance;
    this.setAngle(angle);
    this.isMoving = true;
    if (!this.owner) {
        var index = this.gameServer.movingNodes.indexOf(this);
        if (index < 0)
            this.gameServer.movingNodes.push(this);
    }
};

Cell.prototype.move = function (border) {
    if (this.isMoving && this.boostDistance <= 0) {
        this.boostDistance = 0;
        this.isMoving = false;
        return;
    }
    var speed = Math.sqrt(this.boostDistance * this.boostDistance / 100);
    this.boostDistance -= speed;
    var v = this.clipVelocity(
        { x: this.boostDirection.x * speed, y: this.boostDirection.y * speed }, 
        border);
    this.position.x += v.x;
    this.position.y += v.y;
    this.checkBorder(border);
};

Cell.prototype.clipVelocity = function (v, border) {
    // zero move, no calculations :)
    if (v.x == 0 && v.y == 0) return v; 
    var r = this._size / 2;
    var bound = {
        minx: border.minx + r,
        miny: border.miny + r,
        maxx: border.maxx - r,
        maxy: border.maxy - r
    };
    var x = this.position.x + v.x;
    var y = this.position.y + v.y;
    // border check
    var pleft = x >= bound.minx ? null : findLineIntersection(
        this.position.x, this.position.y, x, y,
        bound.minx, bound.miny, bound.minx, bound.maxy);
    var pright = x <= bound.maxx ? null : findLineIntersection(
        this.position.x, this.position.y, x, y,
        bound.maxx, bound.miny, bound.maxx, bound.maxy);
    var ptop = y >= bound.miny ? null : findLineIntersection(
        this.position.x, this.position.y, x, y,
        bound.minx, bound.miny, bound.maxx, bound.miny);
    var pbottom = y <= bound.maxy ? null : findLineIntersection(
        this.position.x, this.position.y, x, y,
        bound.minx, bound.maxy, bound.maxx, bound.maxy);
    var ph = pleft != null ? pleft : pright;
    var pv = ptop != null ? ptop : pbottom;
    var p = ph != null ? ph : pv;
    if (p == null) return v; // inside border
    
    if (ph && pv) {
        // two border lines intersection => get nearest point
        var hdx = ph.x - this.position.x;
        var hdy = ph.y - this.position.y;
        var vdx = pv.x - this.position.x;
        var vdy = pv.y - this.position.y;
        if (hdx * hdx + hdy * hdy < vdx * vdx + vdy * vdy)
            p = ph;
        else
            p = pv;
    }
    
    // reflect angle
    var angle = this.boostDirection.angle;
    if (p == ph) {
        // left/right border reflection
        angle = 2 * Math.PI - angle;
    } else {
        // top/bottom border reflection
        angle = angle <= Math.PI ? Math.PI - angle : 3 * Math.PI - angle;
    }
    this.setAngle(angle);
    // calculate rest of velocity
    var ldx = v.x - (p.x - this.position.x);
    var ldy = v.y - (p.y - this.position.y);
    // update velocity and add rest to the boostDistance
    v.x = (p.x - this.position.x);
    v.y = (p.y - this.position.y);
    this.boostDistance += Math.sqrt(ldx * ldx + ldy * ldy);
    this.isMoving = true;
    return v;
};

Cell.prototype.checkBorder = function (border) {
    this.position.x = Math.max(this.position.x, border.minx + this._size / 2);
    this.position.y = Math.max(this.position.y, border.miny + this._size / 2);
    this.position.x = Math.min(this.position.x, border.maxx - this._size / 2);
    this.position.y = Math.min(this.position.y, border.maxy - this._size / 2);
};

// Lib
function findLineIntersection(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
    var z1 = p1x - p0x;
    var z2 = p3x - p2x;
    var w1 = p1y - p0y;
    var w2 = p3y - p2y;
    var k1 = w1 * z2 - z1 * w2;
    if (k1 == 0) return null;
    var k2 = (z1 * (p2y - p0y) + w1 * (p0x - p2x)) / k1;
    var px = p2x + z2 * k2;
    var py = p2y + w2 * k2;
    if (isNaN(px) || isNaN(py)) return null;
    return { x: px, y: py };
}
