SimpleSocket
============

SimpleSocket adds reconnection support to plain WebSocket object. The API is compatible with WebSocket.


### Usage

```js
var socket = new SimpleSocket(host, protocols, options);
```

`protocols` and `options` paramaters are optional. You can currently pass two `options`:

- reconnectDelay (default 1000ms)
- closeDelay (default 2000ms)

All events available in WebSocket (`onopen`, `onerror`, `onmessage`) are also available in SimpleSocket. In addition SimpleSocket exposes additional event called `onconnecting`.


### License

MIT