var LoadingScene = function(game, stage)
{
  var self = this;

  var dc = stage.drawCanv;
  var canvas = dc.canvas;
  var ctx = dc.context;

  var pad;
  var barw;

  var loading_percent_loaded;
  var ticks_since_loading_ready;
  var percent_loaded;
  var chase_percent_loaded;
  var lerp_percent_loaded;
  var lerp_chase_percent_loaded;
  var ticks_since_ready;
  var post_load_countdown;

  var n_loading_imgs_loaded;
  var loading_img_srcs;
  var loading_imgs;
  var n_imgs_loaded;
  var img_srcs;
  var imgs;

  var loadingImageLoaded = function()
  {
    n_loading_imgs_loaded++;
  };
  var imageLoaded = function()
  {
    n_imgs_loaded++;
  };

  self.ready = function()
  {
    pad = 20;
    barw = (dc.width-(2*pad));

    loading_percent_loaded = 0;
    ticks_since_loading_ready = 0;
    percent_loaded = 0;
    chase_percent_loaded = 0;
    lerp_percent_loaded = 0;
    lerp_chase_percent_loaded = 0;
    ticks_since_ready = 0;
    post_load_countdown = 0;

    n_loading_imgs_loaded = 0;
    loading_img_srcs = [];
    loading_imgs = [];
    n_imgs_loaded = 0;
    img_srcs = [];
    imgs = [];

    //ctx.font = "12px Special Font"; //put font that nees loading here
    ctx.fillStyle = "#000000";
    ctx.fillText(".",0,0);// funky way to encourage any custom font to load

    //put asset paths in loading_img_srcs (for assets used on loading screen itself)
    //loading_img_srcs.push("assets/man.png");
    for(var i = 0; i < loading_img_srcs.length; i++)
    {
      loading_imgs[i] = new Image();
      loading_imgs[i].onload = loadingImageLoaded;
      loading_imgs[i].src = loading_img_srcs[i];
    }
    loadingImageLoaded(); //call once to prevent 0/0 != 100% bug

    //put asset paths in img_srcs
    //img_srcs.push("assets/man.png");
    for(var i = 0; i < img_srcs.length; i++)
    {
      imgs[i] = new Image();
      imgs[i].onload = imageLoaded;
      imgs[i].src = img_srcs[i];
    }
    imageLoaded(); //call once to prevent 0/0 != 100% bug
  };

  self.tick = function()
  {
    //note- assets used on loading screen itself NOT included in wait
    loading_percent_loaded = n_loading_imgs_loaded/(loading_img_srcs.length+1);
    if(loading_percent_loaded >= 1.0) ticks_since_loading_ready++;
    percent_loaded = n_imgs_loaded/(img_srcs.length+1);
    if(chase_percent_loaded <= percent_loaded) chase_percent_loaded += 0.01;
    lerp_percent_loaded = lerp(lerp_percent_loaded,percent_loaded,0.1);
    lerp_chase_percent_loaded = lerp(lerp_chase_percent_loaded,chase_percent_loaded,0.1);
    if(percent_loaded >= 1.0) ticks_since_ready++;
    if(ticks_since_ready >= post_load_countdown)
    {
      //any last minute preparation
      game.nextScene();
    }
  };


  self.draw = function()
  {
    ctx.fillRect(pad,dc.height/2,chase_percent_loaded*barw,1);
    ctx.strokeRect(pad-1,(dc.height/2)-1,barw+2,3);

    if(loading_percent_loaded >= 1)
    {
      //do any special drawing here
    }
  };

  self.cleanup = function()
  {
    imgs = [];//just used them to cache assets in browser; let garbage collector handle 'em.
    loading_imgs = [];//just used them to cache assets in browser; let garbage collector handle 'em.
  };
};
