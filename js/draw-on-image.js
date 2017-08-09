/* © 2009 ROBO Design
 * http://www.robodesign.ro
 */

// Keep everything in anonymous function, called on window load.
if(window.addEventListener) {
window.addEventListener('load', function () {
  var canvasOverlayList = [];
  var canvasOverlayContextList= []; 
  var listOfCanvases = []; 
  var canvasContextList = [];

  // The active tool instance.
  var tool;
  var tool_default = 'line';

  function init () 
  {
    // Find the canvas elements.
    listOfCanvases = document.getElementsByClassName('gameCanvas');
    if (!listOfCanvases) {
      alert('Error: I cannot find any canvas elements!');
      return;
    }

	var canvasIndex;
	for (canvasIndex = 0; canvasIndex < listOfCanvases.length; canvasIndex++)
	{		
		if (!listOfCanvases[canvasIndex].getContext) {
		  alert('Error: no canvas.getContext!');
		  return;
		}

		//Give each canvas an id so it can be found again on an event handler
		listOfCanvases[canvasIndex].id = canvasIndex;
		
		// Get the 2D canvas context.
		var contexto = listOfCanvases[canvasIndex].getContext('2d');
		if (!contexto) {
		  alert('Error: failed to getContext!');
		  return;
		}
		contexto.id = canvasIndex;
		//Add 2d canvas context to list of canvas contexts
		canvasContextList.push(contexto);
		
		// Add the temporary canvas.
		 //create temporary canvas
		var container = listOfCanvases[canvasIndex].parentNode;
		var canvas = document.createElement('canvas');
		
		if (!canvas) {
		  alert('Error: I cannot create a new canvas element!');
		  return;
		}
	
		//size canvas to size of sibling image
		var img;
		
		if(listOfCanvases[canvasIndex].previousElementSibling.nodeName == 'IMG')
		{
			img = listOfCanvases[canvasIndex].previousElementSibling;
		}
		else if (listOfCanvases[canvasIndex].nextElementSibling.nodeName == 'IMG')
		{
			img = listOfCanvases[canvasIndex].nextElementSibling;
		}
		else
		{
			alert('Error: No Image Found!');
		}
	
		listOfCanvases[canvasIndex].width = img.width;
		listOfCanvases[canvasIndex].height = img.height;
	
		canvas.className += ' imageTemp';
		
		canvas.width  = listOfCanvases[canvasIndex].width;
		canvas.height = listOfCanvases[canvasIndex].height;
		container.appendChild(canvas);

		// Attach the mousedown, mousemove and mouseup event listeners.
		canvas.addEventListener('mousedown', ev_canvas, false);
		canvas.addEventListener('mousemove', ev_canvas, false);
		canvas.addEventListener('mouseup',   ev_canvas, false);
		
		var context = canvas.getContext('2d');
		
		canvas.id = canvasIndex;
		//add temporary canvas to list of temporary canvases
		canvasOverlayList.push(canvas);
		//add temporary canvas context to list of temporary canvas contexts
		context.id = canvasIndex;
		canvasOverlayContextList.push(context);
	}
	
	// Get the tool select input.
	var tool_select = document.getElementById('dtool');
	if (!tool_select) {
	  alert('Error: failed to get the dtool element!');
	  return;
	}
	tool_select.addEventListener('change', ev_tool_change, false);

	// Activate the default tool.
	if (tools[tool_default]) {
	  tool = new tools[tool_default]();
	  tool_select.value = tool_default;
	}
  }

  // The general-purpose event handler. This function just determines the mouse 
  // position relative to the canvas element.
  function ev_canvas (ev) {
    if (ev.layerX || ev.layerX == 0) { // Firefox
      ev._x = ev.layerX;
      ev._y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
      ev._x = ev.offsetX;
      ev._y = ev.offsetY;
    }

    // Call the event handler of the tool.
    var func = tool[ev.type];
    if (func) {
      func(ev);
    }
  }

  // The event handler for any changes made to the tool selector.
  function ev_tool_change (ev) {
    if (tools[this.value]) {
      tool = new tools[this.value]();
    }
  }

  // This function draws the #imageTemp canvas on top of #imageView, after which 
  // #imageTemp is cleared. This function is called each time when the user 
  // completes a drawing operation.
  function img_update (canvasId) {
		var canvas = canvasOverlayList[canvasId];
		var contexto = canvasContextList[canvasId];
		contexto.drawImage(canvas, 0, 0);
		var context = canvasOverlayContextList[canvasId];
		context.clearRect(0, 0, canvas.width, canvas.height);
  }

  // This object holds the implementation of each drawing tool.
  var tools = {};

  // The drawing pencil.
  tools.pencil = function () {
    var tool = this;
    this.started = false;

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = function (ev) {
		//find correct context
		var context = canvasOverlayContextList[ev.currentTarget.id];
        context.beginPath();
        context.moveTo(ev._x, ev._y);
        tool.started = true;
    };

    // This function is called every time you move the mouse. Obviously, it only 
    // draws if the tool.started state is set to true (when you are holding down 
    // the mouse button).
    this.mousemove = function (ev) {
      if (tool.started) {
		var context = canvasOverlayContextList[ev.currentTarget.id];
        context.lineTo(ev._x, ev._y);
        context.stroke();
      }
    };

    // This is called when you release the mouse button.
    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
		var context = canvasOverlayContextList[ev.currentTarget.id];
        tool.started = false;
        img_update(ev.currentTarget.id);
      }
    };
  };

  // The rectangle tool.
  tools.rect = function () {
    var tool = this;
    this.started = false;

    this.mousedown = function (ev) {
      tool.started = true;
      tool.x0 = ev._x;
      tool.y0 = ev._y;
    };

    this.mousemove = function (ev) {
      if (!tool.started) {
        return;
      }

      var x = Math.min(ev._x,  tool.x0),
          y = Math.min(ev._y,  tool.y0),
          w = Math.abs(ev._x - tool.x0),
          h = Math.abs(ev._y - tool.y0);

	  var context = canvasOverlayContextList[ev.currentTarget.id];
	  var canvas = canvasOverlayList[ev.currentTarget.id];
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (!w || !h) {
        return;
      }

      context.strokeRect(x, y, w, h);
    };

    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update(ev.currentTarget.id);
      }
    };
  };

  // The line tool.
  tools.line = function () {
    var tool = this;
    this.started = false;

    this.mousedown = function (ev) {
      tool.started = true;
      tool.x0 = ev._x;
      tool.y0 = ev._y;
    };

    this.mousemove = function (ev) {
      if (!tool.started) {
        return;
      }
	  var context = canvasOverlayContextList[ev.currentTarget.id];
	  var canvas = canvasOverlayList[ev.currentTarget.id];
      context.clearRect(0, 0, canvas.width, canvas.height);

      context.beginPath();
      context.moveTo(tool.x0, tool.y0);
      context.lineTo(ev._x,   ev._y);
      context.stroke();
      context.closePath();
    };

    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update(ev.currentTarget.id);
      }
    };
  };

  init();

}, false); }

// vim:set spell spl=en fo=wan1croql tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

