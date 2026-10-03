const REACT_STUBS = `
var v={jsx:function(){return null},jsxs:function(){return null},Fragment:function(){}},g={default:{prefetch:function(){}}},y={useRouter:function(){return{push:function(){}}},usePathname:function(){return"/"}},b={forwardRef:function(c){return c||function(){}},useEffect:function(){},useRef:function(){return{current:null}},useState:function(i){return[i,function(){}]}},w={A:function(){}},z={A:function(){}},L={A:function(){}},p={A:function(){}},D={A:function(){}},x={Ay:function(){}},M={hb:function(){}},A={f:function(){}},a_=function(){},aY=function(){};`

const stripReactBootstrap = (code) => code
  .replace(/let oZ=a4\[a1\(885\)\]\(\(e,t\)=>\(0,v\.jsx\)\(D\.A,\{direction:"up",ref:t,\.\.\.e\}\)\);/, 'let oZ=function(){};')

const patch = (code) => stripReactBootstrap(code)
  .replace(/r\(5376\)\.Buffer/g, '__Buffer')
  .replace(/r\(3018\)/g, '__crypto')
  .replace(/r\(7358\)/g, '({})')
  .replace(/r\(7457\)/g, '__missingModule')
  .replace(/var aQ=r\(7358\),a\$=r\(5376\)\.Buffer/, 'var aQ=({}),a$=__Buffer')
  .replace(/var aW=r\(3018\),aO=r\(5376\)\.Buffer/, 'var aW=__crypto,aO=__Buffer')
  .replace(/aO\.from\([^)]+\);/, '')

const MISSING_MODULE = `${REACT_STUBS}
function __missingModule(){
  return function(e){
    return Promise.resolve().then(()=>{
      const t=Error("Cannot find module '"+e+"'")
      t.code="MODULE_NOT_FOUND"
      throw t
    })
  }
}
`

export function sliceVidupChunk(source) {
  const cryptoStart = source.indexOf('var aW=r(3018)')
  const cryptoEnd = source.indexOf('let a1=a9,a2=a9')
  const vmStart = source.indexOf('let a3=typeof globalThis', cryptoEnd)
  const vmEnd = source.indexOf('let oq=()=>', vmStart)
  if ([cryptoStart, cryptoEnd, vmStart, vmEnd].some((v) => v < 0)) throw new Error('VM region not found in chunk 294')
  const crypto = patch(source.slice(cryptoStart, cryptoEnd))
  const decoder = patch(source.slice(cryptoEnd, vmStart))
  const vm = patch(source.slice(vmStart, vmEnd))
  return `${crypto}\n${decoder}\n${MISSING_MODULE}\n${vm}`
}

const VM_BROWSER_SHIMS = `
globalThis.Worker = class Worker {
  constructor() { this.onmessage = null }
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}
globalThis.MessageChannel = class MessageChannel {
  constructor() {
    this.port1 = { postMessage() {}, start() {}, addEventListener() {} }
    this.port2 = { postMessage() {}, start() {}, addEventListener() {} }
  }
}
globalThis.BroadcastChannel = class BroadcastChannel {
  postMessage() {}
  close() {}
  addEventListener() {}
}
globalThis.parent = globalThis
globalThis.top = globalThis
globalThis.postMessage = function () {}
if (typeof globalThis.XMLHttpRequest === 'undefined') {
  globalThis.XMLHttpRequest = class XMLHttpRequest {
    open() {}
    setRequestHeader() {}
    send() { this.readyState = 4; this.status = 200; this.responseText = '[]'; if (this.onreadystatechange) this.onreadystatechange() }
    getAllResponseHeaders() { return '' }
  }
}
if (!globalThis.crypto.randomBytes) {
  const baseCrypto = globalThis.crypto
  globalThis.crypto = Object.assign(Object.create(Object.getPrototypeOf(baseCrypto)), baseCrypto, {
    randomBytes(n) {
      const a = new Uint8Array(n)
      baseCrypto.getRandomValues(a)
      return typeof Buffer !== 'undefined' ? Buffer.from(a) : a
    },
  })
}
`

export const VM_PRELUDE = `function on(){return!1}function o_(){return!1}function oR(){return!0}function oW(){return!1}
${VM_BROWSER_SHIMS}`

const VM_BROWSER_ENV = `{
  crypto:aW, window:globalThis, document:globalThis.document, navigator:globalThis.navigator,
  localStorage:globalThis.localStorage, console:globalThis.console,
  JSON:JSON, Math:Math, Date:Date, RegExp:RegExp, Map:Map, Set:Set, WeakMap:WeakMap, WeakSet:WeakSet,
  Array:Array, Object:Object, Number:Number, String:String, Boolean:Boolean, Symbol:Symbol, Function:Function,
  screen:globalThis.screen, Error:Error, TypeError:TypeError, RangeError:RangeError, SyntaxError:SyntaxError,
  parseInt:parseInt, parseFloat:parseFloat, isNaN:isNaN, isFinite:isFinite,
  encodeURIComponent:encodeURIComponent, decodeURIComponent:decodeURIComponent,
  NaN:NaN, Infinity:1/0, undefined:void 0, Promise:Promise, Proxy:Proxy, Reflect:Reflect,
  Uint8Array:Uint8Array, Int8Array:Int8Array, Uint16Array:Uint16Array, Int16Array:Int16Array,
  Uint32Array:Uint32Array, Int32Array:Int32Array, Float32Array:Float32Array, Float64Array:Float64Array, BigInt:BigInt,
  fetch:fetch, TextEncoder:TextEncoder, TextDecoder:TextDecoder, URL:URL, URLSearchParams:URLSearchParams,
  AbortSignal:AbortSignal, AbortController:AbortController, XMLHttpRequest:globalThis.XMLHttpRequest,
  Buffer:a$, atob:atob, btoa:btoa,
}`

export const VM_RUNNER = `
function __buildPostPath(DATA){
  var c=a1(493), base=a1(877), seg=a1(381);
  return ""[c](base,"/")[c](seg,"/")[c](DATA);
}
async function __runServers(EN){
  var servers=[], tU=EN, t6="";
  var od=function(v){servers=v}, ek=function(){}, or=function(){};
  await oc(Object.assign({encode:aV, en:tU, server:t6, setServers:od, setState:ek, setFavServer:or}, ${VM_BROWSER_ENV}));
  return servers;
}
async function __runDecode(RS){
  var h=[];
  await oT(Object.assign({}, oD, ${VM_BROWSER_ENV}, {dr:h, rs:RS}), {});
  return h[0];
}
async function __runStream(DATA){
  var res=await fetch(__buildPostPath(DATA),{
    signal:AbortSignal.timeout(3e4),
    method:a1(730),
    headers:{...JSON.parse(a1(900))},
  });
  if(res.status!==200) throw new Error("upstream "+res.status);
  var body=await res.text();
  if(!body) throw new Error("upstream empty body");
  return __runDecode(body);
}
globalThis.__vidup = { runServers:__runServers, runStream:__runStream };
`
