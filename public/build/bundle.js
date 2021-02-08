var app=function(){"use strict";function t(){}const n=t=>t;function e(t,n){for(const e in n)t[e]=n[e];return t}function o(t){return t()}function r(){return Object.create(null)}function s(t){t.forEach(o)}function i(t){return"function"==typeof t}function l(t,n){return t!=t?n==n:t!==n||t&&"object"==typeof t||"function"==typeof t}function c(n,...e){if(null==n)return t;const o=n.subscribe(...e);return o.unsubscribe?()=>o.unsubscribe():o}function u(t){let n;return c(t,(t=>n=t))(),n}function a(t,n,e){t.$$.on_destroy.push(c(n,e))}const f="undefined"!=typeof window;let d=f?()=>window.performance.now():()=>Date.now(),$=f?t=>requestAnimationFrame(t):t;const p=new Set;function m(t){p.forEach((n=>{n.c(t)||(p.delete(n),n.f())})),0!==p.size&&$(m)}function g(t){let n;return 0===p.size&&$(m),{promise:new Promise((e=>{p.add(n={c:t,f:e})})),abort(){p.delete(n)}}}function h(t,n){t.appendChild(n)}function y(t,n,e){t.insertBefore(n,e||null)}function v(t){t.parentNode.removeChild(t)}function b(t,n){for(let e=0;e<t.length;e+=1)t[e]&&t[e].d(n)}function _(t){return document.createElement(t)}function w(t){return document.createTextNode(t)}function x(){return w(" ")}function E(){return w("")}function C(t,n,e,o){return t.addEventListener(n,e,o),()=>t.removeEventListener(n,e,o)}function k(t){return function(n){return n.preventDefault(),t.call(this,n)}}function O(t,n,e){null==e?t.removeAttribute(n):t.getAttribute(n)!==e&&t.setAttribute(n,e)}function R(t,n){n=""+n,t.wholeText!==n&&(t.data=n)}function I(t,n){t.value=null==n?"":n}class T{constructor(t=null){this.a=t,this.e=this.n=null}m(t,n,e=null){this.e||(this.e=_(n.nodeName),this.t=n,this.h(t)),this.i(e)}h(t){this.e.innerHTML=t,this.n=Array.from(this.e.childNodes)}i(t){for(let n=0;n<this.n.length;n+=1)y(this.t,this.n[n],t)}p(t){this.d(),this.h(t),this.i(this.a)}d(){this.n.forEach(v)}}const M=new Set;let V,S=0;function L(t,n,e,o,r,s,i,l=0){const c=16.666/o;let u="{\n";for(let t=0;t<=1;t+=c){const o=n+(e-n)*s(t);u+=100*t+`%{${i(o,1-o)}}\n`}const a=u+`100% {${i(e,1-e)}}\n}`,f=`__svelte_${function(t){let n=5381,e=t.length;for(;e--;)n=(n<<5)-n^t.charCodeAt(e);return n>>>0}(a)}_${l}`,d=t.ownerDocument;M.add(d);const $=d.__svelte_stylesheet||(d.__svelte_stylesheet=d.head.appendChild(_("style")).sheet),p=d.__svelte_rules||(d.__svelte_rules={});p[f]||(p[f]=!0,$.insertRule(`@keyframes ${f} ${a}`,$.cssRules.length));const m=t.style.animation||"";return t.style.animation=`${m?`${m}, `:""}${f} ${o}ms linear ${r}ms 1 both`,S+=1,f}function N(t,n){const e=(t.style.animation||"").split(", "),o=e.filter(n?t=>t.indexOf(n)<0:t=>-1===t.indexOf("__svelte")),r=e.length-o.length;r&&(t.style.animation=o.join(", "),S-=r,S||$((()=>{S||(M.forEach((t=>{const n=t.__svelte_stylesheet;let e=n.cssRules.length;for(;e--;)n.deleteRule(e);t.__svelte_rules={}})),M.clear())})))}function G(e,o,r,s){if(!o)return t;const i=e.getBoundingClientRect();if(o.left===i.left&&o.right===i.right&&o.top===i.top&&o.bottom===i.bottom)return t;const{delay:l=0,duration:c=300,easing:u=n,start:a=d()+l,end:f=a+c,tick:$=t,css:p}=r(e,{from:o,to:i},s);let m,h=!0,y=!1;function v(){p&&N(e,m),h=!1}return g((t=>{if(!y&&t>=a&&(y=!0),y&&t>=f&&($(1,0),v()),!h)return!1;if(y){const n=0+1*u((t-a)/c);$(n,1-n)}return!0})),p&&(m=L(e,0,1,c,l,u,p)),l||(y=!0),$(0,1),v}function A(t){const n=getComputedStyle(t);if("absolute"!==n.position&&"fixed"!==n.position){const{width:e,height:o}=n,r=t.getBoundingClientRect();t.style.position="absolute",t.style.width=e,t.style.height=o,W(t,r)}}function W(t,n){const e=t.getBoundingClientRect();if(n.left!==e.left||n.top!==e.top){const o=getComputedStyle(t),r="none"===o.transform?"":o.transform;t.style.transform=`${r} translate(${n.left-e.left}px, ${n.top-e.top}px)`}}function B(t){V=t}function H(t){(function(){if(!V)throw new Error("Function called outside component initialization");return V})().$$.on_mount.push(t)}const P=[],D=[],U=[],j=[],q=Promise.resolve();let F=!1;function Y(t){U.push(t)}let z=!1;const J=new Set;function K(){if(!z){z=!0;do{for(let t=0;t<P.length;t+=1){const n=P[t];B(n),Q(n.$$)}for(B(null),P.length=0;D.length;)D.pop()();for(let t=0;t<U.length;t+=1){const n=U[t];J.has(n)||(J.add(n),n())}U.length=0}while(P.length);for(;j.length;)j.pop()();F=!1,z=!1,J.clear()}}function Q(t){if(null!==t.fragment){t.update(),s(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(Y)}}let X;function Z(){return X||(X=Promise.resolve(),X.then((()=>{X=null}))),X}function tt(t,n,e){t.dispatchEvent(function(t,n){const e=document.createEvent("CustomEvent");return e.initCustomEvent(t,!1,!1,n),e}(`${n?"intro":"outro"}${e}`))}const nt=new Set;let et;function ot(){et={r:0,c:[],p:et}}function rt(){et.r||s(et.c),et=et.p}function st(t,n){t&&t.i&&(nt.delete(t),t.i(n))}function it(t,n,e,o){if(t&&t.o){if(nt.has(t))return;nt.add(t),et.c.push((()=>{nt.delete(t),o&&(e&&t.d(1),o())})),t.o(n)}}const lt={duration:0};function ct(e,o,r){let s,l,c=o(e,r),u=!1,a=0;function f(){s&&N(e,s)}function $(){const{delay:o=0,duration:r=300,easing:i=n,tick:$=t,css:p}=c||lt;p&&(s=L(e,0,1,r,o,i,p,a++)),$(0,1);const m=d()+o,h=m+r;l&&l.abort(),u=!0,Y((()=>tt(e,!0,"start"))),l=g((t=>{if(u){if(t>=h)return $(1,0),tt(e,!0,"end"),f(),u=!1;if(t>=m){const n=i((t-m)/r);$(n,1-n)}}return u}))}let p=!1;return{start(){p||(N(e),i(c)?(c=c(),Z().then($)):$())},invalidate(){p=!1},end(){u&&(f(),u=!1)}}}function ut(e,o,r){let l,c=o(e,r),u=!0;const a=et;function f(){const{delay:o=0,duration:r=300,easing:i=n,tick:f=t,css:$}=c||lt;$&&(l=L(e,1,0,r,o,i,$));const p=d()+o,m=p+r;Y((()=>tt(e,!1,"start"))),g((t=>{if(u){if(t>=m)return f(0,1),tt(e,!1,"end"),--a.r||s(a.c),!1;if(t>=p){const n=i((t-p)/r);f(1-n,n)}}return u}))}return a.r+=1,i(c)?Z().then((()=>{c=c(),f()})):f(),{end(t){t&&c.tick&&c.tick(1,0),u&&(l&&N(e,l),u=!1)}}}function at(t,n){t.d(1),n.delete(t.key)}function ft(t,n){t.f(),at(t,n)}function dt(t,n){t.f(),function(t,n){it(t,1,1,(()=>{n.delete(t.key)}))}(t,n)}function $t(t,n,e,o,r,s,i,l,c,u,a,f){let d=t.length,$=s.length,p=d;const m={};for(;p--;)m[t[p].key]=p;const g=[],h=new Map,y=new Map;for(p=$;p--;){const t=f(r,s,p),l=e(t);let c=i.get(l);c?o&&c.p(t,n):(c=u(l,t),c.c()),h.set(l,g[p]=c),l in m&&y.set(l,Math.abs(p-m[l]))}const v=new Set,b=new Set;function _(t){st(t,1),t.m(l,a),i.set(t.key,t),a=t.first,$--}for(;d&&$;){const n=g[$-1],e=t[d-1],o=n.key,r=e.key;n===e?(a=n.first,d--,$--):h.has(r)?!i.has(o)||v.has(o)?_(n):b.has(r)?d--:y.get(o)>y.get(r)?(b.add(o),_(n)):(v.add(r),d--):(c(e,i),d--)}for(;d--;){const n=t[d];h.has(n.key)||c(n,i)}for(;$;)_(g[$-1]);return g}function pt(t){t&&t.c()}function mt(t,n,e){const{fragment:r,on_mount:l,on_destroy:c,after_update:u}=t.$$;r&&r.m(n,e),Y((()=>{const n=l.map(o).filter(i);c?c.push(...n):s(n),t.$$.on_mount=[]})),u.forEach(Y)}function gt(t,n){const e=t.$$;null!==e.fragment&&(s(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}function ht(t,n){-1===t.$$.dirty[0]&&(P.push(t),F||(F=!0,q.then(K)),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function yt(n,e,o,i,l,c,u=[-1]){const a=V;B(n);const f=n.$$={fragment:null,ctx:null,props:c,update:t,not_equal:l,bound:r(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(a?a.$$.context:[]),callbacks:r(),dirty:u,skip_bound:!1};let d=!1;if(f.ctx=o?o(n,e.props||{},((t,e,...o)=>{const r=o.length?o[0]:e;return f.ctx&&l(f.ctx[t],f.ctx[t]=r)&&(!f.skip_bound&&f.bound[t]&&f.bound[t](r),d&&ht(n,t)),e})):[],f.update(),d=!0,s(f.before_update),f.fragment=!!i&&i(f.ctx),e.target){if(e.hydrate){const t=function(t){return Array.from(t.childNodes)}(e.target);f.fragment&&f.fragment.l(t),t.forEach(v)}else f.fragment&&f.fragment.c();e.intro&&st(n.$$.fragment),mt(n,e.target,e.anchor),K()}B(a)}class vt{$destroy(){gt(this,1),this.$destroy=t}$on(t,n){const e=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return e.push(n),()=>{const t=e.indexOf(n);-1!==t&&e.splice(t,1)}}$set(t){var n;this.$$set&&(n=t,0!==Object.keys(n).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function bt(t){const n=t-1;return n*n*n+1}function _t(t){return--t*t*t*t*t+1}
/*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */function wt(t,{delay:e=0,duration:o=400,easing:r=n}={}){const s=+getComputedStyle(t).opacity;return{delay:e,duration:o,easing:r,css:t=>"opacity: "+t*s}}function xt(t,{delay:n=0,duration:e=400,easing:o=bt,x:r=0,y:s=0,opacity:i=0}={}){const l=getComputedStyle(t),c=+l.opacity,u="none"===l.transform?"":l.transform,a=c*(1-i);return{delay:n,duration:e,easing:o,css:(t,n)=>`\n\t\t\ttransform: ${u} translate(${(1-t)*r}px, ${(1-t)*s}px);\n\t\t\topacity: ${c-a*n}`}}const Et=[];function Ct(n,e=t){let o;const r=[];function s(t){if(l(n,t)&&(n=t,o)){const t=!Et.length;for(let t=0;t<r.length;t+=1){const e=r[t];e[1](),Et.push(e,n)}if(t){for(let t=0;t<Et.length;t+=2)Et[t][0](Et[t+1]);Et.length=0}}}return{set:s,update:function(t){s(t(n))},subscribe:function(i,l=t){const c=[i,l];return r.push(c),1===r.length&&(o=e(s)||t),i(n),()=>{const t=r.indexOf(c);-1!==t&&r.splice(t,1),0===r.length&&(o(),o=null)}}}}function kt(n,e,o){const r=!Array.isArray(n),l=r?[n]:n,u=e.length<2;return{subscribe:Ct(o,(n=>{let o=!1;const a=[];let f=0,d=t;const $=()=>{if(f)return;d();const o=e(r?a[0]:a,n);u?n(o):d=i(o)?o:t},p=l.map(((t,n)=>c(t,(t=>{a[n]=t,f&=~(1<<n),o&&$()}),(()=>{f|=1<<n}))));return o=!0,$(),function(){s(p),d()}})).subscribe}}var Ot;!function(t){t.LOBBY="LOBBY",t.PLAYING="PLAYING",t.VOTING="VOTING",t.FINISHED_VOTING="FINISHED_VOTING"}(Ot||(Ot={}));const Rt=Ct([]),It=Ct(""),Tt=Ct(0),Mt=Ct(0),Vt=Ct(!1),St=Ct("init"),Lt=Ct("init"),Nt=Ct([]),Gt=Ct(""),At=Ct(!1),Wt=Ct([]),Bt=Ct({turn:0,result:"DRAW"}),Ht=Ct([]),Pt=kt([Ht,It],(([t,n])=>-1!==t.indexOf(n))),Dt=kt([Wt,It],(([t,n])=>-1!==t.indexOf(n))),Ut=kt([Wt,Rt],(([t,n])=>n.filter((n=>-1===t.indexOf(n))))),jt=kt(Nt,(t=>new Set(t.reduce(((t,n)=>t.concat(n[1])),[]))));console.log('{"env":{"VERCEL":"1","VERCEL_ENV":"development","VERCEL_URL":"","VERCEL_GIT_PROVIDER":"","VERCEL_GIT_REPO_SLUG":"","VERCEL_GIT_REPO_OWNER":"","VERCEL_GIT_REPO_ID":"","VERCEL_GIT_COMMIT_REF":"","VERCEL_GIT_COMMIT_SHA":"","VERCEL_GIT_COMMIT_MESSAGE":"","VERCEL_GIT_COMMIT_AUTHOR_LOGIN":"","VERCEL_GIT_COMMIT_AUTHOR_NAME":"","API_URL":"wss://b455891f6f6b.ngrok.io"}} + wss://b455891f6f6b.ngrok.io');const qt=new WebSocket("ws://localhost:3000");qt.addEventListener("open",(()=>Vt.set(!0))),qt.addEventListener("message",(function(t){const n=JSON.parse(t.data);if("player"===n.topic){if("update"===n.subtopic){!function(t){Rt.set(t.data)}(n)}}else if("settings"===n.topic){!function(t){const n=t.data;Tt.set(n.underCoverCount),Mt.set(n.mrWhiteCount)}(n)}else if("game"===n.topic){if("word"===n.subtopic){const t=n;St.set(t.data),Lt.set("started")}else if("update"===n.subtopic){const t=n.data;Nt.set(t.playerToWords),Gt.set(t.player),t.state===Ot.VOTING&&(console.log(`Switching to voting mode!\n        voteEnded: ${u(At)},\n        hasVoted: ${u(Pt)},\n        playersWhoVoted: ${u(Ht)}\n        `),Lt.set("voting"))}}else if("vote"===n.topic)if("update"===n.subtopic){const t=n;console.log(`Updating playersWhoVoted ${u(Ht)}`),console.log(`hasVoted ${u(Pt)}`),Ht.set(t.data.playersWhoVoted),console.log(`Updated playersWhoVoted ${u(Ht)}`),console.log(`hasVoted ${u(Pt)}`),t.data.state===Ot.FINISHED_VOTING&&Ft({topic:"vote",subtopic:"result"})}else if("result"===n.subtopic){const t=n;Bt.set(t.data),At.set(!0)}}));const Ft=t=>{u(Vt)&&qt.send(JSON.stringify(t))},[Yt,zt]=function(t){var{fallback:n}=t,o=function(t,n){var e={};for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&n.indexOf(o)<0&&(e[o]=t[o]);if(null!=t&&"function"==typeof Object.getOwnPropertySymbols){var r=0;for(o=Object.getOwnPropertySymbols(t);r<o.length;r++)n.indexOf(o[r])<0&&Object.prototype.propertyIsEnumerable.call(t,o[r])&&(e[o[r]]=t[o[r]])}return e}(t,["fallback"]);const r=new Map,s=new Map;function l(t,r,s){return(l,c)=>(t.set(c.key,{rect:l.getBoundingClientRect()}),()=>{if(r.has(c.key)){const{rect:t}=r.get(c.key);return r.delete(c.key),function(t,n,r){const{delay:s=0,duration:l=(t=>30*Math.sqrt(t)),easing:c=bt}=e(e({},o),r),u=n.getBoundingClientRect(),a=t.left-u.left,f=t.top-u.top,d=t.width/u.width,$=t.height/u.height,p=Math.sqrt(a*a+f*f),m=getComputedStyle(n),g="none"===m.transform?"":m.transform,h=+m.opacity;return{delay:s,duration:i(l)?l(p):l,easing:c,css:(t,n)=>`\n\t\t\t\topacity: ${t*h};\n\t\t\t\ttransform-origin: top left;\n\t\t\t\ttransform: ${g} translate(${n*a}px,${n*f}px) scale(${t+(1-t)*d}, ${t+(1-t)*$});\n\t\t\t`}}(t,l,c)}return t.delete(c.key),n&&n(l,c,s)})}return[l(s,r,!1),l(r,s,!0)]}({duration:t=>Math.sqrt(200*t),fallback(t){const n=getComputedStyle(t),e="none"===n.transform?"":n.transform;return{duration:600,easing:_t,css:t=>`\n        transform: ${e} scale(${t});\n        opacity: ${t}\n      `}}}),Jt=Yt,Kt=zt;function Qt(t,n,e={}){const o=getComputedStyle(t),r="none"===o.transform?"":o.transform,s=n.from.width/t.clientWidth,l=n.from.height/t.clientHeight,c=(n.from.left-n.to.left)/s,u=(n.from.top-n.to.top)/l,a=Math.sqrt(c*c+u*u),{delay:f=0,duration:d=(t=>120*Math.sqrt(t)),easing:$=bt}=e;return{delay:f,duration:i(d)?d(a):d,easing:$,css:(t,n)=>`transform: ${r} translate(${n*c}px, ${n*u}px);`}}function Xt(t,n,e){const o=t.slice();return o[2]=n[e],o}function Zt(t,n,e){const o=t.slice();return o[5]=n[e],o[7]=e,o}function tn(n,e){let o,r,s,i,l=e[5]+"",c=t;return{key:n,first:null,c(){o=_("p"),r=w(l),O(o,"class","item svelte-8e6fra"),this.first=o},m(t,n){y(t,o,n),h(o,r)},p(t,n){e=t,1&n&&l!==(l=e[5]+"")&&R(r,l)},r(){i=o.getBoundingClientRect()},f(){A(o),c()},a(){c(),c=G(o,i,Qt,{})},i(t){s||Y((()=>{s=ct(o,Kt,{key:e[5]}),s.start()}))},o:t,d(t){t&&v(o)}}}function nn(n){let e,o,r,s,i,l,c=on(n[1],n[2][0])+"",u=[],a=new Map,f=n[2][1];const d=t=>t[5];for(let t=0;t<f.length;t+=1){let e=Zt(n,f,t),o=d(e);a.set(o,u[t]=tn(o,e))}return{c(){e=_("div"),o=_("div"),r=x(),s=_("p"),s.textContent="* * *",i=x();for(let t=0;t<u.length;t+=1)u[t].c();l=x(),O(s,"class","svelte-8e6fra"),O(e,"class","card svelte-8e6fra")},m(t,n){y(t,e,n),h(e,o),o.innerHTML=c,h(e,r),h(e,s),h(e,i);for(let t=0;t<u.length;t+=1)u[t].m(e,null);h(e,l)},p(t,n){if(3&n&&c!==(c=on(t[1],t[2][0])+"")&&(o.innerHTML=c),1&n){f=t[2][1];for(let t=0;t<u.length;t+=1)u[t].r();u=$t(u,n,d,1,t,f,a,e,ft,tn,l,Zt);for(let t=0;t<u.length;t+=1)u[t].a()}},i(t){for(let t=0;t<f.length;t+=1)st(u[t])},o:t,d(t){t&&v(e);for(let t=0;t<u.length;t+=1)u[t].d()}}}function en(n){let e,o=n[0],r=[];for(let t=0;t<o.length;t+=1)r[t]=nn(Xt(n,o,t));return{c(){e=_("main");for(let t=0;t<r.length;t+=1)r[t].c();O(e,"class","svelte-8e6fra")},m(t,n){y(t,e,n);for(let t=0;t<r.length;t+=1)r[t].m(e,null)},p(t,[n]){if(3&n){let s;for(o=t[0],s=0;s<o.length;s+=1){const i=Xt(t,o,s);r[s]?(r[s].p(i,n),st(r[s],1)):(r[s]=nn(i),r[s].c(),st(r[s],1),r[s].m(e,null))}for(;s<r.length;s+=1)r[s].d(1);r.length=o.length}},i(t){for(let t=0;t<o.length;t+=1)st(r[t])},o:t,d(t){t&&v(e),b(r,t)}}}function on(t,n){return-1!==t.indexOf(n)?`<div style="color: grey;"><s>${n}</s></div>`:`<div>${n}</div>`}function rn(t,n,e){let o,r;return a(t,Nt,(t=>e(0,o=t))),a(t,Wt,(t=>e(1,r=t))),[o,r]}class sn extends vt{constructor(t){super(),yt(this,t,rn,en,l,{})}}function ln(n){let e,o,r;return{c(){e=_("main"),o=_("p"),r=w(n[0])},m(t,n){y(t,e,n),h(e,o),h(o,r)},p(t,[n]){1&n&&R(r,t[0])},i:t,o:t,d(t){t&&v(e)}}}function cn(t,n,e){let o,r,s;return a(t,Gt,(t=>e(1,r=t))),a(t,It,(t=>e(2,s=t))),t.$$.update=()=>{var n;2&t.$$.dirty&&e(0,o=s===(n=r)?"It's your turn!":`It's ${n}'s turn`)},[o,r]}class un extends vt{constructor(t){super(),yt(this,t,cn,ln,l,{})}}function an(n){let e;return{c(){e=_("main")},m(t,o){y(t,e,o),e.innerHTML=n[0]},p(t,[n]){1&n&&(e.innerHTML=t[0])},i:t,o:t,d(t){t&&v(e)}}}function fn(t,n,e){let o,r;return a(t,St,(t=>e(1,r=t))),t.$$.update=()=>{var n;2&t.$$.dirty&&e(0,o=(n=r)?"init"===n?"<p>Retrieving your word..</p>":`<p> Your word is </p>\n      <p><b>${n}</b></p>`:"<p><b>You are Mr.white!</b></p>")},[o,r]}class dn extends vt{constructor(t){super(),yt(this,t,fn,an,l,{})}}function $n(n){let e,o,r,i,l,c,u;return{c(){e=_("main"),o=_("input"),r=x(),i=_("button"),l=w("Describe"),O(o,"type","text"),O(o,"class","svelte-16ysrrr"),i.disabled=n[1],O(e,"class","svelte-16ysrrr")},m(t,s){y(t,e,s),h(e,o),I(o,n[0]),h(e,r),h(e,i),h(i,l),c||(u=[C(o,"input",n[6]),C(o,"keyup",k(n[3])),C(i,"click",n[2])],c=!0)},p(t,[n]){1&n&&o.value!==t[0]&&I(o,t[0]),2&n&&(i.disabled=t[1])},i:t,o:t,d(t){t&&v(e),c=!1,s(u)}}}function pn(t,n,e){let o,r,s,i;a(t,Gt,(t=>e(4,r=t))),a(t,It,(t=>e(5,s=t))),a(t,jt,(t=>e(7,i=t)));let l="";function c(){l.length>0&&(i.has(l)?alert(`${l} has already been used!`):Ft({topic:"game",subtopic:"add",data:l}),e(0,l=""))}return t.$$.update=()=>{48&t.$$.dirty&&e(1,o=r!==s)},[l,o,c,function(){"Enter"===event.code&&c()},r,s,function(){l=this.value,e(0,l)}]}class mn extends vt{constructor(t){super(),yt(this,t,pn,$n,l,{})}}function gn(t){const n=Ct(t);let e=t;return{state:n,transitionTo:function(t){e!==t&&(e=t,n.set(null))},onOutro:function(){n.set(e)}}}function hn(t,n,e){const o=t.slice();return o[5]=n[e],o[7]=e,o}function yn(t){let n,e,o,r,s,i,l=t[5]+"";function c(){return t[4](t[5])}return{c(){n=_("p"),e=_("button"),o=w(l),r=x(),O(e,"class","svelte-1ci3dly")},m(t,l){y(t,n,l),h(n,e),h(e,o),h(n,r),s||(i=C(e,"click",c),s=!0)},p(n,e){t=n,1&e&&l!==(l=t[5]+"")&&R(o,l)},d(t){t&&v(n),s=!1,i()}}}function vn(t,n){let e,o,r=n[5]!==n[1]&&yn(n);return{key:t,first:null,c(){e=E(),r&&r.c(),o=E(),this.first=e},m(t,n){y(t,e,n),r&&r.m(t,n),y(t,o,n)},p(t,e){(n=t)[5]!==n[1]?r?r.p(n,e):(r=yn(n),r.c(),r.m(o.parentNode,o)):r&&(r.d(1),r=null)},d(t){t&&v(e),r&&r.d(t),t&&v(o)}}}function bn(n){let e,o,r,s=[],i=new Map,l=n[0];const c=t=>t[5];for(let t=0;t<l.length;t+=1){let e=hn(n,l,t),o=c(e);i.set(o,s[t]=vn(o,e))}return{c(){e=_("main"),o=_("h2"),o.textContent="Vote against",r=x();for(let t=0;t<s.length;t+=1)s[t].c();O(o,"class","svelte-1ci3dly")},m(t,n){y(t,e,n),h(e,o),h(e,r);for(let t=0;t<s.length;t+=1)s[t].m(e,null)},p(t,[n]){7&n&&(l=t[0],s=$t(s,n,c,1,t,l,i,e,at,vn,null,hn))},i:t,o:t,d(t){t&&v(e);for(let t=0;t<s.length;t+=1)s[t].d()}}}function _n(t,n,e){let o,r,s;function i(t){Ft({topic:"vote",subtopic:"against",data:t})}a(t,Ut,(t=>e(3,r=t))),a(t,It,(t=>e(1,s=t)));return t.$$.update=()=>{8&t.$$.dirty&&e(0,o=r)},[o,s,i,r,t=>i(t)]}class wn extends vt{constructor(t){super(),yt(this,t,_n,bn,l,{})}}function xn(t,n,e){const o=t.slice();return o[2]=n[e],o[4]=e,o}function En(n,e){let o,r,s,i,l,c,u=`${e[2]} `,a=t;return{key:n,first:null,c(){o=_("div"),r=w(u),O(o,"class","item svelte-194m0yb"),this.first=o},m(t,n){y(t,o,n),h(o,r),c=!0},p(t,n){e=t,(!c||1&n)&&u!==(u=`${e[2]} `)&&R(r,u)},r(){l=o.getBoundingClientRect()},f(){A(o),a(),W(o,l)},a(){a(),a=G(o,l,Qt,{})},i(t){c||(Y((()=>{i&&i.end(1),s||(s=ct(o,Kt,{key:e[2]})),s.start()})),c=!0)},o(t){s&&s.invalidate(),i=ut(o,Jt,{key:e[2]}),c=!1},d(t){t&&v(o),t&&i&&i.end()}}}function Cn(t){let n,e,o,r,s,i,l,c=[],u=new Map,a=t[0];const f=t=>t[2];for(let n=0;n<a.length;n+=1){let e=xn(t,a,n),o=f(e);u.set(o,c[n]=En(o,e))}return{c(){n=_("main"),e=_("h2"),o=w(t[1]),r=x(),s=_("br"),i=x();for(let t=0;t<c.length;t+=1)c[t].c();O(e,"class","svelte-194m0yb"),O(n,"class","svelte-194m0yb")},m(t,u){y(t,n,u),h(n,e),h(e,o),h(n,r),h(n,s),h(n,i);for(let t=0;t<c.length;t+=1)c[t].m(n,null);l=!0},p(t,[e]){if((!l||2&e)&&R(o,t[1]),1&e){a=t[0],ot();for(let t=0;t<c.length;t+=1)c[t].r();c=$t(c,e,f,1,t,a,u,n,dt,En,null,xn);for(let t=0;t<c.length;t+=1)c[t].a();rt()}},i(t){if(!l){for(let t=0;t<a.length;t+=1)st(c[t]);l=!0}},o(t){for(let t=0;t<c.length;t+=1)it(c[t]);l=!1},d(t){t&&v(n);for(let t=0;t<c.length;t+=1)c[t].d()}}}function kn(t,n,e){let o,r;return a(t,Ht,(t=>e(0,r=t))),t.$$.update=()=>{1&t.$$.dirty&&e(1,o=r.length>0?"Has voted: ":"Nobody has voted yet 🤷‍♂️")},[r,o]}class On extends vt{constructor(t){super(),yt(this,t,kn,Cn,l,{})}}function Rn(n){let e;return{c(){e=_("h2"),e.textContent="Waiting for vote completion..",O(e,"class","svelte-ydyzfp")},m(t,n){y(t,e,n)},p:t,i:t,o:t,d(t){t&&v(e)}}}class In extends vt{constructor(t){super(),yt(this,t,null,Rn,l,{})}}function Tn(t,n,e){const o=t.slice();return o[7]=n[e],o}function Mn(t){let n,e,o=`${t[7][0]}: ${t[7][1]}`;return{c(){n=_("p"),e=w(o)},m(t,o){y(t,n,o),h(n,e)},p(t,n){1&n&&o!==(o=`${t[7][0]}: ${t[7][1]}`)&&R(e,o)},d(t){t&&v(n)}}}function Vn(n){let e,o,r,s,i,l,c,u,a,f,d,$,p,m=n[0],g=[];for(let t=0;t<m.length;t+=1)g[t]=Mn(Tn(n,m,t));return{c(){e=_("main"),o=_("h2"),o.textContent="Vote result",r=x();for(let t=0;t<g.length;t+=1)g[t].c();s=x(),i=_("h3"),l=w(n[1]),c=x(),u=_("br"),a=x(),f=_("button"),d=w(n[2]),O(o,"class","svelte-dsn2ke"),O(i,"class","svelte-dsn2ke")},m(t,m){y(t,e,m),h(e,o),h(e,r);for(let t=0;t<g.length;t+=1)g[t].m(e,null);h(e,s),h(e,i),h(i,l),h(e,c),h(e,u),h(e,a),h(e,f),h(f,d),$||(p=C(f,"click",n[3]),$=!0)},p(t,[n]){if(1&n){let o;for(m=t[0],o=0;o<m.length;o+=1){const r=Tn(t,m,o);g[o]?g[o].p(r,n):(g[o]=Mn(r),g[o].c(),g[o].m(e,s))}for(;o<g.length;o+=1)g[o].d(1);g.length=m.length}2&n&&R(l,t[1]),4&n&&R(d,t[2])},i:t,o:t,d(t){t&&v(e),b(g,t),$=!1,p()}}}function Sn(t,n,e){let o,r,s,i,l,c;return a(t,Bt,(t=>e(5,l=t))),a(t,Wt,(t=>e(6,c=t))),H((()=>{Ht.set([])})),t.$$.update=()=>{32&t.$$.dirty&&e(4,o="DRAW"===l.result),32&t.$$.dirty&&e(0,r=l.voteDetails),48&t.$$.dirty&&e(1,s=o?"It is a draw! 🙃":`${l.playerOut} has been voted out! ☠️`),16&t.$$.dirty&&e(2,i=o?"Vote again!":"Next turn")},[r,s,i,function(){o?(At.set(!1),Lt.set("voting")):(Ft({topic:"game",subtopic:"update"}),Wt.set([...c,l.playerOut]),Lt.set("started"),At.set(!1))},o,l]}class Ln extends vt{constructor(t){super(),yt(this,t,Sn,Vn,l,{})}}function Nn(n){let e,o,r,s,i,l,c,u,a,f,d;return o=new wn({}),s=new On({}),l=new sn({}),{c(){e=_("div"),pt(o.$$.fragment),r=x(),pt(s.$$.fragment),i=x(),pt(l.$$.fragment)},m(t,c){y(t,e,c),mt(o,e,null),h(e,r),mt(s,e,null),h(e,i),mt(l,e,null),a=!0,f||(d=C(e,"outroend",n[1]),f=!0)},p:t,i(t){a||(st(o.$$.fragment,t),st(s.$$.fragment,t),st(l.$$.fragment,t),Y((()=>{u&&u.end(1),c||(c=ct(e,wt,{})),c.start()})),a=!0)},o(t){it(o.$$.fragment,t),it(s.$$.fragment,t),it(l.$$.fragment,t),c&&c.invalidate(),u=ut(e,wt,{}),a=!1},d(t){t&&v(e),gt(o),gt(s),gt(l),t&&u&&u.end(),f=!1,d()}}}function Gn(n){let e,o,r,s,i,l,c,u,a;return o=new In({}),s=new On({}),{c(){e=_("div"),pt(o.$$.fragment),r=x(),pt(s.$$.fragment)},m(t,i){y(t,e,i),mt(o,e,null),h(e,r),mt(s,e,null),c=!0,u||(a=C(e,"outroend",n[1]),u=!0)},p:t,i(t){c||(st(o.$$.fragment,t),st(s.$$.fragment,t),Y((()=>{l&&l.end(1),i||(i=ct(e,wt,{})),i.start()})),c=!0)},o(t){it(o.$$.fragment,t),it(s.$$.fragment,t),i&&i.invalidate(),l=ut(e,wt,{}),c=!1},d(t){t&&v(e),gt(o),gt(s),t&&l&&l.end(),u=!1,a()}}}function An(n){let e,o,r,s,i,l,c;return o=new Ln({}),{c(){e=_("div"),pt(o.$$.fragment)},m(t,r){y(t,e,r),mt(o,e,null),i=!0,l||(c=C(e,"outroend",n[1]),l=!0)},p:t,i(t){i||(st(o.$$.fragment,t),Y((()=>{s&&s.end(1),r||(r=ct(e,wt,{})),r.start()})),i=!0)},o(t){it(o.$$.fragment,t),r&&r.invalidate(),s=ut(e,wt,{}),i=!1},d(t){t&&v(e),gt(o),t&&s&&s.end(),l=!1,c()}}}function Wn(t){let n,e,o,r,s="init"===t[0]&&Nn(t),i="voted"===t[0]&&Gn(t),l="result"===t[0]&&An(t);return{c(){n=_("main"),s&&s.c(),e=x(),i&&i.c(),o=x(),l&&l.c()},m(t,c){y(t,n,c),s&&s.m(n,null),h(n,e),i&&i.m(n,null),h(n,o),l&&l.m(n,null),r=!0},p(t,[r]){"init"===t[0]?s?(s.p(t,r),1&r&&st(s,1)):(s=Nn(t),s.c(),st(s,1),s.m(n,e)):s&&(ot(),it(s,1,1,(()=>{s=null})),rt()),"voted"===t[0]?i?(i.p(t,r),1&r&&st(i,1)):(i=Gn(t),i.c(),st(i,1),i.m(n,o)):i&&(ot(),it(i,1,1,(()=>{i=null})),rt()),"result"===t[0]?l?(l.p(t,r),1&r&&st(l,1)):(l=An(t),l.c(),st(l,1),l.m(n,null)):l&&(ot(),it(l,1,1,(()=>{l=null})),rt())},i(t){r||(st(s),st(i),st(l),r=!0)},o(t){it(s),it(i),it(l),r=!1},d(t){t&&v(n),s&&s.d(),i&&i.d(),l&&l.d()}}}function Bn(t,n,e){let o,r,s,i;a(t,Pt,(t=>e(3,o=t))),a(t,At,(t=>e(4,r=t))),a(t,Ht,(t=>e(5,s=t)));const{onOutro:l,transitionTo:c,state:u}=gn("init");return a(t,u,(t=>e(0,i=t))),t.$$.update=()=>{56&t.$$.dirty&&o&&!r&&(console.log(`$hasVoted: ${o}, voteEnded: ${r}.\n    $playersWhoVoted: ${s}`),console.log("has voted!!"),c("voted")),16&t.$$.dirty&&r&&(console.log("Showing result!!"),c("result")),24&t.$$.dirty&&(r||o||(console.log("Vote init!!"),c("init")))},[i,l,u,o,r,s]}class Hn extends vt{constructor(t){super(),yt(this,t,Bn,Wn,l,{})}}function Pn(n){let e;return{c(){e=_("h2"),e.textContent="Waiting for game to complete..",O(e,"class","svelte-dk8aud")},m(t,n){y(t,e,n)},p:t,i:t,o:t,d(t){t&&v(e)}}}class Dn extends vt{constructor(t){super(),yt(this,t,null,Pn,l,{})}}function Un(t){let n,e,o,r,s,i,l,c,u,a,f,d;const $=[qn,jn],p=[];function m(t,n){return t[1]?0:1}return e=m(t),o=p[e]=$[e](t),l=new sn({}),{c(){n=_("div"),o.c(),r=x(),s=_("br"),i=x(),pt(l.$$.fragment)},m(o,c){y(o,n,c),p[e].m(n,null),h(n,r),h(n,s),h(n,i),mt(l,n,null),a=!0,f||(d=C(n,"outroend",t[2]),f=!0)},p(t,s){let i=e;e=m(t),e!==i&&(ot(),it(p[i],1,1,(()=>{p[i]=null})),rt(),o=p[e],o||(o=p[e]=$[e](t),o.c()),st(o,1),o.m(n,r))},i(t){a||(st(o),st(l.$$.fragment,t),Y((()=>{u&&u.end(1),c||(c=ct(n,xt,{y:500,duration:300})),c.start()})),a=!0)},o(t){it(o),it(l.$$.fragment,t),c&&c.invalidate(),u=ut(n,xt,{y:500,duration:300}),a=!1},d(t){t&&v(n),p[e].d(),gt(l),t&&u&&u.end(),f=!1,d()}}}function jn(t){let n,e,o,r,s,i;return n=new dn({}),o=new un({}),s=new mn({}),{c(){pt(n.$$.fragment),e=x(),pt(o.$$.fragment),r=x(),pt(s.$$.fragment)},m(t,l){mt(n,t,l),y(t,e,l),mt(o,t,l),y(t,r,l),mt(s,t,l),i=!0},i(t){i||(st(n.$$.fragment,t),st(o.$$.fragment,t),st(s.$$.fragment,t),i=!0)},o(t){it(n.$$.fragment,t),it(o.$$.fragment,t),it(s.$$.fragment,t),i=!1},d(t){gt(n,t),t&&v(e),gt(o,t),t&&v(r),gt(s,t)}}}function qn(t){let n,e,o,r,s,i;return n=new Dn({}),o=new dn({}),s=new un({}),{c(){pt(n.$$.fragment),e=x(),pt(o.$$.fragment),r=x(),pt(s.$$.fragment)},m(t,l){mt(n,t,l),y(t,e,l),mt(o,t,l),y(t,r,l),mt(s,t,l),i=!0},i(t){i||(st(n.$$.fragment,t),st(o.$$.fragment,t),st(s.$$.fragment,t),i=!0)},o(t){it(n.$$.fragment,t),it(o.$$.fragment,t),it(s.$$.fragment,t),i=!1},d(t){gt(n,t),t&&v(e),gt(o,t),t&&v(r),gt(s,t)}}}function Fn(n){let e,o,r,s,i,l,c;return o=new Hn({}),{c(){e=_("div"),pt(o.$$.fragment)},m(t,r){y(t,e,r),mt(o,e,null),i=!0,l||(c=C(e,"outroend",n[2]),l=!0)},p:t,i(t){i||(st(o.$$.fragment,t),Y((()=>{s&&s.end(1),r||(r=ct(e,xt,{y:500,duration:300})),r.start()})),i=!0)},o(t){it(o.$$.fragment,t),r&&r.invalidate(),s=ut(e,xt,{y:500,duration:300}),i=!1},d(t){t&&v(e),gt(o),t&&s&&s.end(),l=!1,c()}}}function Yn(t){let n,e,o,r="started"===t[0]&&Un(t),s="voting"===t[0]&&Fn(t);return{c(){n=_("main"),r&&r.c(),e=x(),s&&s.c()},m(t,i){y(t,n,i),r&&r.m(n,null),h(n,e),s&&s.m(n,null),o=!0},p(t,[o]){"started"===t[0]?r?(r.p(t,o),1&o&&st(r,1)):(r=Un(t),r.c(),st(r,1),r.m(n,e)):r&&(ot(),it(r,1,1,(()=>{r=null})),rt()),"voting"===t[0]?s?(s.p(t,o),1&o&&st(s,1)):(s=Fn(t),s.c(),st(s,1),s.m(n,null)):s&&(ot(),it(s,1,1,(()=>{s=null})),rt())},i(t){o||(st(r),st(s),o=!0)},o(t){it(r),it(s),o=!1},d(t){t&&v(n),r&&r.d(),s&&s.d()}}}function zn(t,n,e){let o,r,s;a(t,Lt,(t=>e(4,o=t))),a(t,Dt,(t=>e(1,s=t)));const{onOutro:i,transitionTo:l,state:c}=gn("started");return a(t,c,(t=>e(0,r=t))),t.$$.update=()=>{16&t.$$.dirty&&("voting"===o||"started"===o)&&l(o)},[r,s,i,c,o]}class Jn extends vt{constructor(t){super(),yt(this,t,zn,Yn,l,{})}}function Kn(n){let e,o,r,i,l,c,u,a,f,d,$,p,m,g;return{c(){e=_("main"),o=_("h1"),o.textContent="Undercover",r=x(),i=_("h2"),i.textContent="Input your name",l=x(),c=_("br"),u=x(),a=_("input"),f=x(),d=_("br"),$=x(),p=_("button"),p.textContent="OK",O(o,"class","svelte-4w4a9t"),O(i,"class","svelte-4w4a9t"),O(a,"type","text"),O(a,"size","15"),O(a,"class","svelte-4w4a9t"),O(p,"class","svelte-4w4a9t")},m(t,s){y(t,e,s),h(e,o),h(e,r),h(e,i),h(e,l),h(e,c),h(e,u),h(e,a),I(a,n[0]),h(e,f),h(e,d),h(e,$),h(e,p),m||(g=[C(a,"input",n[5]),C(a,"keyup",k(n[2])),C(p,"click",n[1])],m=!0)},p(t,[n]){1&n&&a.value!==t[0]&&I(a,t[0])},i:t,o:t,d(t){t&&v(e),m=!1,s(g)}}}function Qn(t,n,e){let o,r,s;a(t,Rt,(t=>e(3,r=t))),a(t,Vt,(t=>e(4,s=t)));let i="";function l(){i.length>0&&(-1===o.indexOf(i)?(Ft(function(t){return{topic:"player",subtopic:"add",data:t}}(i)),It.set(i)):alert("This name has already been picked!"))}return t.$$.update=()=>{8&t.$$.dirty&&(o=r),16&t.$$.dirty&&s&&Ft({topic:"player",subtopic:"get"})},[i,l,function(){"Enter"===event.code&&l()},r,s,function(){i=this.value,e(0,i)}]}class Xn extends vt{constructor(t){super(),yt(this,t,Qn,Kn,l,{})}}function Zn(t,n,e){const o=t.slice();return o[3]=n[e],o[5]=e,o}function te(n,e){let o,r,s,i,l,c,u,a=ee(e[1],e[3])+"",f=t;return{key:n,first:null,c(){o=_("p"),s=x(),r=new T(s),this.first=o},m(t,n){y(t,o,n),r.m(a,o),h(o,s),u=!0},p(t,n){e=t,(!u||3&n)&&a!==(a=ee(e[1],e[3])+"")&&r.p(a)},r(){c=o.getBoundingClientRect()},f(){A(o),f(),W(o,c)},a(){f(),f=G(o,c,Qt,{})},i(t){u||(Y((()=>{l&&l.end(1),i||(i=ct(o,Kt,{key:e[1]})),i.start()})),u=!0)},o(t){i&&i.invalidate(),l=ut(o,Jt,{key:e[1]}),u=!1},d(t){t&&v(o),t&&l&&l.end()}}}function ne(t){let n,e,o,r,s=[],i=new Map,l=t[0];const c=t=>t[3];for(let n=0;n<l.length;n+=1){let e=Zn(t,l,n),o=c(e);i.set(o,s[n]=te(o,e))}return{c(){n=_("main"),e=_("h2"),e.textContent="Connected players",o=x();for(let t=0;t<s.length;t+=1)s[t].c();O(e,"class","svelte-dk8aud")},m(t,i){y(t,n,i),h(n,e),h(n,o);for(let t=0;t<s.length;t+=1)s[t].m(n,null);r=!0},p(t,[e]){if(3&e){l=t[0],ot();for(let t=0;t<s.length;t+=1)s[t].r();s=$t(s,e,c,1,t,l,i,n,dt,te,null,Zn);for(let t=0;t<s.length;t+=1)s[t].a();rt()}},i(t){if(!r){for(let t=0;t<l.length;t+=1)st(s[t]);r=!0}},o(t){for(let t=0;t<s.length;t+=1)it(s[t]);r=!1},d(t){t&&v(n);for(let t=0;t<s.length;t+=1)s[t].d()}}}function ee(t,n){return t===n?`<b> ${n} <b>`:n}function oe(t,n,e){let o,r,s;return a(t,Rt,(t=>e(2,r=t))),a(t,It,(t=>e(1,s=t))),t.$$.update=()=>{4&t.$$.dirty&&e(0,o=r)},[o,s,r]}class re extends vt{constructor(t){super(),yt(this,t,oe,ne,l,{})}}function se(n){let e,o,r,i,l,c,u,a,f,d,$,p,m,g,b,E,k,I,T,M,V,S;return{c(){e=_("main"),o=_("h2"),o.textContent="Settings",r=x(),i=_("p"),i.textContent="Undercover",l=x(),c=_("button"),c.textContent="<",u=x(),a=_("div"),f=w(n[0]),d=x(),$=_("button"),$.textContent=">",p=x(),m=_("p"),m.textContent="Mr White",g=x(),b=_("button"),b.textContent="<",E=x(),k=_("div"),I=w(n[1]),T=x(),M=_("button"),M.textContent=">",O(o,"class","svelte-15h6cuf"),O(c,"class","svelte-15h6cuf"),O(a,"class","svelte-15h6cuf"),O($,"class","svelte-15h6cuf"),O(b,"class","svelte-15h6cuf"),O(k,"class","svelte-15h6cuf"),O(M,"class","svelte-15h6cuf"),O(e,"class","svelte-15h6cuf")},m(t,s){y(t,e,s),h(e,o),h(e,r),h(e,i),h(e,l),h(e,c),h(e,u),h(e,a),h(a,f),h(e,d),h(e,$),h(e,p),h(e,m),h(e,g),h(e,b),h(e,E),h(e,k),h(k,I),h(e,T),h(e,M),V||(S=[C(c,"click",n[3]),C($,"click",n[4]),C(b,"click",n[5]),C(M,"click",n[6])],V=!0)},p(t,[n]){1&n&&R(f,t[0]),2&n&&R(I,t[1])},i:t,o:t,d(t){t&&v(e),V=!1,s(S)}}}function ie(t,n,e){let o,r;function s(t,n){Ft({topic:"settings",subtopic:t,data:n})}a(t,Tt,(t=>e(0,o=t))),a(t,Mt,(t=>e(1,r=t))),H((()=>{Ft({topic:"settings",subtopic:"get"})}));return[o,r,s,()=>s("undercover","decrement"),()=>s("undercover","increment"),()=>s("white","decrement"),()=>s("white","increment")]}class le extends vt{constructor(t){super(),yt(this,t,ie,se,l,{})}}function ce(n){let e,o,r,s;return{c(){e=_("button"),o=w("Start"),e.disabled=n[0]},m(t,i){y(t,e,i),h(e,o),r||(s=C(e,"click",n[1]),r=!0)},p(t,[n]){1&n&&(e.disabled=t[0])},i:t,o:t,d(t){t&&v(e),r=!1,s()}}}function ue(t,n,e){let o,r,s,i,l;return a(t,Rt,(t=>e(3,s=t))),a(t,Tt,(t=>e(4,i=t))),a(t,Mt,(t=>e(5,l=t))),t.$$.update=()=>{8&t.$$.dirty&&e(2,o=s.length),52&t.$$.dirty&&e(0,r=!function(t,n,e){let o=t+n;return!(e<3||0===o||o>=e)&&e-o>=2}(i,l,o))},[r,function(){Ft({topic:"game",subtopic:"start"})},o,s,i,l]}class ae extends vt{constructor(t){super(),yt(this,t,ue,ce,l,{})}}function fe(n){let e,o,r,s,i,l;return o=new Xn({}),{c(){e=_("div"),pt(o.$$.fragment)},m(t,r){y(t,e,r),mt(o,e,null),s=!0,i||(l=C(e,"outroend",n[2]),i=!0)},p:t,i(t){s||(st(o.$$.fragment,t),r&&r.end(1),s=!0)},o(t){it(o.$$.fragment,t),r=ut(e,xt,{y:500,duration:300}),s=!1},d(t){t&&v(e),gt(o),t&&r&&r.end(),i=!1,l()}}}function de(n){let e,o,r,s,i,l,c,u,a,f,d,$,p,m;return o=new le({}),l=new ae({}),f=new re({}),{c(){e=_("div"),pt(o.$$.fragment),r=x(),s=_("br"),i=x(),pt(l.$$.fragment),c=x(),u=_("br"),a=x(),pt(f.$$.fragment)},m(t,d){y(t,e,d),mt(o,e,null),h(e,r),h(e,s),h(e,i),mt(l,e,null),h(e,c),h(e,u),h(e,a),mt(f,e,null),$=!0,p||(m=C(e,"outroend",n[2]),p=!0)},p:t,i(t){$||(st(o.$$.fragment,t),st(l.$$.fragment,t),st(f.$$.fragment,t),d||Y((()=>{d=ct(e,xt,{y:500,duration:500}),d.start()})),$=!0)},o(t){it(o.$$.fragment,t),it(l.$$.fragment,t),it(f.$$.fragment,t),$=!1},d(t){t&&v(e),gt(o),gt(l),gt(f),p=!1,m()}}}function $e(t){let n,e,o,r="init"===t[1]&&fe(t),s=t[1]===t[0]&&de(t);return{c(){n=_("main"),r&&r.c(),e=x(),s&&s.c()},m(t,i){y(t,n,i),r&&r.m(n,null),h(n,e),s&&s.m(n,null),o=!0},p(t,[o]){"init"===t[1]?r?(r.p(t,o),2&o&&st(r,1)):(r=fe(t),r.c(),st(r,1),r.m(n,e)):r&&(ot(),it(r,1,1,(()=>{r=null})),rt()),t[1]===t[0]?s?(s.p(t,o),3&o&&st(s,1)):(s=de(t),s.c(),st(s,1),s.m(n,null)):s&&(ot(),it(s,1,1,(()=>{s=null})),rt())},i(t){o||(st(r),st(s),o=!0)},o(t){it(r),it(s),o=!1},d(t){t&&v(n),r&&r.d(),s&&s.d()}}}function pe(t,n,e){let o,r;a(t,It,(t=>e(0,o=t)));const{onOutro:s,transitionTo:i,state:l}=gn("init");return a(t,l,(t=>e(1,r=t))),t.$$.update=()=>{1&t.$$.dirty&&o&&i(o)},[o,r,s,l]}class me extends vt{constructor(t){super(),yt(this,t,pe,$e,l,{})}}function ge(n){let e,o,r,s,i,l;return o=new me({}),{c(){e=_("div"),pt(o.$$.fragment)},m(t,r){y(t,e,r),mt(o,e,null),s=!0,i||(l=C(e,"outroend",n[1]),i=!0)},p:t,i(t){s||(st(o.$$.fragment,t),r&&r.end(1),s=!0)},o(t){it(o.$$.fragment,t),r=ut(e,xt,{y:500,duration:300}),s=!1},d(t){t&&v(e),gt(o),t&&r&&r.end(),i=!1,l()}}}function he(n){let e,o,r,s,i,l;return o=new Jn({}),{c(){e=_("div"),pt(o.$$.fragment)},m(t,r){y(t,e,r),mt(o,e,null),s=!0,i||(l=C(e,"outroend",n[1]),i=!0)},p:t,i(t){s||(st(o.$$.fragment,t),r||Y((()=>{r=ct(e,xt,{y:500,duration:500}),r.start()})),s=!0)},o(t){it(o.$$.fragment,t),s=!1},d(t){t&&v(e),gt(o),i=!1,l()}}}function ye(t){let n,e,o,r="init"===t[0]&&ge(t),s="started"===t[0]&&he(t);return{c(){n=_("main"),r&&r.c(),e=x(),s&&s.c(),O(n,"class","svelte-yg16s0")},m(t,i){y(t,n,i),r&&r.m(n,null),h(n,e),s&&s.m(n,null),o=!0},p(t,[o]){"init"===t[0]?r?(r.p(t,o),1&o&&st(r,1)):(r=ge(t),r.c(),st(r,1),r.m(n,e)):r&&(ot(),it(r,1,1,(()=>{r=null})),rt()),"started"===t[0]?s?(s.p(t,o),1&o&&st(s,1)):(s=he(t),s.c(),st(s,1),s.m(n,null)):s&&(ot(),it(s,1,1,(()=>{s=null})),rt())},i(t){o||(st(r),st(s),o=!0)},o(t){it(r),it(s),o=!1},d(t){t&&v(n),r&&r.d(),s&&s.d()}}}function ve(t,n,e){let o,r;a(t,Lt,(t=>e(3,o=t)));const{onOutro:s,transitionTo:i,state:l}=gn("init");return a(t,l,(t=>e(0,r=t))),t.$$.update=()=>{8&t.$$.dirty&&"started"===o&&i("started")},[r,s,l,o]}return new class extends vt{constructor(t){super(),yt(this,t,ve,ye,l,{})}}({target:document.body})}();
//# sourceMappingURL=bundle.js.map
