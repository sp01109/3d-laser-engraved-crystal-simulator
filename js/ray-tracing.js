var gl;
var shaderProgram;
var aVertexPosition;

function webGLStart(){
	//init webgl context
	gl = canvas.getContext("experimental-webgl");
	//gl.viewport(0, 0, canvas.width, canvas.height);
	if (!gl) {
	  alert("The browser doesn't support webgl.");
	  return;
	}

	initShaders(); //not sure what it means

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);

	drawDefaultObj();
}




function getShader(gl, id)
{
  var shaderScript = document.getElementById(id);
  if (!shaderScript)
      return null;

  var shader;
  if (shaderScript.type == "x-shader/x-fragment")
  {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
  }
  else if (shaderScript.type == "x-shader/x-vertex")
  {
      shader = gl.createShader(gl.VERTEX_SHADER);
  }
  else
  {
      return null;
  }

  gl.shaderSource(shader, shaderScript.textContent);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
  {
      alert(gl.getShaderInfoLog(shader));
      return null;
  }

  return shader;
}

function initShaders(){
	var fragmentShader = getShader(gl, "shader-fs");
	var vertexShader = getShader(gl, "shader-vs");

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
	  alert("Could not initialise shaders");
	}

	gl.useProgram(shaderProgram);

	aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(aVertexPosition);

	aPlotPosition = gl.getAttribLocation(shaderProgram, "aPlotPosition");
	gl.enableVertexAttribArray(aPlotPosition);

	cameraPos = gl.getUniformLocation(shaderProgram, "cameraPos");
	sphere1Center = gl.getUniformLocation(shaderProgram, "sphere1Center");
	sphere2Center = gl.getUniformLocation(shaderProgram, "sphere2Center");
	sphere3Center = gl.getUniformLocation(shaderProgram, "sphere3Center");
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

	var plotPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, plotPositionBuffer);
	gl.vertexAttribPointer(aPlotPosition, 3, gl.FLOAT, false, 0, 0);
}

function loadDefaultObj(){
	vertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	var vertices = [
	     1.0,  1.0,
	    -1.0,  1.0,
	     1.0, -1.0,
	    -1.0, -1.0,
	];
}

function crossProd(v1, v2) {
return { x: v1.y*v2.z - v2.y*v1.z,
         y: v1.z*v2.x - v2.z*v1.x,
         z: v1.x*v2.y - v2.x*v1.y };
}

function normalize(v) {
l = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
return { x: v.x/l, y: v.y/l, z: v.z/l };
}

function vectAdd(v1, v2) {
return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z };
}

function vectSub(v1, v2) {
return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
}

function vectMul(v, l) {
return { x: v.x*l, y: v.y*l, z: v.z*l };
}

function pushVec(v, arr) {
arr.push(v.x, v.y, v.z);
}

t = 0;
function drawScene()
{
	x1 = Math.sin(t * 1.1) * 1.5;
	y1 = Math.cos(t * 1.3) * 1.5;
	z1 = Math.sin(t + Math.PI/3) * 1.5;
	x2 = Math.cos(t * 1.2) * 1.5;
	y2 = Math.sin(t * 1.4) * 1.5;
	z2 = Math.sin(t*1.25 - Math.PI/3) * 1.5;
	x3 = Math.cos(t * 1.15) * 1.5;
	y3 = Math.sin(t * 1.37) * 1.5;
	z3 = Math.sin(t*1.27) * 1.5;

	cameraFrom = { x: Math.sin(t * 0.4) * 18,
	               y: Math.sin(t * 0.13) * 5 + 5,
	               z: Math.cos(t * 0.4) * 18 };
	cameraTo = { x:0, y:0, z:0 };
	cameraPersp = 6;
	up = { x: 0, y: 1, z: 0 };
	cameraDir = normalize(vectSub(cameraTo, cameraFrom));

	cameraLeft = normalize(crossProd(cameraDir, up));
	cameraUp = normalize(crossProd(cameraLeft, cameraDir));
	// cameraFrom + cameraDir * cameraPersp
	cameraCenter = vectAdd(cameraFrom, vectMul(cameraDir, cameraPersp));
	// cameraCenter + cameraUp + cameraLeft * ratio
	cameraTopLeft  = vectAdd(vectAdd(cameraCenter, cameraUp),
	                         vectMul(cameraLeft, ratio));
	cameraBotLeft  = vectAdd(vectSub(cameraCenter, cameraUp),
	                         vectMul(cameraLeft, ratio));
	cameraTopRight = vectSub(vectAdd(cameraCenter, cameraUp),
	                         vectMul(cameraLeft, ratio));
	cameraBotRight = vectSub(vectSub(cameraCenter, cameraUp),
	                         vectMul(cameraLeft, ratio));


	//corners = [1.2, 1, -12, -1.2, 1, -12, 1.2, -1, -12, -1.2, -1, -12];
	corners = [];
	pushVec(cameraTopRight, corners);
	pushVec(cameraTopLeft, corners);
	pushVec(cameraBotRight, corners);
	pushVec(cameraBotLeft, corners);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corners), gl.STATIC_DRAW);

	gl.uniform3f(cameraPos, cameraFrom.x, cameraFrom.y, cameraFrom.z);
	gl.uniform3f(sphere1Center, x1, y1, z1);
	gl.uniform3f(sphere2Center, x2, y2, z2);
	gl.uniform3f(sphere3Center, x3, y3, z3);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	t += 0.03;
	if (t > Math.PI * 200) {
	  t -= Math.PI * 200;
	}
}

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
}
