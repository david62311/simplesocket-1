;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("simplesocket/lib/index.js", function(exports, require, module){
require('./offline-events');
module.exports = require('./simplesocket');
});
require.register("simplesocket/lib/offline-events.js", function(exports, require, module){
function triggerEvent(type) {
  var event = document.createEvent('HTMLEvents');
  event.initEvent(type, true, true);
  event.eventName = type;
  (document.body || window).dispatchEvent(event);
}

function testConnection() {
  // make sync-ajax request
  var xhr = new XMLHttpRequest();
  // phone home
  xhr.open('HEAD', '/', false); // async=false
  try {
    xhr.send();
    onLine = true;
  } catch (e) {
    // throws NETWORK_ERR when disconnected
    onLine = false;
  }

  return onLine; 
}

var onLine = true,
    lastOnLineStatus = true;

// note: this doesn't allow us to define a getter in Safari
navigator.__defineGetter__("onLine", testConnection);
testConnection();

if (onLine === false) {
  lastOnLineStatus = false;
  // trigger offline event
  triggerEvent('offline');
}

setInterval(function () {
  testConnection();
  if (onLine !== lastOnLineStatus) {
    triggerEvent(onLine ? 'online' : 'offline');
    lastOnLineStatus = onLine;
  }
}, 5000);
});
require.register("simplesocket/lib/simplesocket.js", function(exports, require, module){
module.exports = SimpleSocket;

function SimpleSocket(url, protocols, options) {
  this.options = options || {};
  this.url = url;
  this.protocols = protocols;
  this.reconnectDelay = this.options.reconnectDelay || 500;
  this.closeDelay = this.options.closeDelay || 5000;
  this.currentDelay = this.reconnectDelay;

  this.readyState = WebSocket.CONNECTING;
  this.forcedClose = false;
  this.timedOut = false;

  this.onlineListener = function () {
    self.refresh();
  }
  
  this.connect();
}

SimpleSocket.prototype.connect = function (reconnect) {
  var self = this;

  if (WebSocket.length == 3) {
    this.socket = new WebSocket(this.url, this.protocols, this.options);
  }
  else if (this.protocols) {
    this.socket = new WebSocket(this.url, this.protocols);
  }
  else {
    this.socket = new WebSocket(this.url);
  }

  this.onconnecting && this.onconnecting();

  var closeIntervalId = setTimeout(function () {
    self.timedOut = true;
    
    if (self.socket.readyState !== WebSocket.CLOSED) {
      self.socket.close();
    }

    self.timedOut = false;
  }, this.closeDelay);

  this.socket.onopen = function (event) {
    clearTimeout(closeIntervalId);

    self.readyState = WebSocket.OPEN;
    reconnect = false;
    self.currentDelay = self.reconnectDelay;

    self.onopen && self.onopen(event);
  }
  
  this.socket.onclose = function (event) {
    clearTimeout(closeIntervalId);
    self.socket = null;

    if (self.forcedClose) {
      self.readyState = WebSocket.CLOSED;
      self.onclose && self.onclose(event);
      self.currentDelay = self.reconnectDelay;
    } 
    else {
      self.readyState = WebSocket.CONNECTING;
      self.onconnecting && self.onconnecting();
      
      if (!reconnect && !self.timedOut) {
        self.onclose && self.onclose(event);
        self.currentDelay = self.reconnectDelay;
      }

      setTimeout(function () {
        self.connect(true);
        self.currentDelay *= 2;

      }, self.currentDelay);
    }
  }

  this.socket.onmessage = function (event) {
    self.onmessage && self.onmessage(event);
  }

  this.socket.onerror = function (event) {
    self.onerror && self.onerror(event);
  }

  window.removeEventListener('offline', this.onlineListener);
  window.removeEventListener('online', this.onlineListener);

  window.addEventListener('offline', this.onlineListener);
  window.addEventListener('online', this.onlineListener);
}

SimpleSocket.prototype.send = function (data) {
  if (this.socket) {
    return this.socket.send(data);
  }
}

SimpleSocket.prototype.close = function () {
  this.forcedClose = true;
  
  if (this.socket) {
    this.socket.close();
  }
}

SimpleSocket.prototype.refresh = function () {
  if (this.socket) {
    this.socket.close();
  }
}
});
require.alias("simplesocket/lib/index.js", "simplesocket/index.js");if (typeof exports == "object") {
  module.exports = require("simplesocket");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("simplesocket"); });
} else {
  this["SimpleSocket"] = require("simplesocket");
}})();