function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable: true,
        writable: false,
        configurable: false
    });
}

define("GUEST", 0);
define("USER", 1);
define("MODER", 2);
define("ADMIN", 4);
define("1", 1);
define("2", 2);
define("4" , 4);
