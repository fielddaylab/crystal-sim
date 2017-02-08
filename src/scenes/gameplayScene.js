var GamePlayScene = function(game, stage)
{
  var self = this;

  var canv = stage.drawCanv;
  var canvas = canv.canvas;
  var ctx = canv.context;

  var ar = 0.5;
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

    self.noise = function()
    {
      self.pos.x += rand0()*0.1;
      self.neg.y += rand0()*0.1;
      self.pos.x += rand0()*0.1;
      self.neg.y += rand0()*0.1;
    }

    //find charge forces on pos
    self.affect = function(mol)
    {
      var spostomposx = mol.pos.x-self.pos.x;
      var spostomposy = mol.pos.y-self.pos.y;
      var spostomposlensqr = spostomposx*spostomposx + spostomposy*spostomposy;
      var spostomposlen = sqrt(spostomposlensqr);
      spostomposx /= spostomposlen;
      spostomposy /= spostomposlen;
      var spostomnegx = mol.neg.x-self.pos.x;
      var spostomnegy = mol.neg.y-self.pos.y;
      var spostomneglensqr = spostomnegx*spostomnegx + spostomnegy*spostomnegy;
      var spostomneglen = sqrt(spostomneglensqr);
      spostomnegx /= spostomneglen;
      spostomnegy /= spostomneglen;
      var snegtomposx = mol.pos.x-self.neg.x;
      var snegtomposy = mol.pos.y-self.neg.y;
      var snegtomposlensqr = snegtomposx*snegtomposx + snegtomposy*snegtomposy;
      var snegtomposlen = sqrt(snegtomposlensqr);
      snegtomposx /= snegtomposlen;
      snegtomposy /= snegtomposlen;
      var snegtomnegx = mol.neg.x-self.neg.x;
      var snegtomnegy = mol.neg.y-self.neg.y;
      var snegtomneglensqr = snegtomnegx*snegtomnegx + snegtomnegy*snegtomnegy;
      var snegtomneglen = sqrt(snegtomneglensqr);
      snegtomnegx /= snegtomneglen;
      snegtomnegy /= snegtomneglen;
      //can we apply forces individually per dimension?
      var strength = .1;
      self.force_pos.x += (spostomnegx/spostomneglensqr - spostomposx/spostomposlensqr)*strength;
      self.force_pos.y += (spostomnegy/spostomneglensqr - spostomposy/spostomposlensqr)*strength;
      self.force_neg.x += (snegtomposx/snegtomposlensqr - snegtomnegx/snegtomneglensqr)*strength;
      self.force_neg.y += (snegtomposy/snegtomposlensqr - snegtomnegy/snegtomneglensqr)*strength;
      mol.force_pos.x  -= (snegtomposx/snegtomposlensqr - spostomposx/spostomposlensqr)*strength;
      mol.force_pos.y  -= (snegtomposy/snegtomposlensqr - spostomposy/spostomposlensqr)*strength;
      mol.force_neg.x  -= (spostomnegx/spostomneglensqr - snegtomnegx/snegtomneglensqr)*strength;
      mol.force_neg.y  -= (spostomnegy/spostomneglensqr - snegtomnegy/snegtomneglensqr)*strength;
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
  var mols = [];
  var moldrop_t = 1.1;
  var tick_t = 10;

  self.ready = function()
  {
  };

  self.tick = function()
  {
    //tick_t += 0.1;
    //if(tick_t > 1) tick_t -= 1.;
    //else return;

    moldrop_t += 0.01;
    if(moldrop_t > 1)
    {
      moldrop_t -= 1;
      mols[mols.length] = new Mol(rand0()*10.,rand0()*10.,rand0()*10.,rand0()*10.);
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
    //for(var i = 0; i < mols.length; i++)
      //mols[i].noise();

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
      mols[i].clamp(-5,5,-5,5);

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

  var s = 10;
  var p_img = GenIcon(s,s);
  p_img.context.fillStyle = "#00FF00";
  p_img.context.beginPath();
  p_img.context.arc(s/2,s/2,s/2,0,2*Math.PI);
  p_img.context.fill();
  var n_img = GenIcon(s,s);
  n_img.context.fillStyle = "#FF0000";
  n_img.context.beginPath();
  n_img.context.arc(s/2,s/2,s/2,0,2*Math.PI);
  n_img.context.fill();
  var drawMol = function(mol)
  {
    var x;
    var y;
    var w = 10;
    var h = 10;
    x = mol.pos.x*w + canv.width /2 - w/2;
    y = mol.pos.y*h + canv.height/2 - h/2;
    ctx.drawImage(p_img,x,y,w,h);
    x = mol.neg.x*w + canv.width /2 - w/2;
    y = mol.neg.y*h + canv.height/2 - h/2;
    ctx.drawImage(n_img,x,y,w,h);
  }
  self.draw = function()
  {
    for(var i = 0; i < mols.length; i++)
      drawMol(mols[i]);
  };

  self.cleanup = function()
  {
  };

};

