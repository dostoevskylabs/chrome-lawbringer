# chrome-lawbringer
![Lawbringer](https://i.imgur.com/KLD4C1u.png)

proof-of-concept extension for google chrome that will monitor tab's CPU usage individually and terminate them if they exceed a threshhold. Also experimenting with overloading native JavaScript functions to impose a permission scheme.

Keep in mind this is just a PoC - I'm just showing you how it can work to intercept and reject instances of resource requests within javascript. I have a million ideas of how I want this to be end-game. However, at the end of the day I would rather see the browser implement these features natively.

*Note: This is not meant to be used and is currently still in very early development as such it only works on dev build of chrome*

#### TODO
- A lot

#### An Example loading coinhive, allows you to allow/reject and view a report of the findings
![Example 1](https://i.imgur.com/FfNKmoN.png)

#### Viewing a report from VT, now you can make the choice to allow or reject
![Example 2](https://i.imgur.com/oSAxmOT.png)

#### An Example of loading a page that's been blacklisted
![Example 3](https://i.imgur.com/F1xT5a1.png)
