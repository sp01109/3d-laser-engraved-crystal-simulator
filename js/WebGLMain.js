/**
* Entry point
*/
var app = null;
function webGLStart(canvasId){
	//init webgl context
	app = new WebGLApp(canvasId);
    app.configureGLHook = configure;
    app.loadSceneHook   = load;
    app.drawSceneHook   = drawScene;
    app.run();
}

/**
*  Configures the gl context
*/
var camera = null;
var interactor = null;
function configure(){
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(100.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    //Creates and sets up the camera location
    camera = new Camera();
    camera.goHome([0,20,0]);
    camera.hookRenderer = drawScene;
    
    //Creates and sets up the mouse and keyboard interactor
    interactor = new CameraInteractor(camera, app.canvas);
    
    //Update lights for this example
    gl.uniform4fv(prg.uLightAmbient,      [0.1,0.1,0.1,1.0]);
    gl.uniform3fv(prg.uLightPosition,     [0, 0, 100]);
    gl.uniform4fv(prg.uLightDiffuse,      [0.7,0.7,0.7,1.0]);
    
    //init gui with camera settings
    //initGUIWithCameraSettings();
}

/**
* Loads the scene
*/
function load(){
    //TODO: load stans and light
    var obj = {vertices:[],indices:[]};
    obj.vertices = [0.0,0.0,0.3, -0.3,-0.3,0.0, 0.3,-0.3,0.0, 0.0,0.3,0.0];
    obj.indices = [0,1,2, 1,0,3, 0,2,3, 2,1,3];
    Scene.addObject(obj);
}

/**
* Maps the matrices to shader matrix uniforms
*
* Called once per rendering cycle. 
*/
function setMatrixUniforms(){
    /* camera */
    gl.uniform3fv(prg.uCameraPosition, camera.position);

    /* light */
    gl.uniform3fv(prg.uLightPosition,   [0, 120, 120]);
    gl.uniform4fv(prg.uLightAmbient,    [0.20,0.20,0.20,1.0]);
    gl.uniform4fv(prg.uLightDiffuse,    [1.0,1.0,1.0,1.0]); 

    /* objects */
    var indices = [];
    var vertices = [];
    var vlength = 0;
    for (var k = 0; k < Scene.objects.length; k++) {
        var o = Scene.objects[k];
        //if more than one object, the indices have to be offset
        if(vlength == 0){
            indices = indices.concat(o.indices);
        }else{
            for (var i = 0; i < o.indices.length; i++) {
                indices.push(o.indices[i]+vlength); 
            }
        }
        vertices = vertices.concat(o.vertices);
        vlength += o.vertices.length/3; //used for offsetting next obj's indices
        //console.info("obj "+k+"'s # vertices: "+ o.vertices.length/3 + ", # indices:" + o.indices.length/3);
    }
    gl.uniform1i(prg.uInticesNumber, indices.length/3);
    gl.uniform1i(prg.uVerticesNumber, vertices.length/3);
    //console.info("== total # vertices:"+ vertices.length/3 + ", # indices: " + indices.length/3 +" ==");

    if(vertices.length > 0){
        if (!gl.getExtension('OES_texture_float')) {
            alert('no floating point texture support');
            return;
        }
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, prg.txTriangleIndices);
        gl.uniform1i(prg.uTriangleIndices, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, indices.length/3, 1, 0, gl.RGB, gl.FLOAT, new Float32Array(indices));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, prg.txTriangleVertices);
        gl.uniform1i(prg.uTriangleVertices, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, vertices.length/3, 1, 0, gl.RGB, gl.FLOAT, new Float32Array(vertices));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
}

/**
* Draw scene, will be called if any parameter is been changed
*/
function drawScene()
{
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1000.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, app.canvas.width, app.canvas.height);
    
    //set uniforms values (put light & obj info)
    setMatrixUniforms();

    //initialize plot vectices
    gl.enableVertexAttribArray(prg.aPlotPosition);
    gl.disableVertexAttribArray(prg.aVertexPosition);
    
    //set plot position in world space
    var corners = camera.getViewPlane();
    gl.bindBuffer(gl.ARRAY_BUFFER, camera.cornersVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corners), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(prg.aPlotPosition);
    gl.vertexAttribPointer(prg.aPlotPosition, 3, gl.FLOAT, false, 0, 0);
    
    //enable vertex position which cover the whole NDC
    gl.enableVertexAttribArray(prg.aVertexPosition);

    //start drawing ray tracing
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

/*
var timer = 0;
function flipAnim(){
	if (timer) {
	  clearInterval(timer);
	  timer = 0;
	}
	else {
	  timer = setInterval(drawScene, 15);
	}
}

var ratio;
function resizeCanvas(w){
	if (w == -1) {
	  document.getElementById('contrib').style.display = "none";
	  canvas.style.display = "none";
	  canvas.parentNode.style.position = "absolute";
	  canvas.parentNode.style.top = 0;
	  w = canvas.parentNode.parentNode.offsetWidth;
	  ratio = w / canvas.parentNode.parentNode.offsetHeight;
	  canvas.style.display = "";
	}
	else {
	  document.getElementById('contrib').style.display = "";
	  ratio = 1.6;
	  canvas.parentNode.style.position = "";
	  canvas.parentNode.style.top = "";
	  window.onresize = null;
	}
	canvas.width = w;
	canvas.height = w / ratio;

	gl.viewport(0, 0, canvas.width, canvas.height);

	t -= 0.03;
	drawScene();
}
/*
var resizeTimer = false;
function fullScreen() {
	window.onresize = function() {
	  if (resizeTimer) {
	    clearTimeout(resizeTimer);
	  }
	  resizeTimer = setTimeout(function() {
	    fullScreen();}, 100);
	};

	resizeCanvas(-1);
}*/
