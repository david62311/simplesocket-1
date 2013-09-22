SimpleSocket
============

SimpleSocket adds reconnection support to plain WebSocket object. The API is compatible with WebSocket.


### Usage

```js
var socket = new SimpleSocket(host, protocols, options);
```

`options` paramater is optional. Currently supported `options` are:

- reconnectDelay (default 1000ms)
- closeDelay (default 2000ms)
- protocols 

All events available in WebSocket (`onopen`, `onerror`, `onmessage`) are also available in SimpleSocket. In addition SimpleSocket exposes additional event called `onconnecting`.


### License

MIT