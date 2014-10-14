
/**
Main.js
Gets pictures from flickr depend on the tags added and
applies a filter by canvas to it.

Reference: Ilmari Heikkinen
Post link: http://www.html5rocks.com/en/tutorials/canvas/imagefilters/

Author: Rosa Durante <me@rosadurante.com>
Date: Tuesday 14th Oct 2014
*/

(function ($) {

  // ------------
  // FILTERS
  // ------------

  var Canvas = {

    getPixels: function (canvas) {
      var ctx = canvas.getContext('2d');
      return ctx.getImageData(0, 0, canvas.width, canvas.height); 
    },

    filterImage: function (filter, canvas, var_args) {
      var args = [this.getPixels(canvas)];
      for (var i=2; i<arguments.length; i++) {
        args.push(arguments[i]);
      }
      return filter.apply(null, args);
    },

    grayscale: function (pixels, args) {
      var r,g,b,v, d = pixels.data;
      for (var i=0; i<d.length; i+=4) {
        r = d[i];
        g = d[i+1];
        b = d[i+2];
        v = 0.2126*r + 0.7152*g + 0.0722*b;
        d[i] = d[i+1] = d[i+2] = v;
      }
      return pixels;
    },

    brightness: function (pixels, adjustment) {
      var d = pixels.data;
      for (var i=0; i<d.length; i+=4) {
        d[i] += adjustment;
        d[i+1] += adjustment;
        d[i+2] += adjustment;
      }
      return pixels;
    },

    threshold: function (pixels, threshold) {
      var r,g,b,v, d = pixels.data;
      for (var i=0; i<d.length; i+=4) {
        r = d[i];
        g = d[i+1];
        b = d[i+2];
        v = (0.2126*r + 0.7152*g + 0.0722*b >= threshold) ? 255 : 0;
        d[i] = d[i+1] = d[i+2] = v
      }
      return pixels;
    },

    convolute: function (pixels, weights, opaque) {
      var side = Math.round(Math.sqrt(weights.length));
      var halfSide = Math.floor(side/2);
      var src = pixels.data;
      var sw = pixels.width;
      var sh = pixels.height;

      var w = sw;
      var h = sh;

      var tmpCanvas = document.createElement('canvas');
      var tmpCtx = tmpCanvas.getContext('2d');
      var output = tmpCtx.createImageData(w,h);
      var dst = output.data;

      var alphaFac = opaque ? 1 : 0;
      for (var y=0; y<h; y++) {
        for (var x=0; x<w; x++) {
          var dstoff = (y*w+x)*4, r=0, g=0, b=0, a=0;
          for (var cy=0; cy<side; cy++) {
            for (var cx=0; cx<side; cx++) {
              var scy = y + cy - halfSide;
              var scx = x + cx - halfSide;
              if (scy >=0 && scy < sh && scx >=0 && scx < sw) {
                var srcOff = (scy*sw+scx)*4;
                var wt = weights[cy*side+cx];
                r += src[srcOff] * wt;
                g += src[srcOff+1] * wt;
                b += src[srcOff+2] * wt;
                a += src[srcOff+3] * wt;
              }
            }
          }

          dst[dstoff] = r;
          dst[dstoff+1] = g;
          dst[dstoff+2] = b;
          dst[dstoff+3] = a + alphaFac*(255-a);
        }
      }
      return output;
    }

  };

  // Main code

  var canvas;
  var ctx;
  var video;

  var setUpCanvas = function (video) {
    canvas = document.getElementsByTagName('canvas')[0];
    ctx = canvas.getContext('2d');
    canvas.width = video.width;
    canvas.height = video.height;

    drawCanvas();
  };

  var getArgument =  function (key) {
    switch (key) {
      case 'brightness':
      case 'threshold':
        return parseInt($('#' + key).val(), 10);
      case 'convolute':
        var arg = [];
        for (var i=0; i<9; i++) {
          arg.push(parseFloat($('#convolute_' + i).val()));
        }
        return arg;
    }
  }

  var getFilter = function () {

    var filter, argument;
    if (filterSelected) {
      switch (filterSelected) {
        case 'grayscale': 
          filter = Canvas.grayscale;
          break;
        case 'brightness':
          filter = Canvas.brightness;
          argument = getArgument('brightness');
          break;
        case 'threshold':
          filter = Canvas.threshold;
          argument = getArgument('threshold');
          break;
        case 'convolute':
          filter = Canvas.convolute;
          argument = getArgument('convolute');
          break;
        default:
          filter = Canvas.grayscale;
      }
      return Canvas.filterImage(filter, canvas, argument);
    } else {
      return Canvas.getPixels(canvas);
    }
  };

  var drawCanvas = function () {
    ctx.drawImage(video, 0, 0, video.width, video.height);
    var filter = getFilter();
    ctx.putImageData(filter, 0, 0);
    requestAnimationFrame(drawCanvas);
  };

  // --------
  // Video
  // --------

  navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);

  var medias = {video: true, audio: false};
  var errorCallback = function (error) { console.log(error); };
  var successCallback = function (mediaStream) {
    video = document.getElementsByTagName('video')[0];
    video.src = window.URL.createObjectURL(mediaStream);
    video.width = 640;
    video.height = 480;
    video.play();

    setUpCanvas(video);
  };

  navigator.getMedia(medias, successCallback, errorCallback);
  
  // View

  var filterSelected;

  $('.brightness, .threshold, .convolute').hide();
  $('select').on('change', function () {
    filterSelected = this.selectedOptions[0].value;
    $('.brightness, .threshold, .convolute').hide();
    if (filterSelected.length) {
      $('.' + filterSelected).show();
    }
  });

})(jQuery);