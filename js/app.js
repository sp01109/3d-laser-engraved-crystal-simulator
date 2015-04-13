
var gl;   // The webgl context.

var aCoords;           // Location of the coords attribute variable in the shader program.
var aCoordsBuffer;     // Buffer to hold coords.
var uColor;            // Location of the color uniform variable in the shader program.
var uProjection;       // Location of the projection uniform matrix in the shader program.
var uModelview;        // Location of the modelview unifirm matrix in the shader program.
var uNormal;           // Location of the normal uniform in the shader program.
var uLit;              // Location of the lit uniform in the shader program.
var uNormalMatrix;     // Location of the normalMatrix uniform matrix in the shader program.

var projection = mat4.create();   // projection matrix
var modelview = mat4.create();    // modelview matrix
var normalMatrix = mat3.create(); // matrix, derived from modelview matrix, for transforming normal vectors

var rotator;   // A SimpleRotator object to enable rotation by mouse dragging.

/* Draws a WebGL primitive.  The first parameter must be one of the constants
 * that specifiy primitives:  gl.POINTS, gl.LINES, gl.LINE_LOOP, gl.LINE_STRIP,
 * gl.TRIANGLES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN.  The second parameter must
 * be an array of 4 numbers in the range 0.0 to 1.0, giving the RGBA color of
 * the color of the primitive.  The third parameter must be an array of numbers.
 * The length of the array must be amultiple of 3.  Each triple of numbers provides
 * xyz-coords for one vertex for the primitive.  This assumes that uColor is the
 * location of a color uniform in the shader program, aCoords is the location of
 * the coords attribute, and aCoordsBuffer is a VBO for the coords attribute.
 */
function drawPrimitive( primitiveType, color, vertices ) {
     gl.enableVertexAttribArray(aCoords);
     gl.bindBuffer(gl.ARRAY_BUFFER,aCoordsBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
     gl.uniform4fv(uColor, color);
     gl.vertexAttribPointer(aCoords, 3, gl.FLOAT, false, 0, 0);
     gl.drawArrays(primitiveType, 0, vertices.length/3);
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    if (document.getElementById("persproj").checked) {
         mat4.perspective(projection, Math.PI/4, 1, 2, 10);
    }
    else {
         mat4.ortho(projection,-2.5, 2.5, -2.5, 2.5, 2, 10);
    }
    gl.uniformMatrix4fv(uProjection, false, projection );

    var modelview = rotator.getViewMatrix();
    gl.uniformMatrix4fv(uModelview, false, modelview );

    mat3.normalFromMat4(normalMatrix, modelview);
    gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);
    
    gl.uniform1i( uLit, 1 );  // Turn on lighting calculations for the cube.

    gl.uniform3f( uNormal, 0, 0, 1 );
    drawPrimitive( gl.TRIANGLE_FAN, [1,0,0,1], [ -1,-1,1, 1,-1,1, 1,1,1, -1,1,1 ]);
    gl.uniform3f( uNormal, 0, 0, -1 );
    drawPrimitive( gl.TRIANGLE_FAN, [0,1,0,1], [ -1,-1,-1, -1,1,-1, 1,1,-1, 1,-1,-1 ]);
    gl.uniform3f( uNormal, 0, 1, 0 );
    drawPrimitive( gl.TRIANGLE_FAN, [0,0,1,1], [ -1,1,-1, -1,1,1, 1,1,1, 1,1,-1 ]);
    gl.uniform3f( uNormal, 0, -1, 0 );
    drawPrimitive( gl.TRIANGLE_FAN, [1,1,0,1], [ -1,-1,-1, 1,-1,-1, 1,-1,1, -1,-1,1 ]);
    gl.uniform3f( uNormal, 1, 0, 0 );
    drawPrimitive( gl.TRIANGLE_FAN, [1,0,1,1], [ 1,-1,-1, 1,1,-1, 1,1,1, 1,-1,1 ]);
    gl.uniform3f( uNormal, -1, 0, 0 );
    drawPrimitive( gl.TRIANGLE_FAN, [0,1,1,1], [ -1,-1,-1, -1,-1,1, -1,1,1, -1,1,-1 ]);

    gl.uniform1i( uLit, 0 );  // The lines representing the coordinate axes are not lit.

    
}

/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type String is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 */
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
   var vsh = gl.createShader( gl.VERTEX_SHADER );
   gl.shaderSource(vsh,vertexShaderSource);
   gl.compileShader(vsh);
   if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
      throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
   }
   var fsh = gl.createShader( gl.FRAGMENT_SHADER );
   gl.shaderSource(fsh, fragmentShaderSource);
   gl.compileShader(fsh);
   if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
      throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
   }
   var prog = gl.createProgram();
   gl.attachShader(prog,vsh);
   gl.attachShader(prog, fsh);
   gl.linkProgram(prog);
   if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
      throw "Link error in program:  " + gl.getProgramInfoLog(prog);
   }
   return prog;
}


/* Gets the text content of an HTML element.  This is used
 * to get the shader source from the script elements that contain
 * it.  The parameter should be the id of the script element.
 */
function getTextContent( elementID ) {
    var element = document.getElementById(elementID);
    var fsource = "";
    var node = element.firstChild;
    var str = "";
    while (node) {
        if (node.nodeType == 3) // this is a text node
            str += node.textContent;
        node = node.nextSibling;
    }
    return str;
}


/**
 * Initializes the WebGL program including the relevant global variables
 * and the WebGL state.  Creates a SimpleView3D object for viewing the
 * cube and installs a mouse handler that lets the user rotate the cube.
 */
function init() {
   try {
        var canvas = document.getElementById("glcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            gl = canvas.getContext("experimental-webgl");
        }
        if ( ! gl ) {
            throw "Could not create WebGL context.";
        }
        var vertexShaderSource = getTextContent("vshader");
        var fragmentShaderSource = getTextContent("fshader");
        var prog = createProgram(gl,vertexShaderSource,fragmentShaderSource);
        gl.useProgram(prog);
        aCoords =  gl.getAttribLocation(prog, "coords");
        uModelview = gl.getUniformLocation(prog, "modelview");
        uProjection = gl.getUniformLocation(prog, "projection");
        uColor =  gl.getUniformLocation(prog, "color");
        uLit =  gl.getUniformLocation(prog, "lit");
        uNormal =  gl.getUniformLocation(prog, "normal");
        uNormalMatrix =  gl.getUniformLocation(prog, "normalMatrix");
        aCoordsBuffer = gl.createBuffer();
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);  // no need to draw back faces
        document.getElementById("persproj").checked = true;
        rotator = new SimpleRotator(canvas,draw);
        rotator.setView( [2,2,5], [0,1,0], 6 );
   }
   catch (e) {
      document.getElementById("message").innerHTML =
           "Could not initialize WebGL: " + e;
      return;
   }
   draw();
}

function updateScale(index,value) {
    scale[index] = value;
    draw();
}

function makeScale(sx, sy, sz) {
  return [
    sx, 0,  0,  0,
    0, sy,  0,  0,
    0,  0, sz,  0,
    0,  0,  0,  1,
  ];
}
    var scaleX = {scaleX:5};
    var scaleY = {scaleY:5};
    var scaleZ = {scaleZ:5};
    var lightnum={LightNumber:1};
    var lightcolor = {'LightColor':'blue'};
    var gui = new dat.GUI();
    var openfile = {openObj:0};


    gui.add(scaleX, 'scaleX').min(1).max(10).onChange(function(newValue){
        updateScale(0,newValue);
    });
    gui.add(scaleY, 'scaleY').min(1).max(10).onChange(function(newValue){
        updateScale(1,newValue);
    });
    gui.add(scaleZ, 'scaleZ').min(1).max(10).onChange(function(newValue){
        updateScale(2,newValue);
    });
    gui.add(lightnum,'LightNumber').options(0,1,2,3);
    gui.add(lightcolor,'LightColor').options('blue','green','red','yellow');
    gui.add(openfile, 'openObj').name('Open Obj File');
