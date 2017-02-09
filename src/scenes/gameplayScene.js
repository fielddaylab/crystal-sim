var GamePlayScene = function(game, stage)
{
  var self = this;

  var canv = stage.drawCanv;
  var canvas = canv.canvas;
  var ctx = canv.context;

  var ar = 0.5;
  var speed = 2;
  var noise = 0.2;
  var scale = 10;

  var mols = [];
  var dragging_mol = false;
  var moldrop_t = 1.1;
  var tick_t = 10;

  var clicker;
  var dragger;
  var screen_btn;

  var noise_slider = new SliderBox(10,10,200,10,0.0, 1.0,noise,function(v){ noise = v });
  var speed_slider = new SliderBox(10,30,200,10,0.0,10.0,speed,function(v){ speed = v });
  var scale_slider = new SliderBox(10,50,200,10,1.0,20.0,scale,function(v){ scale = v });

  var worldToScreenX = function(x) { return x*scale + canv.width /2; }
  var worldToScreenY = function(y) { return y*scale + canv.height/2; }
  var screenToWorldX = function(x) { return (x-canv.width /2)/scale; }
  var screenToWorldY = function(y) { return (y-canv.height/2)/scale; }

  var Atom = function(x,y)
  {
    var self = this;
    self.x = x;
    self.y = y;
  }
  var touchAtoms = function(a,b)
  {
    var x = (a.x+b.x)/2.;
    var y = (a.y+b.y)/2.;
    var toax = a.x - x;
    var toay = a.y - y;
    var lensqr = toax*toax+toay*toay;
    if(lensqr < 0.01)
    {
      a.x = x+ar;
      a.y = y;
      b.x = x-ar;
      b.y = y;
    }
    else
    {
      var len = sqrt(lensqr);
      a.x = x + (toax/len)*ar;
      a.y = y + (toay/len)*ar;
      b.x = x - (toax/len)*ar;
      b.y = y - (toay/len)*ar;
    }
  }
  var Mol = function(px,py,nx,ny)
  {
    var self = this;
    self.force_pos = new Atom(0,0);
    self.force_neg = new Atom(0,0);
    self.pos = new Atom(px,py);
    self.neg = new Atom(nx,ny);

    var dsqr = 2*ar*2*ar;
    self.shouldDrag = function(evt)
    {
      if(dragging_mol) return false;
      if(
        distsqr(self.pos.x,self.pos.y,screenToWorldX(evt.doX),screenToWorldY(evt.doY)) < dsqr ||
        distsqr(self.neg.x,self.neg.y,screenToWorldX(evt.doX),screenToWorldY(evt.doY)) < dsqr
      )
      {
        dragging_mol = self;
        return true;
      }
      return false;
    }
    self.dragStart = function(evt)
    {
      self.pos.x = screenToWorldX(evt.doX);
      self.pos.y = screenToWorldY(evt.doY);
      self.neg.x = screenToWorldX(evt.doX);
      self.neg.y = screenToWorldY(evt.doY);
    }
    self.drag = function(evt)
    {
      self.pos.x = screenToWorldX(evt.doX);
      self.pos.y = screenToWorldY(evt.doY);
      self.neg.x = screenToWorldX(evt.doX);
      self.neg.y = screenToWorldY(evt.doY);
    }
    self.dragFinish = function(evt)
    {
      dragging_mol = false;
    }

    self.noise = function()
    {
      self.pos.x += rand0()*noise;
      self.pos.y += rand0()*noise;
      self.neg.x += rand0()*noise;
      self.neg.y += rand0()*noise;
    }

    //find charge forces on pos
    self.affect = function(mol)
    {
      var spostomposx = mol.pos.x-self.pos.x;
      var spostomposy = mol.pos.y-self.pos.y;
      var spostomposlensqr = spostomposx*spostomposx + spostomposy*spostomposy;
      var spostomposlen;
      if(spostomposlensqr > 0.001)
      {
        spostomposlen = sqrt(spostomposlensqr);
        spostomposx /= spostomposlen;
        spostomposy /= spostomposlen;
      }
      var spostomnegx = mol.neg.x-self.pos.x;
      var spostomnegy = mol.neg.y-self.pos.y;
      var spostomneglensqr = spostomnegx*spostomnegx + spostomnegy*spostomnegy;
      var spostomneglen;
      if(spostomneglensqr > 0.001)
      {
        spostomneglen = sqrt(spostomneglensqr);
        spostomnegx /= spostomneglen;
        spostomnegy /= spostomneglen;
      }
      var snegtomposx = mol.pos.x-self.neg.x;
      var snegtomposy = mol.pos.y-self.neg.y;
      var snegtomposlensqr = snegtomposx*snegtomposx + snegtomposy*snegtomposy;
      var snegtomposlen;
      if(snegtomposlensqr > 0.001)
      {
        snegtomposlen = sqrt(snegtomposlensqr);
        snegtomposx /= snegtomposlen;
        snegtomposy /= snegtomposlen;
      }
      var snegtomnegx = mol.neg.x-self.neg.x;
      var snegtomnegy = mol.neg.y-self.neg.y;
      var snegtomneglensqr = snegtomnegx*snegtomnegx + snegtomnegy*snegtomnegy;
      var snegtomneglen;
      if(snegtomneglensqr > 0.001)
      {
        snegtomneglen = sqrt(snegtomneglensqr);
        snegtomnegx /= snegtomneglen;
        snegtomnegy /= snegtomneglen;
      }
      //can we apply forces individually per dimension?
      var strength = .1;
      if(spostomneglensqr > 0.001 && spostomposlensqr > 0.001)
      {
        self.force_pos.x += (spostomnegx/spostomneglensqr - spostomposx/spostomposlensqr)*strength;
        self.force_pos.y += (spostomnegy/spostomneglensqr - spostomposy/spostomposlensqr)*strength;
      }
      if(snegtomposlensqr > 0.001 && snegtomneglensqr > 0.001)
      {
        self.force_neg.x += (snegtomposx/snegtomposlensqr - snegtomnegx/snegtomneglensqr)*strength;
        self.force_neg.y += (snegtomposy/snegtomposlensqr - snegtomnegy/snegtomneglensqr)*strength;
      }
      if(snegtomposlensqr > 0.001 && spostomposlensqr > 0.001)
      {
        mol.force_pos.x  -= (snegtomposx/snegtomposlensqr - spostomposx/spostomposlensqr)*strength;
        mol.force_pos.y  -= (snegtomposy/snegtomposlensqr - spostomposy/spostomposlensqr)*strength;
      }
      if(spostomneglensqr > 0.001 && snegtomneglensqr > 0.001)
      {
        mol.force_neg.x  -= (spostomnegx/spostomneglensqr - snegtomnegx/snegtomneglensqr)*strength;
        mol.force_neg.y  -= (spostomnegy/spostomneglensqr - snegtomnegy/snegtomneglensqr)*strength;
      }
    }

    //apply found charge forces on pos
    self.apply = function()
    {
      self.pos.x += self.force_pos.x;
      self.pos.y += self.force_pos.y;
      self.force_pos.x = 0;
      self.force_pos.y = 0;
      self.neg.x += self.force_neg.x;
      self.neg.y += self.force_neg.y;
      self.force_neg.x = 0;
      self.force_neg.y = 0;
    }

    //keep in box
    self.clamp = function(minx,maxx,miny,maxy)
    {
      self.pos.x = clamp(minx,maxx,self.pos.x);
      self.pos.y = clamp(miny,maxy,self.pos.y);
      self.neg.x = clamp(minx,maxx,self.neg.x);
      self.neg.y = clamp(miny,maxy,self.neg.y);
    }

    //apply self-connected resolution on pos (as function of pos)
    self.resolve = function()
    {
      touchAtoms(self.pos,self.neg);
    }

    //apply physical collision on pos (as function of pos)
    self.budge = function(mol)
    {
      var budged = false;
      var dsqr = 2*ar*2*ar;
      var spostomposx = mol.pos.x-self.pos.x;
      var spostomposy = mol.pos.y-self.pos.y;
      var spostomnegx = mol.neg.x-self.pos.x;
      var spostomnegy = mol.neg.y-self.pos.y;
      var snegtomposx = mol.pos.x-self.neg.x;
      var snegtomposy = mol.pos.y-self.neg.y;
      var snegtomnegx = mol.neg.x-self.neg.x;
      var snegtomnegy = mol.neg.y-self.neg.y;
      var lensqr;
      lensqr = spostomposx*spostomposx + spostomposy*spostomposy;
      if(lensqr < dsqr) { touchAtoms(self.pos,mol.pos); budged = true; }
      lensqr = spostomnegx*spostomnegx + spostomnegy*spostomnegy;
      if(lensqr < dsqr) { touchAtoms(self.pos,mol.neg); budged = true; }
      lensqr = snegtomposx*snegtomposx + snegtomposy*snegtomposy;
      if(lensqr < dsqr) { touchAtoms(self.neg,mol.pos); budged = true; }
      lensqr = snegtomnegx*snegtomnegx + snegtomnegy*snegtomnegy;
      if(lensqr < dsqr) { touchAtoms(self.neg,mol.neg); budged = true; }
      return budged;
    }
  }

  self.ready = function()
  {
    clicker = new Clicker({source:stage.dispCanv.canvas});
    dragger = new Dragger({source:stage.dispCanv.canvas});
    screen_btn = {x:0,y:0,w:canvas.width,h:canvas.height,click:
      function(evt)
      {
        //mols[mols.length] = new Mol(screenToWorldX(evt.doX),screenToWorldY(evt.doY),screenToWorldX(evt.doX),screenToWorldY(evt.doY));
      }
    };
  };

  self.tick = function()
  {
    clicker.filter(screen_btn);
    clicker.flush();
    for(var i = 0; i < mols.length; i++)
      dragger.filter(mols[i]);
    dragger.filter(noise_slider);
    dragger.filter(speed_slider);
    dragger.filter(scale_slider);
    dragger.flush();
    //tick_t += 0.1;
    //if(tick_t > 1) tick_t -= 1.;
    //else return;

    for(var i = 0; i < speed; i++)
      self.ticksim();
  }

  self.ticksim = function()
  {
    moldrop_t += 0.1;
    if(moldrop_t > 1 && mols.length < 100)
    {
      moldrop_t -= 1;
      //mols[mols.length] = new Mol(rand0()*10.,rand0()*10.,rand0()*10.,rand0()*10.);
      mols[mols.length] = new Mol(
        rand0()* canv.width/scale/2,
        rand0()*-canv.height/scale/2,
        rand0()* canv.width/scale/2,
        rand0()*-canv.height/scale/2
      );
      /*
      var d = 0.5;
      y = 4;
      for(var i = 0; i < 5; i++)
      {
        mols[mols.length] = new Mol(-.5, y, .5, y);
        y--;
        mols[mols.length] = new Mol( .5, y,-.5, y);
        y--;
      }
      */
    }

    //noise
    for(var i = 0; i < mols.length; i++)
      mols[i].noise();

    //affect each to each other
    for(var i = 0; i < mols.length; i++)
    {
      for(var j = i+1; j < mols.length; j++)
      {
        mols[i].affect(mols[j]);
      }
    }

    //apply each
    for(var i = 0; i < mols.length; i++)
      mols[i].apply();

    //clamp
    for(var i = 0; i < mols.length; i++)
      mols[i].clamp(-canv.width/scale/2,canv.width/scale/2,-canv.height/scale/2,canv.height/scale/2);

    //resolve each
    for(var i = 0; i < mols.length; i++)
      mols[i].resolve();

    //budge each to each other
    var budged = true;
    var max = 10;
    while(budged && max)
    {
      budged = false;
      for(var i = 0; i < mols.length; i++)
      {
        for(var j = i+1; j < mols.length; j++)
        {
          if(mols[i].budge(mols[j]))
            budged = true;
        }
      }
      if(budged)
      {
        max--;
        //re-resolve each
        for(var i = 0; i < mols.length; i++)
          mols[i].resolve();
      }
    }

  };

  var p_img = GenIcon(scale,scale);
  p_img.context.fillStyle = "#00FF00";
  p_img.context.beginPath();
  p_img.context.arc(scale/2,scale/2,scale/2,0,2*Math.PI);
  p_img.context.fill();
  var n_img = GenIcon(scale,scale);
  n_img.context.fillStyle = "#FF0000";
  n_img.context.beginPath();
  n_img.context.arc(scale/2,scale/2,scale/2,0,2*Math.PI);
  n_img.context.fill();
  var drawMol = function(mol)
  {
    var w = scale;
    var h = scale;
    var px = worldToScreenX(mol.pos.x);
    var py = worldToScreenY(mol.pos.y);
    var nx = worldToScreenX(mol.neg.x);
    var ny = worldToScreenY(mol.neg.y);
    ctx.drawImage(p_img,px-w/2,py-h/2,w,h);
    ctx.drawImage(n_img,nx-w/2,ny-h/2,w,h);
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(px,py);
    ctx.lineTo(nx,ny);
    ctx.stroke();
  }
  self.draw = function()
  {
    for(var i = 0; i < mols.length; i++)
      drawMol(mols[i]);
    noise_slider.draw(canv);
    speed_slider.draw(canv);
    scale_slider.draw(canv);
  };

  self.cleanup = function()
  {
  };

};

