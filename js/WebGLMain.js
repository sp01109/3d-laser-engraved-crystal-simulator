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
    camera.goHome([110,110,-20]);
    camera.hookRenderer = drawScene;
    
    //Creates and sets up the mouse and keyboard interactor
    interactor = new CameraInteractor(camera, app.canvas);
}

/**
* Loads the scene
*/
function load(){
    //load cube
    Scene.addObject(cube);
}

/**
* Maps the matrices to shader matrix uniforms
*
* Called once per rendering cycle. 
*/
function setMatrixUniforms(update){
    /* camera */
    gl.uniform3fv(prg.uCameraPosition, camera.position);
    var strengthness = 0.4;
    var lightColors = [];
    lightColors.push(1-controller.lightColor1[0]*strengthness/255);
    lightColors.push(1-controller.lightColor1[1]*strengthness/255);
    lightColors.push(1-controller.lightColor1[2]*strengthness/255);
    lightColors.push(1-controller.lightColor2[0]*strengthness/255);
    lightColors.push(1-controller.lightColor2[1]*strengthness/255);
    lightColors.push(1-controller.lightColor2[2]*strengthness/255);
    lightColors.push(1-controller.lightColor3[0]*strengthness/255);
    lightColors.push(1-controller.lightColor3[1]*strengthness/255);
    lightColors.push(1-controller.lightColor3[2]*strengthness/255);
    lightColors.push(1-controller.lightColor4[0]*strengthness/255);
    lightColors.push(1-controller.lightColor4[1]*strengthness/255);
    lightColors.push(1-controller.lightColor4[2]*strengthness/255);

    /* light */
    //console.info("light colors: "+lightColors);
    gl.uniform4fv(prg.uLightAmbient, [0.05, 0.05, 0.05, 1.0]);
    gl.uniform3fv(prg.uLightColor,   lightColors);
    gl.uniform3fv(prg.uLightPosition,[5,3,0, 0,0,100, -3,-5,0, 0,0,-3]);
    gl.uniform3fv(prg.uLightCoefficient, [0.3,0.4,0.7, 0.0,0.2,0.9, 0.0,0.2,0.3]);

    /* tiny circles' radius */
    gl.uniform1f(prg.uSphereRadius, controller.pointRadius);
    gl.uniform1f(prg.uSphereDensity, 1.0/controller.pointDensity);

    /* objects */
    if(update == true ||
       Scene.objects.length     != numObjectRecord ||  //to avoid cpu overloading
       controller.crystalLength != cubeLenRecord   ||
       controller.crystalWidth  != cubeWidRecord   ||
       controller.crystalHeight != cubeHigRecord ){ 
        numObjectRecord = Scene.objects.length;
        cubeLenRecord   = controller.crystalLength;
        cubeWidRecord   = controller.crystalWidth;
        cubeHigRecord   = controller.crystalHeight;
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

            //crystal cube scaling matrix
            var adjestMatrix = mat4.create();
            var scaleVector = vec3.create();
            vec3.set(scaleVector, controller.crystalLength, controller.crystalWidth, controller.crystalHeight);
            mat4.scale(adjestMatrix, adjestMatrix, scaleVector);

            //input object rotation matrix
            var rotateM = mat4.create();
            mat4.rotateX(rotateM, rotateM, Math.PI/2);

            //input object max/min len, wid, hig, used for adjesting cube size automatically
            var objMax = [0,0,0];
            var objMin = [0,0,0];

            for(var i=0; i<o.vertices.length; i+=3){
                var v = vec3.create();
                vec3.set(v, o.vertices[i], o.vertices[i+1], o.vertices[i+2]);
                if(o.property == PROPERTY_CRYSTAL){
                    vec3.transformMat4(v, v, adjestMatrix);
                }else if(o.property == PROPERTY_CLOUD_POINTS){
                    vec3.transformMat4(v, v, rotateM);
                    for(var a=0; a<3; a++){
                        if(objMax[a] < v[a]) objMax[a] = v[a];
                        if(objMin[a] > v[a]) objMin[a] = v[a];
                    }
                }
                vertices.push(v[0]);
                vertices.push(v[1]);
                vertices.push(v[2]);
                vertices.push(o.property); //used 4th element for property
            }

            //setup cube size automatically
            if(o.property == PROPERTY_CLOUD_POINTS && update == true){
                controller.crystalLength = Math.floor(objMax[0]-objMin[0])+3;
                controller.crystalWidth  = Math.floor(objMax[1]-objMin[1])+3;
                controller.crystalHeight = Math.floor(objMax[2]-objMin[2])+3;
            }

            //accumulate # total vertices for offsetting next obj's indices
            vlength += o.vertices.length/3; 
            //console.info("obj "+k+"'s # vertices: "+ o.vertices.length/3 + ", # indices:" + o.indices.length/3);
        }
        gl.uniform1i(prg.uInticesNumber, indices.length/3);
        gl.uniform1i(prg.uVerticesNumber, vertices.length/4);
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
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, vertices.length/4, 1, 0, gl.RGBA, gl.FLOAT, new Float32Array(vertices));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
    }
}

/**
* Draw scene, will be called if any parameter is been changed
*/
function drawScene(update)
{
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1000.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, app.canvas.width, app.canvas.height);
    
    //set uniforms values (put light & obj info)
    setMatrixUniforms(update);

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
