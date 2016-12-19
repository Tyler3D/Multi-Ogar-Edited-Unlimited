"use strict";

var HTML = "<style>                                               " + 
 "*{                                                              " + 
 "    background: #000;                                           " + 
 "    font-family: monospace;                                     " + 
 "    color: #0f0;                                                " + 
 "    -webkit-font-smoothing: none;                               " + 
 "    font-size: 17px;                                            " + 
 "  }                                                             " + 
 "#input{outline: none;border: none;}                             " + 
 "</style>                                                        " + 
 "<div style='bottom: 1em;'>                   " + 
 "<pre id='log'></pre>                                            " + 
// ">&nbsp;                                                       " + 
 "<label>><input id='input' autofocus                             " +
 "onchange='ws.send(this.value);this.value=\"\"''></label></div>  " + 
 "<script>                                                        " + 
"(function(){\n"+
"   function declare(module_name, exports) {\n"+
"     if (typeof module != 'undefined') module.exports = exports\n"+
"     else window[module_name] = exports\n"+
"   }\n"+
" \n"+
"   function ansi2html(str) {\n"+
"     var props = {}\n"+
"       , open = false\n"+
" \n"+
"     var stylemap =\n"+
"       { bold: \"font-weight\"\n"+
"       , underline: \"text-decoration\"\n"+
"       , color: \"color\"\n"+
"       , background: \"background\"\n"+
"       }\n"+
" \n"+
"     function style() {\n"+
"       var key, val, style = []\n"+
"       for (var key in props) {\n"+
"         val = props[key]\n"+
"         if (!val) continue\n"+
"         if (val == true) {\n"+
"           style.push(stylemap[key] + ':' + key)\n"+
"         } else {\n"+
"           style.push(stylemap[key] + ':' + val)\n"+
"         }\n"+
"       }\n"+
"       return style.join(';')\n"+
"     }\n"+
" \n"+
" \n"+
"     function tag(code) {\n"+
"       var i\n"+
"         , tag = ''\n"+
"         , n = ansi2html.table[code]\n"+
" \n"+
"       if (open) tag += '</span>'\n"+
"       open = false\n"+
" \n"+
"       if (n) {\n"+
"         for (i in n) props[i] = n[i]\n"+
"         tag += '<span style=\"' + style() + '\">'\n"+
"         open = true\n"+
"       } else {\n"+
"         props = {}\n"+
"       }\n"+
" \n"+
"       return tag\n"+
"     }\n"+
" \n"+               // "   (/[(d+;)?(d+)*m/g,  " (/\[(\d+;)?(\d+)*m/g,
"     return str.replace(/\\[(\\d+;)?(\\d+)+m/g, function(match, b1, b2) {\n"+
"       var i, code, res = ''\n"+
"       if (b2 == '' || b2 == null) b2 = '0'\n"+
"       for (i = 1; i \< arguments.length - 2; i++) {\n"+
"         if (!arguments[i]) continue\n"+
"         code = parseInt(arguments[i])\n"+
"         res += tag(code)\n"+
"       }\n"+
"       return res\n"+
"     }) + tag()\n"+
"   }\n"+
" \n"+
"   /* not implemented:\n"+
"    *   italic\n"+
"    *   blink\n"+
"    *   invert\n"+
"    *   strikethrough\n"+
"    */\n"+
"   ansi2html.table =\n"+
"   { 0: null\n"+
"   , 1: { bold: true }\n"+
"   , 3: { italic: true }\n"+
"   , 4: { underline: true }\n"+
"   , 5: { blink: true }\n"+
"   , 6: { blink: true }\n"+
"   , 7: { invert: true }\n"+
"   , 9: { strikethrough: true }\n"+
"   , 23: { italic: false }\n"+
"   , 24: { underline: false }\n"+
"   , 25: { blink: false }\n"+
"   , 27: { invert: false }\n"+
"   , 29: { strikethrough: false }\n"+
"   , 30: { color: 'black' }\n"+
"   , 31: { color: 'red' }\n"+
"   , 32: { color: 'green' }\n"+
"   , 33: { color: 'yellow' }\n"+
"   , 34: { color: 'blue' }\n"+
"   , 35: { color: 'magenta' }\n"+
"   , 36: { color: 'cyan' }\n"+
"   , 37: { color: 'white' }\n"+
"   , 39: { color: null }\n"+
"   , 40: { background: 'black' }\n"+
"   , 41: { background: 'red' }\n"+
"   , 42: { background: 'green' }\n"+
"   , 43: { background: 'yellow' }\n"+
"   , 44: { background: 'blue' }\n"+
"   , 45: { background: 'magenta' }\n"+
"   , 46: { background: 'cyan' }\n"+
"   , 47: { background: 'white' }\n"+
"   , 49: { background: null }\n"+
"   }\n"+
" \n"+
"   declare('ansi2html', ansi2html)\n"+
" })()\n"+
 "var el = document.getElementById('input');                      " + 
 "el.focus();                                                     " + 
 "el.onblur = function () {                                       " +     
 "    setTimeout(function () {                                    " + 
 "        el.focus();                                             " + 
 "    });                                                         " + 
 "};                                                              " + 
 "var ws = new WebSocket('ws://192.168.56.101:1234', 'echo-protocol'); " + 
 "ws.addEventListener(\"message\", function(e) {                  " + 
 "    console.log(\"get \"+e.data);                               " + 
 "    var msg = e.data;                                           " +
 "    if (msg == \">\") msg=''; " +
 "    var $log = document.getElementById('log');                  " + 
 "    log.innerHTML = log.innerHTML + '\\n' + ansi2html(msg);     " +
 "window.scrollTo(0,document.body.scrollHeight);" +
 " });</script>";



var http = require('http');
var consoleServer = http.createServer(function(request, response) {
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end(HTML);
});


consoleServer.listen(1234, function() {
    console.log((new Date()) + ' consoleServer is listening on port 1234');
});

//===========================================

var child = require('child_process');
var MO = child.spawn('./run.sh');

process.stdin.pipe(MO.stdin);

MO.stdin.on("end", function() {
    process.exit(0);
});

MO.stdout.on('data', function (data) { // send data to remote console
    console.log((data+"").trim());
     for (var i in clients) {    
        clients[i].sendUTF((data+"").trim());
      }

});

MO.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
});

//=========================================*/
var count = 0;
var clients = {};


var WebSocketServer = require('websocket').server;
var wsServer = new WebSocketServer({
  httpServer: consoleServer
});


wsServer.on('request', function(r) {

  // Code here to run on connection
  var connection = r.accept('echo-protocol', r.origin);

  // Specific id for this client & increment count
  var id = count++;

  // Store the connection method so we can loop through & contact all clients
  clients[id] = connection;
  
  console.log((new Date()) + ' Connection accepted [' + id + ']');

  // Create event listener
  connection.on('message', function(message) {

      var msgString = message.utf8Data;

      console.log("get message >\""+msgString+"\"");
      MO.stdin.write(msgString.replace("<br>","")+"\n"); // get line from remote
      for (var i in clients) {    // loopback
        clients[i].sendUTF(msgString.trim());
      }
 
  });


  connection.on('close', function(reasonCode, description) {
    delete clients[id];
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });

});


