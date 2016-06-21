# Man O' War Logger
_(experimental!)_

Have difficulty matching concurrent request events?

![logging example](https://raw.githubusercontent.com/jnvm/manowar/master/portugese-manowar.png)

This module provides a live logger that indents each request's logs a uniform amount, connecting them all along a line. (or tendril!)

This helps visualize a few things:

1. in what order async events occur ...in sync (so this isn't applicable to true parallelism in, say, web workers)
2. which requests generated which logs in high-traffic scenarios
3. how long requests take


This requires a few things to work:

* that you use the provided `cc()` logger, which is a terse, icon-able, crayon-colorable, extendable way to log things
    * (this also provides `cc.sql`, a log format ideal to plug into [dbq](https://github.com/jnvm/dbq), should you use that)
* that you already use [express-domain-middleware](https://www.npmjs.com/package/express-domain-middleware), since domains remain the most reliable way to preserve an indentation context over [cls](https://www.npmjs.com/package/continuation-local-storage) and [async wrappers](https://github.com/nodejs/tracing-wg/tree/master/docs/AsyncWrap).
    * (beware certain promise implementations do not preserve domain context)
* that you include the `requestLogger` express middleware atop your router, which itself does a few things:
    * initiate the request's indentation, which is maintained until it replies or dies
    * log out some req info, which is customizable
    * kill requests that take longer than `forceRequestKillAfter` milliseconds (defaults to 10 seconds)
    * times requests for reference

# Usage & Options
```javascript
var {cc,requestLogger}=require("manowar")({
        //option:default
        ellipsize:true //cut off log lines once they exceed window width
        ,forceRequestKillAfter:10000//kill requests that take longer than this many milliseconds. Falsy = never.
        ,logEachReq:(req,res)=>false //a fxn for you to customize the incoming request log. Return false to defer to plugin default
        ,overrideIconsWith:"" //some displays don't correctly space icons & break the line display. Override them here
        ,cc:{//any custom logging shortcuts you'd like.
            //coming soon
        }
    })
    ,app=express()
    ,router=express.Router()

router.use(requestLogger)
    //[then add your routes, use logging wherever...like:]
    .get("/*",(req,res)=>{
        cc(`logging a special message!`)
        res.send("howdy")
    })


app .use(require('express-domain-middleware'))//be sure this is added!
    .use(router)


```
## Logging defaults
`cc('text')` logging works, but extra colors & icons are available at `cc.*` (if you leave icons on):

![logging defaults](https://raw.githubusercontent.com/jnvm/manowar/master/icons.png)