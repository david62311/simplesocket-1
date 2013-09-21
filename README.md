simplesocket
============

Adds reconnection support to plain WebSocket object.


### Usage


```js
var socker = new SimpleSocket(URL, options);
```

`options` paramater is optional. Currently supported `options` are:

- reconnectDelay (default 1000ms)
- closeDelay (default 2000ms)
- protocols 