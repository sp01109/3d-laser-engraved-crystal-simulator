var gl = null;     // WebGL context
var prg = null;    // The program (shaders)
var c_width = 0;   // Variable to store the width of the canvas
var c_height = 0;  // Variable to store the height of the canvas

var controller; //control panel
var numObjectRecord = 0;
var cubeLenRecord = 0;
var cubeWidRecord = 0;
var cubeHigRecord = 0;

//object property
var PROPERTY_REGULAR = 0;
var PROPERTY_CLOUD_POINTS = 1;
var PROPERTY_CRYSTAL = 2;

//crystal cube
var cube = {};
cube.property = PROPERTY_CRYSTAL;
cube.vertices = [
	0.5,  0.5,  0.5, //0
	0.5,  0.5, -0.5, //1
    0.5, -0.5, -0.5, //2
    0.5, -0.5,  0.5, //3
   -0.5,  0.5, -0.5, //4
   -0.5,  0.5,  0.5, //5
   -0.5, -0.5,  0.5, //6
   -0.5, -0.5, -0.5  //7
];
cube.indices = [
	0,2,1, 0,3,2,
	1,4,0, 0,4,5,
	2,3,6, 2,6,7,
	4,7,6, 4,6,5,
	0,6,3, 0,5,6,
	1,2,4, 2,7,4
];