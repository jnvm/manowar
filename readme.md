# Man O' War Logger

Have difficulty matching concurrent request event logs?

![logging example](https://cldup.com/D_miZ5S9lE.PNG)

This module provides a live logger that indents each request's logs a uniform amount, connecting them all along a line. (or [tendril on a Portugese Man O' War](https://en.wikipedia.org/wiki/Portuguese_man_o%27_war)!)

This helps visualize a few things:

1. in what order async events occur ...in sync (so this isn't applicable to true parallelism in, say, web workers)
2. which requests generated which logs in concurrent-traffic scenarios, supplemented by a correlation_id for records
3. how long requests take
4. file line references generating logs
5. also it is colorful


This requires a few things to work:

* that you use the provided `cc()` logger, which is a terse, icon-able, chalk-colorable, extendable way to log things
    * (this also provides `cc.sql`, a log format ideal to plug into [dbq](https://github.com/jnvm/dbq), should you use that)
* that you include the `requestLogger` express middleware atop your router (or above all the routes you want logs for), which itself does a few things:
    * initiate the request's indentation, which is maintained until it replies or dies
    * log out some req info
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
		,logBody:true //whether to log request bodies
		,fileNameSize:20 //max width to allow for file names on the left
		,fileLineFilter:false //if you need a custom stacktrace filter to get the file name
		,maxIdLength:11 //length of id col
		,idMaker:require('shortid').generate //if you want to supply IDs your own way
		,widthFudgeFactor:15//sometimes process.stdout.columns lies?
		,logSync:false//fs.writeSync vs console.log
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


app.use(router)


```
## Logging defaults
`cc('text')` logging works, but extra colors & icons are available at `cc.*` (if you leave icons on):

![logging defaults](https://cldup.com/kWMQYbmg9K.png)

Additionally:
* `cc.chalk` exists for you to stylize additional logs locally with [`chalk`](https://www.npmjs.com/chalk)
* `cc.namespace` will give you access to the current [`cls-hooked`](https://www.npmjs.com/cls-hooked) namespace `manowar` set up to manage indentation, should you like to use it or attach more info in a local scope.