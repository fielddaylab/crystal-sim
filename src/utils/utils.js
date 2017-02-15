/*
*
* DISCLAIMER: Javascript is terrible, and these utils are NOT intended for use in the general case
* for JS and all of its terribleness. These functions operate only on the most naively constructed of
* objects. If you're trying to do something fancy and these don't work for you, please take the
* rest of the day off to question your life choices. I wish you the best of luck.
*
*/

//math (raw)
function mapVal(from_min, from_max, to_min, to_max, v) { return ((v-from_min)/(from_max-from_min))*(to_max-to_min)+to_min; }
function clamp(a,b,v) { if(v < a) return a; if(v > b) return b; return v; }
function eq(a,b,e) { return (a < b+e && a > b-e); }
function lerp(s,e,t) { return s+((e-s)*t); }
function invlerp(s,e,v) { return (v-s)/(e-s); }
function clerp(s,e,t)
{
  while(s < 0) s += Math.PI*2;
  while(e < 0) e += Math.PI*2;

       if(e > s && e-s > s-(e-Math.PI*2)) e -= Math.PI*2;
  else if(s > e && s-e > (e+Math.PI*2)-s) e += Math.PI*2;

  return lerp(s,e,t)%(Math.PI*2);
}
function cdist(a,b)
{
  while(a < 0) a += Math.PI*2;
  while(b < 0) b += Math.PI*2;
  var dist = Math.abs(a-b);
  if(dist > Math.PI) dist = Math.PI*2-dist;

  return dist;
}
function distsqr(ax,ay,bx,by)
{
  var x = bx-ax;
  var y = by-ay;
  return x*x+y*y;
}
function dist(ax,ay,bx,by)
{
  var x = bx-ax;
  var y = by-ay;
  return Math.sqrt(x*x+y*y);
}
function randIntBelow(n) { return Math.floor(Math.random()*n); }
function randBool() { return randIntBelow(2); }
function rand0() { return (Math.random()*2)-1; }
var randR = function(s,e) { return lerp(s,e,Math.random()); }
//because the Math namespace is probably unnecessary for our purposes
var rand = Math.random;
var round = Math.round;
var floor = Math.floor;
var ceil = Math.ceil;
var abs = Math.abs;
var min = Math.min;
var max = Math.max;
var pow = Math.pow;
var sqrt = Math.sqrt;
var sin = Math.sin;
var asin = Math.asin;
var psin = function(t) { return (Math.sin(t)+1)/2; }
var cos = Math.cos;
var acos = Math.acos;
var pcos = function(t) { return (Math.cos(t)+1)/2; }
var tan = Math.tan;
var atan = Math.atan;
var atan2 = Math.atan2;
var pi = Math.PI;
var twopi = 2*pi;
var halfpi = pi/2;

var fdisp = function(f,n) //formats float for display (from 8.124512 to 8.12)
{
  if(n == undefined) n = 2;
  n = Math.pow(10,n);
  return Math.round(f*n)/n;
}

function mapPt(from,to,pt)
{
  pt.x = ((pt.x-from.x)/from.w)*to.w+to.x;
  pt.y = ((pt.y-from.y)/from.h)*to.h+to.y;
  return pt;
}
function mapRect(from,to,rect)
{
  rect.x = ((rect.x-from.x)/from.w)*to.w+to.x;
  rect.y = ((rect.y-from.y)/from.h)*to.h+to.y;
  rect.w = (rect.w/from.w)*to.w;
  rect.h = (rect.h/from.h)*to.h;
  return rect;
}

//collide (raw)
var ptWithin = function(x,y,w,h,ptx,pty) { return (ptx >= x && ptx <= x+w && pty >= y && pty <= y+h); }
var ptNear = function(x,y,r,ptx,pty) { var dx = ptx-x; var dy = pty-y; return (dx*dx+dy*dy) < r*r; }
var rectCollide = function(ax,ay,aw,wh,bx,by,bw,bh) { return ax < bx+bw && bx < ax+aw && ay < by+bh && by < ay+ah; }

var ptWithinObj = function(obj,ptx,pty)
{
  return (ptx >= obj.x && ptx <= obj.x+obj.w && pty >= obj.y && pty <= obj.y+obj.h);
}
var objWithinObj = function(obja, objb)
{
  console.log("not done!");
  return false;
}
var worldPtWithin = function(wx, wy, ww, wh, ptx, pty)
{
  return (ptx >= wx-(ww/2) && ptx <= wx+(ww/2) && pty >= wy-(wh/2) && pty <= wy+(wh/2));
}
var worldPtWithinObj = function(obj, ptx, pty)
{
  return (ptx >= obj.wx-(obj.ww/2) && ptx <= obj.wx+(obj.ww/2) && pty >= obj.wy-(obj.wh/2) && pty <= obj.wy+(obj.wh/2));
}

//conversions
var decToHex = function(dec, dig)
{
  var r = "";
  dig--;
  var mod = Math.pow(16,dig);

  var index = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];
  for(; dig >= 0; dig--)
  {
    var v = Math.floor(dec/mod);
    r += index[v];
    dec -= Math.pow(16,dig)*v;
    mod /= 16;
  }

  return r;
}

var RGB2HSL = function(rgb, hsl)
{
  var cmax = Math.max(rgb.r,rgb.g,rgb.b);
  var cmin = Math.min(rgb.r,rgb.g,rgb.b);
  var d = cmax-cmin;
  hsl.l = (cmax+cmin)/2;
  if(hsl.l < 0.5) hsl.s = (cmax-cmin)/(cmax+cmin);
  else            hsl.s = (cmax-cmin)/(2-cmax-cmin);

  if(cmax == rgb.r) hsl.h = (rgb.g-rgb.b)/(cmax-cmin);
  if(cmax == rgb.g) hsl.h = 2 + (rgb.b-rgb.r)/(cmax-cmin);
  if(cmax == rgb.b) hsl.h = 4 + (rgb.r-rgb.g)/(cmax-cmin);

  hsl.h *= 60;

  if(hsl.h < 0) hsl.h += 360;
}

var HSL2RGBHelperConvertTMPValToFinal = function(tmp_1, tmp_2, val)
{
  if(val*6 < 1) return tmp_2 + (tmp_1-tmp_2)*6*val;
  else if(val*2 < 1) return tmp_1;
  else if(val*3 < 2) return tmp_2 + (tmp_1-tmp_2)*(0.666-val)*6;
  else return tmp_2;
}
var HSL2RGB = function(hsl, rgb)
{
  var tmp_1;
  var tmp_2;
  var tmp_3;

  if(hsl.l < 0.5) tmp_1 = hsl.l * (1+hsl.s);
  else            tmp_1 = hsl.l + hsl.s - (hsl.l*hsl.s);

  tmp_2 = (2*hsl.l)-tmp_1;
  tmp_3 = hsl.h/360;

  rgb.r = tmp_3 + 0.333; while(rgb.r > 1) rgb.r -= 1; while(rgb.r < 0) rgb.r += 1;
  rgb.g = tmp_3;         while(rgb.g > 1) rgb.g -= 1; while(rgb.g < 0) rgb.g += 1;
  rgb.b = tmp_3 - 0.333; while(rgb.b > 1) rgb.b -= 1; while(rgb.b < 0) rgb.b += 1;

  rgb.r = HSL2RGBHelperConvertTMPValToFinal(tmp_1, tmp_2, rgb.r);
  rgb.g = HSL2RGBHelperConvertTMPValToFinal(tmp_1, tmp_2, rgb.g);
  rgb.b = HSL2RGBHelperConvertTMPValToFinal(tmp_1, tmp_2, rgb.b);
}

var RGB2Hex = function(rgb)
{
  return "#"+dec2Hex(Math.floor(rgb.r*255))+dec2Hex(Math.floor(rgb.g*255))+dec2Hex(Math.floor(rgb.b*255));
}
var dec2Hex = function(n)
{
  return n.toString(16);
}

var cartToPolar = function(cart,polar)
{
  polar.len = Math.sqrt((cart.x*cart.x)+(cart.y*cart.y));
  polar.dir = Math.atan2(cart.y,cart.x);
}
var polarToCart = function(polar,cart)
{
  cart.x = Math.cos(polar.dir)*polar.len;
  cart.y = Math.sin(polar.dir)*polar.len;
}

//short name- will be used often to place elements by percent, while guaranteeing integer results
var p    = function(percent, of) { return Math.floor(percent * of); }
var invp = function(      n, of) { return n/of; }
var setBox = function(obj, x,y,w,h)
{
  obj.x = x;
  obj.y = y;
  obj.w = w;
  obj.h = h;
}

//camera
var screenSpaceX = function(cam, canv, x) { return (((( x)-cam.wx)+(cam.ww/2))/cam.ww)*canv.width;  }
var screenSpaceY = function(cam, canv, y) { return ((((-y)+cam.wy)+(cam.wh/2))/cam.wh)*canv.height; }
var screenSpace = function(cam, canv, obj)
{
  //assumng xywh counterparts in world space (wx,wy,ww,wh,etc...)
  //where wx,wy is *center* of obj and cam
  //so cam.wx = 0; cam.ww = 1; would be a cam centered at the origin with visible range from -0.5 to 0.5
  //output xywh assume x,y is top left (ready to be 'blit' via canvas api)
  obj.w = (obj.ww/cam.ww)*canv.width;
  obj.h = (obj.wh/cam.wh)*canv.height;
  obj.x = (((( obj.wx-obj.ww/2)-cam.wx)+(cam.ww/2))/cam.ww)*canv.width;
  obj.y = ((((-obj.wy-obj.wh/2)+cam.wy)+(cam.wh/2))/cam.wh)*canv.height;
}
var worldSpaceX = function(cam, canv, x) { return ((x/canv.width) -0.5)* cam.ww + cam.wx; }
var worldSpaceY = function(cam, canv, y) { return ((y/canv.height)-0.5)*-cam.wh + cam.wy; }
var worldSpace = function(cam, canv, obj) //opposite of screenspace
{
  obj.wx = ((obj.x/canv.width) -0.5)* cam.ww + cam.wx;
  obj.wy = ((obj.y/canv.height)-0.5)*-cam.wh + cam.wy;
  obj.ww = (obj.w/canv.width) *cam.ww;
  obj.wh = (obj.h/canv.height)*cam.wh;
}

function vlensqr(v)
{
  return v.x*v.x+v.y*v.y;
}
function vlen(v)
{
  return Math.sqrt(v.x*v.x+v.y*v.y);
}
function vnorm(v)
{
  var lensqr = vlensqr(v);
  var len;
  if(lensqr > 0.00001)
  {
    len = sqrt(lensqr);
    v.x /= len;
    v.y /= len;
  }
}
function vmul(d,v)
{
  v.x *= d;
  v.y *= d;
}
function vdiv(d,v)
{
  v.x /= d;
  v.y /= d;
}
function tldistsqr(a,b)
{
  var x = b.x-a.x;
  var y = b.y-a.y;
  return x*x+y*y;
}
function tldist(a,b)
{
  var x = b.x-a.x;
  var y = b.y-a.y;
  return Math.sqrt(x*x+y*y);
}
function odistsqr(a,b)
{
  var x = (b.x+b.w/2)-(a.x+a.w/2);
  var y = (b.y+b.h/2)-(a.y+a.h/2);
  return x*x+y*y;
}
function odist(a,b)
{
  var x = (b.x+b.w/2)-(a.x+a.w/2);
  var y = (b.y+b.h/2)-(a.y+a.h/2);
  return Math.sqrt(x*x+y*y);
}
function wdistsqr(a,b)
{
  var x = b.wx-a.wx;
  var y = b.wy-a.wy;
  return x*x+y*y;
}
function wdist(a,b)
{
  var x = b.wx-a.wx;
  var y = b.wy-a.wy;
  return Math.sqrt(x*x+y*y);
}

var GenIcon = function(w,h)
{
  var icon = document.createElement('canvas');
  icon.width = w || 10;
  icon.height = h || 10;
  icon.context = icon.getContext('2d');
  icon.context.fillStyle = "#000000";
  icon.context.strokeStyle = "#000000";
  icon.context.textAlign = "center";

  return icon;
}


var SeededRand = function(s)
{
  var self = this;
  self.seed = s;
  self.next = function()
  {
  var x = Math.sin(self.seed++) * 10000;
  return x - Math.floor(x);
  }
}

function noop(){}
function ffunc(){return false;}
function tfunc(){return true;}

function drawArrow(canv,sx,sy,ex,ey,w)
{
  var dx = ex-sx;
  var dy = ey-sy;
  var dd = Math.sqrt(dx*dx+dy*dy);
  var ox = -dy;
  var oy = dx;
  var od = Math.sqrt(ox*ox+oy*oy);
  var ox = (ox/od)*w;
  var oy = (oy/od)*w;
  canv.context.beginPath();
  canv.context.moveTo(sx,sy);
  canv.context.lineTo(ex,ey);
  canv.context.moveTo(sx+(dx/dd*(dd-w))+ox,sy+(dy/dd*(dd-w))+oy);
  canv.context.lineTo(ex,ey);
  canv.context.lineTo(sx+(dx/dd*(dd-w))-ox,sy+(dy/dd*(dd-w))-oy);
  canv.context.stroke();
}

function drawAroundDecimal(canv,x,y,val,prepend,append)
{
  var macro = floor(val);
  var vstring = val+"";
  var micro = vstring.substring(vstring.indexOf(".")+1);
  canv.context.textAlign = "right";
  canv.context.fillText(prepend+macro+".",x,y);
  canv.context.textAlign = "left";
  canv.context.fillText(micro+append,x,y);
}

var space = function(minv,maxv,obv,nobs,obi)
{
  var w = maxv-minv;
  var pad = (w-(nobs*obv))/(nobs+1);
  return minv+pad+(obv+pad)*obi;
}

var textToLines = function(canv, font, width, text)
{
  var lines = [];
  var found = 0;
  var searched = 0;
  var tentative_search = 0;

  canv.context.save();
  canv.context.font = font;

  while(found < text.length)
  {
    searched = text.indexOf(" ",found);
    if(searched == -1) searched = text.length;
    tentative_search = text.indexOf(" ",searched+1);
    if(tentative_search == -1) tentative_search = text.length;
    while(canv.context.measureText(text.substring(found,tentative_search)).width < width && searched != text.length)
    {
      searched = tentative_search;
      tentative_search = text.indexOf(" ",searched+1);
      if(tentative_search == -1) tentative_search = text.length;
    }
    if(text.substring(searched, searched+1) == " ") searched++;
    lines.push(text.substring(found,searched));
    found = searched;
  }

  canv.context.restore();
  return lines;
}

