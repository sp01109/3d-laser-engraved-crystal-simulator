var Program = {

    /**
    * Utilitary function that allows to set up the shaders (program) using an embedded script (look at the beginning of this source code)
    */
    getShader : function(gl, id) {
       var script = document.getElementById(id);
       if (!script) {
           return null;
       }

        var str = "";
        var k = script.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (script.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (script.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    },
    
    /**
    * The program contains a series of instructions that tell the Graphic Processing Unit (GPU)
    * what to do with every vertex and fragment that we pass it. 
    * The vertex shader and the fragment shader together are called the program.
    */
    load : function() {

        var fragmentShader          = Program.getShader(gl, "shader-fs");
        var vertexShader            = Program.getShader(gl, "shader-vs");

        prg = gl.createProgram();
        gl.attachShader(prg, vertexShader);
        gl.attachShader(prg, fragmentShader);


        //---------------------------------------------------
        // UPDATE:
        // March 31th 2014: make sure that the location 0 is always assigned
        // to the vertex position attribute. 
        //---------------------------------------------------
        /*
        Always have vertex attrib 0 array enabled. 
        If you draw with vertex attrib 0 array disabled, 
        you will force the browser to do complicated emulation 
        when running on desktop OpenGL (e.g. on Mac OSX). 

        This is because in desktop OpenGL, nothing gets drawn if vertex attrib 0 is not 
        array-enabled. You can use bindAttribLocation() to force a vertex attribute 
        to use location 0, and use enableVertexAttribArray() to make it array-enabled.

        taken from https://developer.mozilla.org/en-US/docs/Web/WebGL/WebGL_best_practices
        */

        gl.bindAttribLocation(prg, 0 , "aVertexPosition");
        //---------------------------------------------------// 
        gl.linkProgram(prg);

        if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(prg);

        prg.aVertexPosition  = gl.getAttribLocation(prg, "aVertexPosition");
        var vertices = [ //full size in NDC
             1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
            -1.0, -1.0
        ];
        var vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        //---------------------------------------------------// 
        gl.enableVertexAttribArray(prg.aVertexPosition);
        //---------------------------------------------------//
        gl.vertexAttribPointer(prg.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

        prg.aPlotPosition  = gl.getAttribLocation(prg, "aPlotPosition");

        //uniform variables' index
        prg.uCameraPosition   = gl.getUniformLocation(prg, "uCameraPosition");
        prg.uLightAmbient     = gl.getUniformLocation(prg, "uLightAmbient");
        prg.uLightDiffuse     = gl.getUniformLocation(prg, "uLightDiffuse");
        prg.uLightPosition    = gl.getUniformLocation(prg, "uLightPosition");
        prg.uSphereRadius     = gl.getUniformLocation(prg, "uSphereRadius");
        prg.uInticesNumber    = gl.getUniformLocation(prg, "uInticesNumber");
        prg.uVerticesNumber   = gl.getUniformLocation(prg, "uVerticesNumber");
        prg.uTriangleVertices = gl.getUniformLocation(prg, "uTriangleVertices");
        prg.uTriangleIndices  = gl.getUniformLocation(prg, "uTriangleIndices");

        //create memory to put vertices
        prg.txTriangleIndices = gl.createTexture(); 
        prg.txTriangleVertices = gl.createTexture();
    }
};