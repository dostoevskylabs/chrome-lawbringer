# chrome-lawbringer
![Lawbringer](https://i.imgur.com/KLD4C1u.png)

proof-of-concept extension for google chrome that will monitor tab's CPU usage individually and terminate them if they exceed a threshhold. Also experimenting with overloading native JavaScript functions to impose a permission scheme.

Keep in mind this is just a PoC - obviously you're not going to sit there and hit y every request. However, I'm just showing you how it can work to intercept and reject instances of resource requests within javascript. I have a million ideas of how I want this to be end-game. However, at the end of the day I would rather see the browser implement these features natively.

*only works on dev build currently*

#### TODO
- Implement modular permissions schema so each idividual permission is granted to an individual domain and can also be revoked that way you can completely whitelist a domain and not run any of these techniques on it, or pick and choose what runs.
- Implement a Notification system for this information to alert you that also allows for you to interact with it (currently using alerts and that's gross)
- Implement Settings to allow for redefining the default permission schemes and also levels to which you want it to work (ie: terminating a tab, or simply killing a script, or even just warning you)

#### An Example loading coinhive, spits out into the console, alerting you of the risk and adds it to a blacklist
![Example 1](https://i.imgur.com/67cytVe.png)

#### And a dialogue incase your console is closed
![Example 2](https://i.imgur.com/Bb7A0Wo.png)

#### An Example of loading a page that's been blacklisted
![Example 3](https://i.imgur.com/H8r1m2F.png)

#### An Example of loading a clean site, showing it gets added to a whitelist so it won't get run against VT next time
![Example 4](https://i.imgur.com/wbjMvBG.png)
