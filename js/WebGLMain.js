/**
* Entry point
*/
var app = null;
function webGLStart(canvasId){
	//init webgl context
	app = new WebGLApp(canvasId);
    initLights();

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
	gl.clearColor(0.0,0.0,0.0, 1.0);
    gl.clearDepth(100.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    //Creates and sets up the camera location
    camera = new Camera(CAMERA_ORBIT_TYPE);
    camera.goHome([0,0,20]);
    camera.hookRenderer = drawScene;
    
    //Creates and sets up the mouse and keyboard interactor
    interactor = new CameraInteractor(camera, app.canvas);
    
    //Update lights for this example
    gl.uniform4fv(prg.uLightAmbient,      [0.1,0.1,0.1,1.0]);
    gl.uniform3fv(prg.uLightPosition,    [0, 200, 0]);
    gl.uniform4fv(prg.uLightDiffuse,      [0.7,0.7,0.7,1.0]);
    
    //init gui with camera settings
    //initGUIWithCameraSettings();
    
    //init transforms
    initTransforms();
}


function initLights(){
//Light uniforms
gl.uniform3fv(prg.uLightPosition,[4.5,3.0,15.0]);
gl.uniform4f(prg.uLightAmbient ,1.0,1.0,1.0,1.0);
gl.uniform4f(prg.uLightDiffuse,1.0,1.0,1.0,1.0);
gl.uniform4f(prg.uLightSpecular,1.0,1.0,1.0,1.0);

//Object Uniforms
gl.uniform4f(prg.uMaterialAmbient, 0.1,0.1,0.1,1.0);
gl.uniform4f(prg.uMaterialDiffuse, 1.0,1.0,1.0,1.0);
gl.uniform4f(prg.uMaterialSpecular, 1.0,1.0,1.0,1.0);
// uLightSpeculargl.uniform4f(prg.uMaterialAmbient, 0.1,0.1,0.1,1.0);
// gl.uniform4f(prg.uMaterialDiffuse,1.0,1.0,1.0,1.0);
// gl.uniform4f(prg.uMaterialSpecular, 1.0,1.0,1.0,1.0);
gl.uniform1f(prg.uShininess, 100.0);

}

/**
*   Defines the initial values for the transformation matrices
*/
function initTransforms(){
    //Initialize Model-View matrix
    mvMatrix = camera.getViewTransform();
    
    //Initialize Perspective matrix
    mat4.identity(pMatrix);
    
    //Initialize Normal matrix
    mat4.identity(nMatrix);
    mat4.set(mvMatrix, nMatrix);
    mat4.inverse(nMatrix);
    mat4.transpose(nMatrix);
 }

/**
* Loads the scene
*/
function load(){
    //TODO: load stans and light
   
    // var theObject = new OBJ.Mesh(trapezoidal_smooth5.obj);
    // Scene.loadObject('res/cone.json','cone');
    // Scene.addObject(theObject);

}

/**
* Draw scene, will be called if any parameter is been changed
*/
function drawScene()
{
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(100.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, app.canvas.width, app.canvas.height);

	try{
		//Model-View matrix mode setup camera->world
        mat4.perspective(fovy, app.canvas.width / app.canvas.height, 10, 5000.0, pMatrix);
        setMatrixUniforms();
        var updateLightPosition = false;
        gl.uniform1i(prg.uUpdateLight, updateLightPosition);
        
        for (var i = 0; i < Scene.objects.length; i++){
            var object = Scene.objects[i];

            if (object.alias == 'lightsource'){
                var lightPos = gl.getUniform(prg, prg.uLightPosition);
                mat4.translate(mvMatrix,lightPos);

                
            }

            //Setting uniforms
            gl.uniform4fv(prg.uMaterialDiffuse, object.diffuse);
            gl.uniform4fv(prg.uMaterialAmbient, object.ambient);
            gl.uniform4fv(prg.uMaterialSpecular, object.specular);



            gl.uniform1i(prg.uWireframe,object.wireframe);
            gl.uniform1i(prg.uPerVertexColor, object.perVertexColor);
            
            //Setting attributes
            gl.enableVertexAttribArray(prg.aVertexPosition);
            gl.disableVertexAttribArray(prg.aVertexNormal);
            gl.disableVertexAttribArray(prg.aVertexColor);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, object.vbo);
            gl.vertexAttribPointer(prg.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(prg.aVertexPosition);
            
            if(!object.wireframe){
                gl.bindBuffer(gl.ARRAY_BUFFER, object.nbo);
                gl.vertexAttribPointer(prg.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(prg.aVertexNormal);
            }
            
            if (object.perVertexColor){
                gl.bindBuffer(gl.ARRAY_BUFFER, object.cbo);
                gl.vertexAttribPointer(prg.aVertexColor,4,gl.FLOAT, false, 0,0);
                gl.enableVertexAttribArray(prg.aVertexColor);
            }


            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);
            
            if (object.wireframe){
                gl.drawElements(gl.LINES, object.indices.length, gl.UNSIGNED_SHORT,0);
            }
            else{
                gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT,0);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            
        }
    }
    catch(err){
        alert(err);
        console.error(err.description);
    }
}

/**
* Maps the matrices to shader matrix uniforms
*
* Called once per rendering cycle. 
*/
function setMatrixUniforms(){
    gl.uniformMatrix4fv(prg.uMVMatrix, false, camera.getViewTransform()); //Maps the Model-View matrix to the uniform prg.uMVMatrix
    
    gl.uniformMatrix4fv(prg.uPMatrix, false, pMatrix);    //Maps the Perspective matrix to the uniform prg.uPMatrix
    
    mat4.transpose(camera.matrix, nMatrix);               //Calculates the Normal matrix 
    gl.uniformMatrix4fv(prg.uNMatrix, false, nMatrix);    //Maps the Normal matrix to the uniform prg.uNMatrix
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

var resizeTimer = false;
function fullScreen() {
	window.onresize = function() {
	  if (resizeTimer) {
	    clearTimeout(resizeTimer);
	  }
	  resizeTimer = setTimeout(function() {
	    fullScreen();
	  }, 100);
	};

	resizeCanvas(-1);
}*/
