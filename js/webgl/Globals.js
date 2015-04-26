var gl = null;     // WebGL context
var prg = null;    // The program (shaders)
var c_width = 0;   // Variable to store the width of the canvas
var c_height = 0;  // Variable to store the height of the canvas
var theObject = null;

var mvMatrix    = mat4.create();    // The Model-View matrix
var pMatrix     = mat4.create();    // The projection matrix
var nMatrix     = mat4.create();    // The normal matrix
var cMatrix     = mat4.create();    // The camera matrix

var requestUpdate = false;