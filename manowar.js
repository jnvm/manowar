module.exports=function(opts={}){
	var _=require("lodash")
		,crayon=require("crayon-terminal")
		,activeRequests={}

	_.defaults(opts,{
		ellipsize:true//cut off logs that exceed terminal width instead of wrapping
		,logEachReq:(req,res)=>false// take what data you want from the req & display as you'd like. Or let the default display.
		,overrideIconsWith:undefined// until it can be determined how to deal with icons...breaking things lining up...
	})

	var cc=(function indentAwareConsoleLogger(){
			var o=_.extend({
					info:(...a)       =>log( opts.overrideIconsWith || String.fromCharCode(9432) ,crayon.aqua,a)
					,warn:(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9888) ,crayon.background("#920").bold.white,a)
					,error:(...a)     =>log( opts.overrideIconsWith || String.fromCharCode(10060),crayon.bold.bgRed.white,a)
					,bad:(...a)       =>log( opts.overrideIconsWith || String.fromCharCode(9760) ,crayon.bgRed.white,a)
					,virus:(...a)     =>log( opts.overrideIconsWith || String.fromCharCode(9763) ,crayon.bgRed.bold.white,a)
					,f:(...a)         =>log( opts.overrideIconsWith || String.fromCharCode(8497) ,crayon.bgBlue.bold.white,a)
					,flag:(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9873) ,crayon.bgWhite.black,a)
					,no:(...a)        =>log( opts.overrideIconsWith || String.fromCharCode(9940) ,crayon.bgWhite.red,a)
					,hey:(...a)       =>log( opts.overrideIconsWith || String.fromCharCode(9755) ,crayon.bold.background("#00f").color("#f0f"),a)
					,aro:(...a)       =>log( opts.overrideIconsWith || String.fromCharCode(8680) ,crayon.bold.background("#f0f").color("#0f0"),a)
					,good:(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9989) ,crayon.bold.color("#0f0"),a)
					,great:(...a)     =>log( opts.overrideIconsWith || String.fromCharCode(10004),crayon.background("#0f0").black,a)
					,email:(...a)     =>log( opts.overrideIconsWith || String.fromCharCode(9993) ,crayon.gold,a)
					,free:(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9995) ,crayon.white,a)
					,edit:(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9998) ,crayon.orange,a)
					,star:(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9733) ,crayon.gold,a)

					,start:(...a)     =>log(crayon.reset.gray("┌"/*─┤"*/),null,a,{noLine:true})
					,end:(...a)       =>log(crayon.reset.gray("└"/*─┤"*/),null,a,{noLine:true})

					,icon:(i,...a)    =>log(_.isInteger(i) ? String.fromCharCode(i) : i,null,a)

					//,inspect:(...a)   =>log("!",crayon,a.map(x=>util.inspect(x,{ showHidden: true, depth: null ,colors:true})))
					,custom:(opts,...a)=>log(opts.icon,opts.crayonString ? _.get(crayon,opts.crayonString) : opts.style,a,opts)
					,sql:(query,rows,queryLine,took,db)=>{
						var meta=// select?
								rows && rows.length!==undefined ? rows.length+" row"+(rows.length==1?' ':'s')
								// state-change?
								: rows ? `#:${rows.affectedRows} ${String.fromCharCode(916)}:${rows.changedRows} !:${rows.warningCount}`
								: ''
							,tooks=" in "+took+"s"
							,say=query.sql.replace(/[\t\s\v]/g,' ').replace(/\s{2,}/g,' ').trim()

						cc.custom({icon:crayon.bg232.gray(String.fromCharCode(9658)),line:queryLine}//"🔎"
							,crayon.bg232._236(_.padStart(meta,15).replace(/!:([^0]\d*)/,x=>crayon.yellow(x)))
							+crayon.bg232[ took<1?'blue'
									:took<5?'yellow'
									:'red'](tooks)
							+crayon.bg232.gray(":")
							+crayon.bg232(say)
						)
					}
				},opts.cc||{})
				,markedSeparator=String.fromCharCode(9500)
				,unmarkedSeparator=String.fromCharCode(9474)
				,log=(icon,lineStyling,msgs,opt={}) => {

					//console.log(_.keys(activeRequests).map(x=>activeRequests[x].domain && activeRequests[x].domain.indent).join(","))
					//console.log(Error("line count retrieval").stack.split("\n"))

					var  maxW=process.stdout.columns
						,line=_.padStart(opt.line || Error("line count retrieval").stack.split("\n")[4].split(":")[1],5)
						,indent=process.domain && process.domain.indent!==undefined && process.domain.indent ||0
						,reqKeys=_.keys(activeRequests)
						,maxIndent=Math.max(...reqKeys.map(x=>activeRequests[x] && activeRequests[x].indent))+1
					//console.log(indent,process.domain && process.domain.id)
						,indentChars=" ".repeat(indent)
							.split("")
							.map((x,i)=>{
								//console.log({indent,x,i})
								var active=reqKeys.filter(id=>{return activeRequests[id] && activeRequests[id].indent==i}).length
								return active ? unmarkedSeparator : x
							})
							.join("")
						,sep=(opt.noLine ? "" : markedSeparator)//code2str(9474)
						,msg=indentChars+sep+(lineStyling ? lineStyling(icon,...msgs) : icon + msgs)
						,plainLength=crayon.stripColor(msg).length
						,remainder=Math.max(0,maxIndent-plainLength)

					//msg+=_.padEnd(":"+plainLength,4)

					console.log(
						 crayon.reset.gray(line)
						//,process.pid
						,crayon.reset()
						,(opts.ellipsize && plainLength>maxW ? msg.substr(0,maxW-5)+String.fromCharCode(8230) : msg)
						,crayon.reset()
						//am I short enough to merit later line continuations?
						," ".repeat(remainder).split("").map((x,i)=>{
							i+=plainLength+2//?
							var active=reqKeys.filter(id=>{return activeRequests[id] && activeRequests[id].indent==i}).length
							return active ? unmarkedSeparator : x
						}).join("")

					)
				}
			return _.extend(o.info,o)
		})()

	var requestLogger=function(req,res,next){
		var t1=new Date()
			,id=req.id||process.domain.id

			,forceKillAfter=opts.forceRequestKillAfter===undefined? 10*1000 : opts.forceRequestKillAfter
			,indent=(()=>{
				var i=0
					,lvl=_.keyBy(activeRequests,'domain.indent')
				while(lvl[i]) i++
				return i
			})()
		req.domain.indent=indent
		req.indent=indent
		activeRequests[id]=req
		process.domain.req=req
		var abandonTimer=!forceKillAfter ? -1 : setTimeout(()=>{
				cc.bad("killing req!",id)
				if(!res.headersSent)
					res.status(408).send("Request Timeout")
				logEndReq()
			},forceKillAfter)
			,logEndReq=_.once(()=>{
				var t=((Date.now()-t1)/1000).toFixed(3)
				cc.end(res.statusCode+" in "+crayon.bold[t<1?"green":t<3?"yellow":"red"](t+"s"))
				forceKillAfter && clearTimeout(abandonTimer)
				delete activeRequests[id]
			})

		cc.start(
			opts.logEachReq(req,res)
			||
			(
				//crayon.gray(t1.toJSON().replace(/\D/g,''))//time?
				crayon[req.method=='GET' ? 'bgGreen' : 'bgOrange'].black(req.method)
				+" "
				+crayon.purple(req.headers.host)
				+crayon.magenta.bold(req.path)
				+crayon.aqua(req._parsedUrl.search||'')
			)
		)
		res.on("finish",logEndReq)
		//cc({cookies:req.cookies,id})
		global.lastReq=req
		global.lastRes=res
		next()
	}

	return {cc,requestLogger}
}