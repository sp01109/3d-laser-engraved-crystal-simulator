/**
*   Camera
*/
var resolution = 1;

function Camera(){
    this.home       = vec3.create();
    this.up         = vec3.create();
    this.right      = vec3.create();
    this.normal     = vec3.create();
    this.position   = vec3.create();
    this.azimuth    = 1.0;
    this.elevation  = 1.0;
    this.radius     = 20; 

    this.fovy       = 30;
    this.c_plane    = vec3.create(); //center of view plane
    this.lb_plane    = vec3.create(); //left bottum of the view plane
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
        vec3.set(this.home, h[0], h[1], h[2]);
    }
    this.steps = 0;
    this.setPosition(this.home);
    this.update();
}

Camera.prototype.dolly = function(s){
    var c = this;
    c.radius += s;
    if(c.radius > 100){ c.radius = 100;}
    if(c.radius < 10) { c.radius = 10;}
    this.update();
}

Camera.prototype.setPosition = function(p){
    this.setAzimuth(Math.atan(p[1]/p[0])*180/Math.PI);
    this.setElevation(Math.acos(p[2]/vec3.length(p))*180/Math.PI);
    this.update();
}

Camera.prototype.setAzimuth = function(az){
    this.changeAzimuth(az - this.azimuth);
}

Camera.prototype.changeFov = function(d) {
    if((this.fovy < 120 && d>0) || (this.fovy >15 && d<0)){
        this.fovy+=d;
    }
     this.update();   
}

Camera.prototype.changeAzimuth = function(az){
    var c = this;
    c.azimuth +=az;
    if(c.azimuth > 360){ c.azimuth -= 360;}
    if(c.azimuth <= 0) { c.azimuth+=360;}
    if(c.azimuth == 0) c.azimuth = 1;
    if(c.azimuth % 180 == 0) c.azimuth += 0.000001;

    c.update();
}

Camera.prototype.setElevation = function(el){
    this.changeElevation(el - this.elevation);
}

Camera.prototype.changeElevation = function(el){
    var c = this;
    
    c.elevation +=el;
    if(c.elevation >= 180){ c.elevation = 179.99999;}
    if(c.elevation <= 0) { c.elevation = 0.000001;}
    if((c.elevation)%90==0) c.elevation += 0.000001;

    c.update();
}

Camera.prototype.update = function(){
    var worldCenter = vec3.fromValues(0,0,0);
    //distance from center of world to camera
    var r = this.radius; 
    //position x,y,z of camera in the world 
    vec3.set(this.position, r*Math.sin(this.elevation*Math.PI/180)*Math.cos(this.azimuth*Math.PI/180)
                          , r*Math.sin(this.elevation*Math.PI/180)*Math.sin(this.azimuth*Math.PI/180)
                          , r*Math.cos(this.elevation*Math.PI/180));

    //caculate right, up, normal
    vec3.subtract(this.normal, worldCenter, this.position);
    vec3.normalize(this.normal, this.normal); //get norm
    var viewUp = vec3.fromValues(0,0,1); //virtual view up
    vec3.cross(this.right, viewUp, this.normal);
    vec3.normalize(this.right, this.right); //get right
    vec3.cross(this.up, this.normal, this.right);
    vec3.normalize(this.up, this.up); //get up

    //TODO: figure out the meaning of ratio
    var d = -2*Math.tan((this.fovy*Math.PI/180)/2)*20; //distance from camera to view plan
    vec3.scaleAndAdd(this.c_plane, this.position, this.normal,  -d);
    vec3.scaleAndAdd(this.lb_plane, this.c_plane, this.right,  -1/2);
    vec3.scaleAndAdd(this.lb_plane, this.lb_plane, this.up, -1/2);
    
    console.info('------------- update -------------');
    console.info(" world center: "+ vec3.str(worldCenter));
    console.info(" dist to center: "+ r);
    console.info(' right: ' + vec3.str(this.right));
    console.info(' up: ' + vec3.str(this.up));
    console.info(' normal: ' + vec3.str(this.normal));
    console.info(' pos: ' + vec3.str(this.position));
    console.info(' azimuth: ' + this.azimuth +', elevation: '+ this.elevation);

    console.info('------------- view plane -------------');
    console.info("dis_cam_view: "+ d);
    console.info("c_position: "+ vec3.str(this.position));
    console.info("c_plane: "+ vec3.str(this.c_plane));
    console.info("lb_plane: "+vec3.str(this.lb_plane));
    console.info(this.getViewPlane());
    
    if(this.hookRenderer){
        this.hookRenderer();
    }
    if(this.hookGUIUpdate){
        this.hookGUIUpdate();
    }
    
}

Camera.prototype.getViewPlane = function() {
    var ratio = 4;
    var tp_rt = vec3.create();
    vec3.scaleAndAdd(tp_rt, this.c_plane, this.up, ratio);
    vec3.scaleAndAdd(tp_rt, tp_rt, this.right, ratio);
    var bt_rt = vec3.create();
    vec3.scaleAndAdd(bt_rt, this.c_plane, this.up, -ratio);
    vec3.scaleAndAdd(bt_rt, bt_rt, this.right, ratio);
    var tp_lf = vec3.create();
    vec3.scaleAndAdd(tp_lf, this.c_plane, this.up, ratio);
    vec3.scaleAndAdd(tp_lf, tp_lf, this.right, -ratio);
    var bt_lf = vec3.create();
    vec3.scaleAndAdd(bt_lf, this.c_plane, this.up, -ratio);
    vec3.scaleAndAdd(bt_lf, bt_lf, this.right, -ratio);

    var corners = [tp_lf[0], tp_lf[1], tp_lf[2],
                   tp_rt[0], tp_rt[1], tp_rt[2],
                   bt_lf[0], bt_lf[1], bt_lf[2],
                   bt_rt[0], bt_rt[1], bt_rt[2]];
    //console.info(corners);
    return corners;  
}
