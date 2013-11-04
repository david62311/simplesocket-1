module.exports = SimpleSocket;

function SimpleSocket(url, protocols, options) {
  var self = this;

  this.options = options || {};
  this.url = url;
  this.protocols = protocols;
  this.reconnectDelay = this.options.reconnectDelay || 500;
  this.closeDelay = this.options.closeDelay || 5000;
  this.currentDelay = this.reconnectDelay;

  this.readyState = WebSocket.CONNECTING;
  this.forcedClose = false;
  this.timedOut = false;

  window.addEventListener('offline', function () {
    self.close();
  }, false);

  window.addEventListener('online', function () {
    self.connect();
  }, false);
  
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