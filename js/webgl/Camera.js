/**
*   Camera
*/
var resolution = 10;
var CAMERA_ORBIT_TYPE    = 1;
var CAMERA_TRACKING_TYPE = 2;

function Camera(t){
    this.matrix     = mat4.create();
    this.up         = vec3.create();
    this.right      = vec3.create();
    this.normal     = vec3.create();
    this.position   = vec3.create();
    this.home       = vec3.create();
    this.azimuth    = 0.0;
    this.elevation  = 0.0;
    this.type       = t;
    this.steps      = 0;

    this.fovy       = 30;
    this.up_plane   = vec3.create();
    this.r_plane    = vec3.create();
    this.c_plane    = vec3.create(); //center of view plane
    this.l_plane    = vec3.create(); //left bottum of the view plane
    this.cornersVertexBuffer = gl.createBuffer();

    this.hookRenderer = null;
    this.hookGUIUpdate = null;
}

Camera.prototype.setType = function(t){
    
    this.type = t;
    
    if (t != CAMERA_ORBIT_TYPE && t != CAMERA_TRACKING_TYPE) {
        alert('Wrong Camera Type!. Setting Orbitting type by default');
        this.type = CAMERA_ORBIT_TYPE;
    }
}

Camera.prototype.goHome = function(h){
    if (h != null){
        this.home = h;
    }
    this.setPosition(this.home);
    this.setAzimuth(0);
    this.setElevation(0);
    this.steps = 0;
}

Camera.prototype.dolly = function(s){
    var c = this;
    
    var p =  vec3.create();
    var n = vec3.create();
    
    p = c.position;
    
    var step = s - c.steps;
    
    //vec3.normalize(c.normal,n);
    vec3.normalize(n, c.normal);
    
    var newPosition = vec3.create();
    
    if(c.type == CAMERA_TRACKING_TYPE){
        newPosition[0] = p[0] - step*n[0];
        newPosition[1] = p[1] - step*n[1];
        newPosition[2] = p[2] - step*n[2];
    }
    else{
        newPosition[0] = p[0];
        newPosition[1] = p[1];
        newPosition[2] = p[2] - step; 
    }
	
    c.setPosition(newPosition);
    c.steps = s;
}

Camera.prototype.setPosition = function(p){
    //vec3.set(p, this.position);
    this.position = vec3.clone(p);
    this.update();
}

Camera.prototype.setAzimuth = function(az){
    this.changeAzimuth(az - this.azimuth);
}

Camera.prototype.setFov = function(d) {
    if((this.fovy < 120 && this.fovy>0) || (this.fovy >15 && this.fovy<0)){
        this.fovy+=d;
    }
     this.update();   
}

Camera.prototype.changeAzimuth = function(az){
    var c = this;
    c.azimuth +=az;
    
    if (c.azimuth > 360 || c.azimuth <-360) {
		c.azimuth = c.azimuth % 360;
	}
    c.update();
}

Camera.prototype.setElevation = function(el){
    this.changeElevation(el - this.elevation);
}

Camera.prototype.changeElevation = function(el){
    var c = this;
    
    c.elevation +=el;
    
    if (c.elevation > 360 || c.elevation <-360) {
		c.elevation = c.elevation % 360;
	}
    c.update();
}

Camera.prototype.update = function(){
    if (this.type == CAMERA_TRACKING_TYPE){
        mat4.identity(this.matrix);
        mat4.translate(this.matrix, this.matrix, this.position);
        mat4.rotateY(this.matrix, this.matrix, this.azimuth * Math.PI/180);
        mat4.rotateX(this.matrix, this.matrix, this.elevation * Math.PI/180);
    }
    else {
        mat4.identity(this.matrix);
        mat4.rotateY(this.matrix, this.matrix, this.azimuth * Math.PI/180);
        mat4.rotateX(this.matrix, this.matrix, this.elevation * Math.PI/180);
        mat4.translate(this.matrix, this.matrix, this.position);
    }

    var m = this.matrix;
    vec4.transformMat4(this.right,  [1, 0, 0, 0], m);
    vec4.transformMat4(this.up,     [0, 1, 0, 0], m);
    vec4.transformMat4(this.normal, [0, 0, 1, 0], m);
    //mat4.multiplyVec4(m, [1, 0, 0, 0], this.right);
    //mat4.multiplyVec4(m, [0, 1, 0, 0], this.up);
    //mat4.multiplyVec4(m, [0, 0, 1, 0], this.normal);
    
    //view plane's 3d info
    this.r_plane = vec3.create(); //point to right
    vec3.cross(this.r_plane, this.up, this.normal);
    vec3.normalize(this.r_plane, this.r_plane);
    this.up_plane = vec3.create(); //view_up of the plane
    vec3.cross(this.up_plane, this.normal, this.r_plane);
    vec3.normalize(this.up_plane, this.up_plane);

    var d = 2*Math.tan(fovy/2)/c_height; //distance from camera to view plan
    vec3.scaleAndAdd(this.c_plane, this.position, this.normal,  -d);
    vec3.scaleAndAdd(this.l_plane, this.c_plane, this.r_plane,  -c_width/2);
    vec3.scaleAndAdd(this.l_plane, this.l_plane, this.up_plane, -c_height/2);
    /**
    * We only update the position if we have a tracking camera.
    * For an orbiting camera we do not update the position. If
    * you don't believe me, go ahead and comment the if clause...
    * Why do you think we do not update the position?
    */
    if(this.type == CAMERA_TRACKING_TYPE){
        vec4.transformMat4(this.position, [0, 0, 0, 1], m);
        //mat4.multiplyVec4(m, [0, 0, 0, 1], this.position);
    }
    
    //console.info('------------- update -------------');
    //console.info(' right: ' + vec3.str(this.right)+', up: ' + vec3.str(this.up)+',normal: ' + vec3.str(this.right));
    //console.info('   pos: ' + vec3.str(this.position));
    //console.info('   azimuth: ' + this.azimuth +', elevation: '+ this.elevation);
    if(this.hookRenderer){
        this.hookRenderer();
    }
    if(this.hookGUIUpdate){
        this.hookGUIUpdate();
    }
    
}

Camera.prototype.getViewPlane = function() {
    var tp_lf = this.getViewPlanePixel(0, 0);
    var tp_rt = this.getViewPlanePixel(c_width*resolution, 0);
    var bt_lf = this.getViewPlanePixel(0, c_height*resolution);
    var bt_rt = this.getViewPlanePixel(c_width*resolution, c_height*resolution);

    var corners = [tp_lf[0], tp_lf[1], tp_lf[2],
                   tp_rt[0], tp_rt[1], tp_rt[2],
                   bt_rt[0], bt_rt[1], bt_rt[2],
                   bt_lf[0], bt_lf[1], bt_lf[2]];
    return corners;  
};

Camera.prototype.getViewPlanePixel = function(i, j) {
    var pixel = vec3.create();
    vec3.scaleAndAdd(pixel, this.l_plane, this.r_plane, i/resolution);
    vec3.scaleAndAdd(pixel, pixel, this.up_plane, j/resolution);
    return pixel;
};

Camera.prototype.getViewTransform = function(){
    var m = mat4.create();
    mat4.invert(m, this.matrix);
    //mat4.inverse(this.matrix, m);
    return m;
}

