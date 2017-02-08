var Clicker = function(init)
{
  var default_init =
  {
    source:document.createElement('div')
  }

  var self = this;
  doMapInitDefaults(self,init,default_init);

  var evts = []
  self.attach = function() //will get auto-called at creation
  {
    if(platform == "PC")          self.source.addEventListener('mousedown', click, false);
    else if(platform == "MOBILE") self.source.addEventListener('touchstart', click, false);
  }
  self.detach = function()
  {
    if(platform == "PC")          self.source.removeEventListener('mousedown', click);
    else if(platform == "MOBILE") self.source.removeEventListener('touchstart', click);
  }

  function click(evt)
  {
    doSetPosOnEvent(evt);
    evts.push(evt);
  }
  self.filter = function(clickable)
  {
    for(var i = 0; i < evts.length; i++)
    {
      if(clicked(clickable, evts[i]))
        clickable.click(evts[i]);
    }
  }
  self.flush = function()
  {
    evts = [];
  }

  self.attach();
}

var clicked = function(clickable, evt)
{
  return ptWithinObj(clickable, evt.doX, evt.doY);
}

//example clickable- just needs x,y,w,h and click callback
var Clickable = function(args)
{
  var self = this;

  self.x = args.x ? args.x : 0;
  self.y = args.y ? args.y : 0;
  self.w = args.w ? args.w : 0;
  self.h = args.h ? args.h : 0;
  self.click = args.click ? args.click : function(){};

  //nice for debugging purposes
  self.draw = function(canv)
  {
    canv.context.strokeStyle = "#00FF00";
    canv.context.strokeRect(self.x,self.y,self.w,self.h);
  }
}

