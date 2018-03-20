module.exports=function(opts={}){
	var _=require("lodash")
		,chalk=require("chalk")
		,activeRequests={}
		,cls=require('cls-hooked')
		,namespace=cls.createNamespace('manowar')
		,shortid = require('shortid').generate
		,stripAnsi=require('strip-ansi')
		,util=require('util')
		,lastHue=~~(Math.random()*360)
		,maxIdLength=11
		,getColor=()=>_.get(activeRequests[namespace.get('indent')],'color',chalk.reset.gray)
		,cc
	chalk.level=2
	_.defaults(opts,{
		ellipsize:true//cut off logs that exceed terminal width instead of wrapping
		,logEachReq:(req,res)=>false// take what data you want from the req & display as you'd like. Or let the default display.
		,overrideIconsWith:undefined// until it can be determined how to deal with icons...breaking things lining up...
	})

	cc=(function indentAwareConsoleLogger(){
			var o=_.extend({
					info  :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9432) ,chalk.hex('0ff'),a)
					,warn :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9888) ,chalk.bgHex("920").bold.white,a)
					,error:(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(10060),chalk.bold.bgRed.white,a)
					,bad  :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9760) ,chalk.bgRed.white,a)
					,virus:(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9763) ,chalk.bgRed.bold.white,a)
					,f    :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(8497) ,chalk.bgBlue.bold.white,a)
					,flag :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9873) ,chalk.bgWhite.black,a)
					,no   :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9940) ,chalk.bgWhite.red,a)
					,hey  :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9755) ,chalk.bold.bgHex("00f").hex("f0f"),a)
					,aro  :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(8680) ,chalk.bold.bgHex("f0f").hex("0f0"),a)
					,good :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9989) ,chalk.bold.hex("#0f0"),a)
					,great:(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(10004),chalk.bgHex("0f0").black,a)
					,email:(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9993) ,chalk.gold,a)
					,free :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9995) ,chalk.white,a)
					,edit :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9998) ,chalk.orange,a)
					,star :(...a)      =>log( opts.overrideIconsWith || String.fromCharCode(9733) ,chalk.gold,a)

					,start:(...a)      =>log(getColor()("┌"/*─┤"*/),null,a,{noLine:true})
					,end  :(...a)      =>log(getColor()("└"/*─┤"*/),null,a,{noLine:true})

					,icon :(i,...a)    =>log(_.isInteger(i) ? String.fromCharCode(i) : i,null,a)

					,inspect:(...a)   =>log(" ",chalk,a.map(x=>util.inspect(x,{ showHidden: true, depth: null ,colors:true})))
					,custom:(opts,...a)=>log(opts.icon,opts.chalkString ? _.get(chalk,opts.chalkString) : opts.style,a,opts)
					,sql:(query,rows,queryLine,took,db)=>{
						var meta=// select?
								rows && rows.length!==undefined ? rows.length+" row"+(rows.length==1?' ':'s')
								// state-change?
								: rows ? `#:${rows.affectedRows} ${String.fromCharCode(916)}:${rows.changedRows} !:${rows.warningCount}`
								: ''
							,tooks=" in "+took+"s"
							,say=query.sql.replace(/[\t\s\v]/g,' ').replace(/\s{2,}/g,' ').trim()

						cc.custom({icon:String.fromCharCode(9658),line:queryLine}//"🔎"
							,chalk.bgHex('111').hex('eee')(_.padStart(meta,15).replace(/!:([^0]\d*)/,x=>chalk.yellow(x)))
							+chalk.bgHex('111')[ took<1?'blue'
									:took<5?'yellow'
									:'red'](tooks)
							+chalk.bgHex('111').gray(":")
							+chalk.bgHex('111')(say)
						)
					}
				},cc)
				,markedSeparator=String.fromCharCode(9500)
				,unmarkedSeparator=String.fromCharCode(9474)
				,log=(icon,lineStyling,msgs,opt={}) => {

					var  maxW=process.stdout.columns
						,stack=Error("line count retrieval").stack.split("\n")
						,filenameSize=15
						,lastLine=''
						,targetLine=(opt.line
							|| _.find(stack.slice(1),x=>!x.match(/node_modules/))
							|| _.reduce(stack.slice(1),(found,line)=>{
								if(found) return found
								if(!line.match(/manowar/) && lastLine.match(/manowar/)){
									found=lastLine
								}
								lastLine=line
								return found
							},false)
						)
						,line=_.padStart(targetLine
								.match(/(\S+\.js\S+)/)[1]
								.replace(/[()]/g,'')
								.split(":").slice(0,2).join(":")
								.split('/').pop()
							,filenameSize)
							.slice(0,filenameSize)
						,color=getColor()
						,indent=_.defaultTo(namespace.get('indent'),0)
						,maxIndent=Math.max(..._.keys(activeRequests))+1
						,indentChars=" ".repeat(indent)
							.split("")
							.map((emptySpace,i)=>{
								return activeRequests[i]
									? activeRequests[i].color(unmarkedSeparator)
									: emptySpace
							})
							.join("")
						,sep=(opt.noLine||!namespace.active ? "" : markedSeparator)//code2str(9474)
						,given=_.castArray(msgs).map(x=>util.format(x))
						,msg=indentChars
							+color(sep)
							+(lineStyling ? lineStyling(icon,...given) : color(icon) + given)
						,plainLength=stripAnsi(msg).length
						,remainder=Math.max(0,maxIndent-plainLength)
						
					//console.log(Error("line count retrieval").stack)
					//console.log({stack})

					console.log(
						 chalk.reset()
						,chalk.gray(line)
						,color(namespace.get('cid')||" ".repeat(maxIdLength))
						,chalk.reset()
						,(opts.ellipsize && plainLength>maxW
							? msg.substr(0,maxW-5)+String.fromCharCode(8230)
							: msg
						)
						,chalk.reset()
						//am I short enough to merit later line continuations?
						," ".repeat(remainder).split("").map((emptySpace,i)=>{
							i+=plainLength+2//?
							return activeRequests[i] ? activeRequests[i].color(unmarkedSeparator) : emptySpace
						}).join("")

					)
				}
			
			return _.extend(o.info,o,{chalk,namespace,lastHue,activeRequests})
		})()

	var requestLogger=function(req,res,next){
		namespace.run(()=>{
			var t1=new Date()
				,id=shortid().padEnd(maxIdLength,"0")
				,color=(()=>{
					lastHue=(lastHue+157)%360
					return chalk.reset.hsl(lastHue,50,50)
				})()
				,forceKillAfter=opts.forceRequestKillAfter===undefined? 10*1000 : opts.forceRequestKillAfter
				,indent=(()=>{
					var i=0
					while(activeRequests[i]) i++
					return i
				})()
			req.indent=indent
			activeRequests[indent]={req,color}
			namespace.set('req',req)
			namespace.set('indent',indent)
			namespace.set('cid',id)
			namespace.bindEmitter(req)
			namespace.bindEmitter(res)
			var abandonTimer=!forceKillAfter ? -1 : setTimeout(()=>{
					cc.bad("killing req!",id)
					if(!res.headersSent)
						res.status(408).send("Request Timeout")
					logEndReq()
				},forceKillAfter)
				,logEndReq=_.once(()=>{
					var t=((Date.now()-t1)/1000).toFixed(3)
						,hex='040'
					switch(res.statusCode.toString()[0]*1){
						case 1:hex='004';break
						case 2:hex='040';break
						case 3:hex='044';break
						case 4:hex='404';break
						case 5:hex='400';break
					}
					cc.end(chalk.bgHex(hex).hex('fff')(` ${res.statusCode} `)+" in "+chalk.bold[t<1?"green":t<3?"yellow":"red"](t+"s"))
					if(forceKillAfter) clearTimeout(abandonTimer)
					delete activeRequests[indent]
				})
	
			cc.start(
				opts.logEachReq(req,res)
				||
				(
					//chalk.gray(t1.toJSON().replace(/\D/g,''))//time?
					chalk.bgHex([req.method=='GET' ? '0f0' : 'ff0']).hex('000').bold(` ${req.method} `)
					+" "
					+chalk.hex('7f0')('127.0.0.1')//req.headers.host)
					+chalk.magenta.bold(req.path)
					+chalk.hex('0ff')(req._parsedUrl.search||'')
				)
			)
			
			res.on("finish",logEndReq)
			//cc({cookies:req.cookies,id})
			
			//easy REPL-checking
			global.lastReq=req
			global.lastRes=res
			
			if(!_.isEmpty(req.body)) cc.info({body:req.body})
			
			next()
		})
	}

	return {cc,requestLogger}
}
