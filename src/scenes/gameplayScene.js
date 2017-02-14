var GamePlayScene = function(game, stage)
{
  var self = this;

  var canv = stage.drawCanv;
  var canvas = canv.canvas;
  var ctx = canv.context;

  var e = 0.0001; //epsillon
  var ar           = 0.2;
  var speed        = 1.0;
  var noise        = 0.02;
  var zoom         = 5.0; //world units from center to edge
  var bounds_scale = 5.0;
  var strength     = 0.01;

  var mols = [];
  var max_mols = 500;
  var dragging_mol = false;
  var moldrop_t = 1.1;
  var tick_t = 10;

  var base_bounds = { wx:0, wy:0, ww:2, wh:4 }
  var bounds      = { wx:0, wy:0, ww:2, wh:4 }
  var base_cam    = { wx:0, wy:0, ww:2, wh:4 };
  var cam         = { wx:0, wy:0, ww:2, wh:4 };

  var magnet = { on:0, wx:0, wy:0 };

  var clicker;
  var dragger;
  var screen_btn;

  var y = 10;
  var noise_slider    = new SliderBox(10,y,200,10, 0.0,   0.5, noise,        function(v){ noise        = v }); y += 20;
  var speed_slider    = new SliderBox(10,y,200,10, 0.0,  20.0, speed,        function(v){ speed        = v }); y += 20;
  var ar_slider       = new SliderBox(10,y,200,10, 0.05,  0.5, ar,           function(v){ ar           = v }); y += 20;
  var zoom_slider     = new SliderBox(10,y,200,10, 0.1,  10.0, zoom,         function(v){ zoom         = v }); y += 20;
  var bounds_slider   = new SliderBox(10,y,200,10, 0.1,  10.0, bounds_scale, function(v){ bounds_scale = v }); y += 20;
  var strength_slider = new SliderBox(10,y,200,10, 0.0,   0.1, strength,     function(v){ strength     = v }); y += 20;

  var box_rows = 10;
  var box_cols = 10;
  var box = [];
  var cur_box_a;
  var cur_box_b;
  var box_valid;
  var box_item_a;
  var box_item_b;
  for(var i = 0; i < box_rows; i++)
  {
    box[i] = [];
    for(var j = 0; j < box_cols; j++)
      box[i][j] = [];
  }

  var Atom = function(x,y)
  {
    var self = this;
    self.x = x;
    self.y = y;
    self.w = w;
    self.h = h;
    self.wx = x;
    self.wy = y;
    self.ww = 1;
    self.wh = 1;
  }
  var touchAtoms = function(a,b)
  {
    var x = (a.wx+b.wx)/2.;
    var y = (a.wy+b.wy)/2.;
    var toax = a.wx - x;
    var toay = a.wy - y;
    var lensqr = toax*toax+toay*toay;
    if(lensqr < e)
    {
      a.wx = x+ar;
      a.wy = y;
      b.wx = x-ar;
      b.wy = y;
    }
    else
    {
      var len = sqrt(lensqr);
      a.wx = x + (toax/len)*ar;
      a.wy = y + (toay/len)*ar;
      b.wx = x - (toax/len)*ar;
      b.wy = y - (toay/len)*ar;
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
        distsqr(self.pos.wx,self.pos.wy,worldSpaceX(cam,canv,evt.doX),worldSpaceY(cam,canv,evt.doY)) < dsqr ||
        distsqr(self.neg.wx,self.neg.wy,worldSpaceX(cam,canv,evt.doX),worldSpaceY(cam,canv,evt.doY)) < dsqr
      )
      {
        dragging_mol = self;
        return true;
      }
      return false;
    }
    self.dragStart = function(evt)
    {
      self.pos.wx = worldSpaceX(cam,canv,evt.doX);
      self.pos.wy = worldSpaceY(cam,canv,evt.doY);
      self.neg.wx = worldSpaceX(cam,canv,evt.doX);
      self.neg.wy = worldSpaceY(cam,canv,evt.doY);
    }
    self.drag = function(evt)
    {
      self.pos.wx = worldSpaceX(cam,canv,evt.doX);
      self.pos.wy = worldSpaceY(cam,canv,evt.doY);
      self.neg.wx = worldSpaceX(cam,canv,evt.doX);
      self.neg.wy = worldSpaceY(cam,canv,evt.doY);
    }
    self.dragFinish = function(evt)
    {
      dragging_mol = false;
    }

    self.noise = function()
    {
      self.pos.wx += rand0()*noise;
      self.pos.wy += rand0()*noise;
      self.neg.wx += rand0()*noise;
      self.neg.wy += rand0()*noise;
    }

    //find charge forces on pos

    var sp2mp = { x:0, y:0 };
    var sp2mn = { x:0, y:0 };
    var sn2mp = { x:0, y:0 };
    var sn2mn = { x:0, y:0 };
    self.affect = function(mol)
    {
      sp2mp.x = mol.pos.wx-self.pos.wx;
      sp2mp.y = mol.pos.wy-self.pos.wy;
      var sp2mplen = vlen(sp2mp);
      vdiv(sp2mplen*sp2mplen*sp2mplen,sp2mp);

      sp2mn.x = mol.neg.wx-self.pos.wx;
      sp2mn.y = mol.neg.wy-self.pos.wy;
      var sp2mnlen = vlen(sp2mn);
      vdiv(sp2mnlen*sp2mnlen*sp2mnlen,sp2mn);

      sn2mp.x = mol.pos.wx-self.neg.wx;
      sn2mp.y = mol.pos.wy-self.neg.wy;
      var sn2mplen = vlen(sn2mp);
      vdiv(sn2mplen*sn2mplen*sn2mplen,sn2mp);

      sn2mn.x = mol.neg.wx-self.neg.wx;
      sn2mn.y = mol.neg.wy-self.neg.wy;
      var sn2mnlen = vlen(sn2mn);
      vdiv(sn2mnlen*sn2mnlen*sn2mnlen,sn2mn);

      self.force_pos.wx += (sp2mn.x-sp2mp.x)*strength;
      self.force_pos.wy += (sp2mn.y-sp2mp.y)*strength;

      self.force_neg.wx += (sn2mp.x-sn2mn.x)*strength;
      self.force_neg.wy += (sn2mp.y-sn2mn.y)*strength;

      mol.force_pos.wx -= (sn2mp.x-sp2mp.x)*strength;
      mol.force_pos.wy -= (sn2mp.y-sp2mp.y)*strength;

      mol.force_neg.wx -= (sp2mn.x-sn2mn.x)*strength;
      mol.force_neg.wy -= (sp2mn.y-sn2mn.y)*strength;
    }

    var p2m = {x:0,y:0};
    var n2m = {x:0,y:0};
    self.drawTowards = function(wx,wy)
    {
      p2m.x = self.pos.wx-wx;
      p2m.y = self.pos.wy-wy;
      vnorm(p2m);

      n2m.x = self.neg.wx-wx;
      n2m.y = self.neg.wy-wy;
      vnorm(n2m);

      self.force_pos.wx -= p2m.x*strength*2;
      self.force_pos.wy -= p2m.y*strength*2;
      self.force_neg.wx -= n2m.x*strength*2;
      self.force_neg.wy -= n2m.y*strength*2;
    }

    //apply found charge forces on pos
    self.apply = function()
    {
      self.pos.wx += clamp(-ar,ar,self.force_pos.wx);
      self.pos.wy += clamp(-ar,ar,self.force_pos.wy);
      self.force_pos.wx = 0;
      self.force_pos.wy = 0;
      self.neg.wx += clamp(-ar,ar,self.force_neg.wx);
      self.neg.wy += clamp(-ar,ar,self.force_neg.wy);
      self.force_neg.wx = 0;
      self.force_neg.wy = 0;
    }

    //keep in box
    self.clamp = function(minx,maxx,miny,maxy)
    {
      self.pos.wx = clamp(minx,maxx,self.pos.wx);
      self.pos.wy = clamp(miny,maxy,self.pos.wy);
      self.neg.wx = clamp(minx,maxx,self.neg.wx);
      self.neg.wy = clamp(miny,maxy,self.neg.wy);
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
      if(wdistsqr(self.pos,mol.pos) < dsqr) {
      touchAtoms( self.pos,mol.pos); budged = true; }
      if(wdistsqr(self.pos,mol.neg) < dsqr) {
      touchAtoms( self.pos,mol.neg); budged = true; }
      if(wdistsqr(self.neg,mol.pos) < dsqr) {
      touchAtoms( self.neg,mol.pos); budged = true; }
      if(wdistsqr(self.neg,mol.neg) < dsqr) {
      touchAtoms( self.neg,mol.neg); budged = true; }
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
        magnet.on = !magnet.on;
        magnet.wx = worldSpaceX(cam,canv,evt.doX);
        magnet.wy = worldSpaceY(cam,canv,evt.doY);
        //mols[mols.length] = new Mol(worldSpaceX(cam,canv,evt.doX),worldSpaceY(cam,canv,evt.doY),worldSpaceX(cam,canv,evt.doX),worldSpaceY(cam,canv,evt.doY));
      }
    };
  };

  self.tick = function()
  {
    clicker.filter(screen_btn);
    clicker.flush();
    //for(var i = 0; i < mols.length; i++)
      //dragger.filter(mols[i]);
    dragger.filter(noise_slider);
    dragger.filter(speed_slider);
    dragger.filter(ar_slider);
    dragger.filter(zoom_slider);
    dragger.filter(bounds_slider);
    dragger.filter(strength_slider);
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
    if(moldrop_t > 1 && mols.length < max_mols)
    {
      moldrop_t -= 1;
      x = rand0()*bounds.ww/2;
      y = rand0()*bounds.wh/2;
      mols[mols.length] = new Mol(
        x-ar,
        y-ar,
        x+ar,
        y+ar
      );
    }

    //box
    var x;
    var y;
    for(var i = 0; i < box_rows; i++)
      for(var j = 0; j < box_cols; j++)
        box[i][j] = [];
    for(var i = 0; i < mols.length; i++)
    {
      col = clamp(0,box_rows-1,floor((mols[i].pos.wx+bounds.ww/2)/bounds.ww*box_cols));
      row = clamp(0,box_cols-1,floor((mols[i].pos.wy+bounds.wh/2)/bounds.wh*box_rows));
      box[row][col].push(mols[i]);
    }

    //noise
    for(var i = 0; i < mols.length; i++)
      mols[i].noise();

    //affect each to each other
    for(var i = 0; i < box_rows; i++)
    {
      for(var j = 0; j < box_cols; j++)
      {
        cur_box_a = box[i][j];
        for(var k = 0; k < 4; k++)
        {
          box_valid = false;
          if(k == 0)
          {
            box_valid = true;
            for(var l = 0; l < cur_box_a.length; l++)
            {
              for(var m = l+1; m < cur_box_a.length; m++)
              {
                box_item_a = cur_box_a[l];
                box_item_b = cur_box_a[m];
                box_item_a.affect(box_item_b);
              }
            }
          }
          else
          {
            switch(k)
            {
              case 1:
                if(j < box_cols-1)
                {
                  box_valid = true;
                  cur_box_b = box[i][j+1];
                }
                break;
              case 2:
                if(i < box_rows-1)
                {
                  box_valid = true;
                  cur_box_b = box[i+1][j];
                }
                break;
              case 3:
                if(i < box_rows-1 && j < box_cols-1)
                {
                  box_valid = true;
                  cur_box_b = box[i+1][j+1];
                }
                break;
            }

            if(box_valid)
            {
              for(var l = 0; l < cur_box_a.length; l++)
              {
                for(var m = 0; m < cur_box_b.length; m++)
                {
                  box_item_a = cur_box_a[l];
                  box_item_b = cur_box_b[m];
                  box_item_a.affect(box_item_b);
                }
              }
            }
          }
        }
      }
    }

    //magnet
    if(magnet.on)
    {
      for(var i = 0; i < mols.length; i++)
        mols[i].drawTowards(magnet.wx,magnet.wy);
    }

    //apply each
    for(var i = 0; i < mols.length; i++)
      mols[i].apply();

    //clamp
    bounds.ww = base_bounds.ww*bounds_scale;
    bounds.wh = base_bounds.wh*bounds_scale;
    for(var i = 0; i < mols.length; i++)
      mols[i].clamp(bounds.wx-bounds.ww/2,bounds.wx+bounds.ww/2,bounds.wy-bounds.wh/2,bounds.wy+bounds.wh/2);

    //resolve each
    for(var i = 0; i < mols.length; i++)
      mols[i].resolve();

    //budge each to each other
    var budged = true;
    var max = 10;
    while(budged && max)
    {
      budged = false;
      for(var i = 0; i < box_rows; i++)
      {
        for(var j = 0; j < box_cols; j++)
        {



          //affect each to each other
          for(var i = 0; i < box_rows; i++)
          {
            for(var j = 0; j < box_cols; j++)
            {
              cur_box_a = box[i][j];
              for(var k = 0; k < 4; k++)
              {
                box_valid = false;
                if(k == 0)
                {
                  box_valid = true;
                  for(var l = 0; l < cur_box_a.length; l++)
                  {
                    for(var m = l+1; m < cur_box_a.length; m++)
                    {
                      box_item_a = cur_box_a[l];
                      box_item_b = cur_box_a[m];
                      if(box_item_a.budge(box_item_b))
                        budged = true;
                    }
                  }
                }
                else
                {
                  switch(k)
                  {
                    case 1:
                      if(j < box_cols-1)
                      {
                        box_valid = true;
                        cur_box_b = box[i][j+1];
                      }
                      break;
                    case 2:
                      if(i < box_rows-1)
                      {
                        box_valid = true;
                        cur_box_b = box[i+1][j];
                      }
                      break;
                    case 3:
                      if(i < box_rows-1 && j < box_cols-1)
                      {
                        box_valid = true;
                        cur_box_b = box[i+1][j+1];
                      }
                      break;
                  }

                  if(box_valid)
                  {
                    for(var l = 0; l < cur_box_a.length; l++)
                    {
                      for(var m = 0; m < cur_box_b.length; m++)
                      {
                        box_item_a = cur_box_a[l];
                        box_item_b = cur_box_b[m];
                        if(box_item_a.budge(box_item_b))
                          budged = true;
                      }
                    }
                  }
                }
              }
            }
          }



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

  var w = 100;//max_ar*2*canv.width /min_scale;
  var h = 100;//max_ar*2*canv.height/min_scale;
  var p_img = GenIcon(w,h)
  p_img.context.fillStyle = "#00FF00";
  p_img.context.beginPath();
  p_img.context.arc(w/2,h/2,w/2,0,2*Math.PI);
  p_img.context.fill();
  var n_img = GenIcon(w,h)
  n_img.context.fillStyle = "#FF0000";
  n_img.context.beginPath();
  n_img.context.arc(w/2,h/2,w/2,0,2*Math.PI);
  n_img.context.fill();
  var drawMol = function(mol)
  {
    screenSpace(cam,canv,mol.pos);
    screenSpace(cam,canv,mol.neg);
    mol.pos.ww = ar*2;
    mol.pos.wh = ar*2;
    mol.neg.ww = ar*2;
    mol.neg.wh = ar*2;
    ctx.drawImage(p_img,mol.pos.x,mol.pos.y,mol.pos.w,mol.pos.h);
    ctx.drawImage(n_img,mol.neg.x,mol.neg.y,mol.neg.w,mol.neg.h);
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(mol.pos.x+mol.pos.w/2,mol.pos.y+mol.pos.h/2);
    ctx.lineTo(mol.neg.x+mol.neg.w/2,mol.neg.y+mol.neg.h/2);
    ctx.stroke();
  }
  self.draw = function()
  {
    cam.ww = base_cam.ww*zoom;
    cam.wh = base_cam.wh*zoom;
    for(var i = 0; i < mols.length; i++)
      drawMol(mols[i]);
    noise_slider.draw(canv);    ctx.fillText("noise",     noise_slider.x   +noise_slider.w   +10, noise_slider.y   +5);
    speed_slider.draw(canv);    ctx.fillText("sim_speed", speed_slider.x   +speed_slider.w   +10, speed_slider.y   +5);
    ar_slider.draw(canv);       ctx.fillText("radius",    ar_slider.x      +ar_slider.w      +10, ar_slider.y      +5);
    zoom_slider.draw(canv);     ctx.fillText("zoom",      zoom_slider.x    +zoom_slider.w    +10, zoom_slider.y    +5);
    bounds_slider.draw(canv);   ctx.fillText("bounds",    bounds_slider.x  +bounds_slider.w  +10, bounds_slider.y  +5);
    strength_slider.draw(canv); ctx.fillText("strength",  strength_slider.x+strength_slider.w+10, strength_slider.y+5);
    screenSpace(cam,canv,bounds);
    ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);
  };

  self.cleanup = function()
  {
  };

};

