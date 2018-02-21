# chrome-lawbringer
![Lawbringer](https://i.imgur.com/KLD4C1u.png)

proof-of-concept extension for google chrome that will monitor tab's CPU usage individually and terminate them if they exceed a threshhold. Also experimenting with overloading native JavaScript functions to impose a permission scheme.

Keep in mind this is just a PoC - obviously you're not going to sit there and hit y every request. However, I'm just showing you how it can work to intercept and reject instances of resource requests within javascript. I have a million ideas of how I want this to be end-game. However, at the end of the day I would rather see the browser implement these features natively.

*only works on dev build currently*

#### An Example of using CPU usage to block cryptominers based on excessive cpu usage.
![Example 1](https://i.imgur.com/VwpbG2E.png)

#### An Example of pulling all scripts inline/external from a page that we can then run against a service for detection.
![Example 2](https://i.imgur.com/uOlKBq3.png)

#### An Example of permission requests for WebSocket's and XMLHTTP Requests
![Example 3](https://i.imgur.com/6XKqEB7.png)
![Example 3](https://i.imgur.com/6kawftb.png)
![Example 3](https://i.imgur.com/ppEmcWw.png)
![Example 3](https://i.imgur.com/z6Abzti.png)
![Example 3](https://i.imgur.com/UqQz1Gc.png)
