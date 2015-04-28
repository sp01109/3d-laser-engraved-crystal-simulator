/**
* Camera Interactor
*
* This object listens for mouse and keyboard events on the canvas, then, it interprets them and sends the intended instruction to the camera
*/
function CameraInteractor(camera,canvas){
    
    this.camera = camera;
    this.canvas = canvas;
    this.update();
    
    this.dragging = false;
    this.x = 0;
    this.y = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.button = 0;
    this.ctrl = false;
    this.key = 0;
    
    this.MOTION_FACTOR = 10.0;
}

CameraInteractor.prototype.onMouseUp = function(ev){
    this.dragging = false;
}

CameraInteractor.prototype.onMouseDown = function(ev){
    this.dragging = true;
    this.x = ev.clientX;
	this.y = ev.clientY;
	this.button = ev.button;
}

CameraInteractor.prototype.onMouseMove = function(ev){
	this.lastX = this.x;
	this.lastY = this.y;
	this.x = ev.clientX;
    this.y = ev.clientY;
	
	if (!this.dragging) return;
	this.ctrl = ev.ctrlKey;
	this.alt = ev.altKey;
	var dx = (this.x - this.lastX)*0.5;
	var dy = (this.y - this.lastY)*0.5;
	
	if (this.button == 0) { 
		if(this.ctrl){
			this.translate(dy);
		}
		else{ 
			this.rotate(dx,dy);
		}
	}
}

CameraInteractor.prototype.onKeyDown = function(ev){
    var c = this.camera;
	
	this.key = ev.keyCode;
	this.ctrl = ev.ctrlKey;
	
	if (!this.ctrl){
		if (this.key == 38){
			c.changeElevation(10);
		}
		else if (this.key == 40){
			c.changeElevation(-10);
		}
		else if (this.key == 37){
			c.changeAzimuth(-10);
			
		}
		else if (this.key == 39){
			c.changeAzimuth(10);
		}
        else if (this.key == 87) {  //w -wide
        	c.changeFov(5);
            console.info('camera.FovY:'+c.fovy);
        }
        else if (this.key == 83) { //s - narrow
        	c.changeFov(-5);
            console.info('camera.FovY:'+c.fovy);
        }
        else if (this.key == 81) { //q - more closer
        	this.translate(-10);
        }
        else if (this.key == 65) { //a - move farer
        	this.translate(10);
        }
	}
     
}

CameraInteractor.prototype.onKeyUp = function(ev){
    if (ev.keyCode == 17){
		this.ctrl = false;
	}
}

CameraInteractor.prototype.update = function(){
    var self = this;
	var canvas = this.canvas;

	canvas.onmousedown = function(ev) {
		self.onMouseDown(ev);
    }

    canvas.onmouseup = function(ev) {
		self.onMouseUp(ev);
    }
	
	canvas.onmousemove = function(ev) {
		self.onMouseMove(ev);
    }
	
	window.onkeydown = function(ev){
		self.onKeyDown(ev);
	}
	
	window.onkeyup = function(ev){
		self.onKeyUp(ev);
	}
}

CameraInteractor.prototype.translate = function(value){
	var c = this.camera;
	c.dolly(value);
}

CameraInteractor.prototype.rotate = function(dx, dy){
	var camera = this.camera;
	var canvas = this.canvas;
	
	var delta_elevation = -20.0 / canvas.height;
	var delta_azimuth   = -20.0 / canvas.width;
				
	var nAzimuth = dx * delta_azimuth * this.MOTION_FACTOR;
	var nElevation = dy * delta_elevation * this.MOTION_FACTOR;
	
	camera.changeAzimuth(nAzimuth);
	camera.changeElevation(nElevation);
}