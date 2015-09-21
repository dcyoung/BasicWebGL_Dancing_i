
var gl;
var canvas;
var shaderProgram;
var vertexPositionBufferLeftSide;
var vertexPositionBufferRightSide

// Create a place to store vertex colors
var vertexColorBuffer;
var mvMatrix = mat4.create();
var lastTime = 0;
var framecount = 0;

var triangleVertices_init= [
    -0.4,   -0.6,   0.0,
    -0.4,   -0.4,   0.0,
    0.0,   -0.6,    0.0,
    -0.1,  -0.4,    0.0,
    0.0,    0.0,    0.0,
    -0.1,   0.4,    0.0,
    0.0,    0.6,    0.0,
    -0.4,   0.4,    0.0,
    -0.4,   0.6,    0.0
];
var triangleVertices_init2= [
    0.4,  -0.6,   0.0,
    0.4,  -0.4,   0.0,
    0.0,  -0.6,   0.0,
    0.1,  -0.4,   0.0,
    0.0,  0.0,    0.0,
    0.1,  0.4,    0.0,
    0.0,  0.6,    0.0,
    0.4,  0.4,    0.0,
    0.4,  0.6,    0.0
];

var triangleVertices= [
    -0.4,   -0.6,   0.0,
    -0.4,   -0.4,   0.0,
    0.0,   -0.6,    0.0,
    -0.1,  -0.4,    0.0,
    0.0,    0.0,    0.0,
    -0.1,   0.4,    0.0,
    0.0,    0.6,    0.0,
    -0.4,   0.4,    0.0,
    -0.4,   0.6,    0.0
];

var triangleVertices2= [
    0.4,  -0.6,   0.0,
    0.4,  -0.4,   0.0,
    0.0,  -0.6,   0.0,
    0.1,  -0.4,   0.0,
    0.0,  0.0,    0.0,
    0.1,  0.4,    0.0,
    0.0,  0.6,    0.0,
    0.4,  0.4,    0.0,
    0.4,  0.6,    0.0
];

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  
}

function updateVerticesForBuffers() {
    for(var i = 0; i < triangleVertices.length; i++) {
        triangleVertices[i] = triangleVertices_init[i] + 0.1 * Math.sin(2*Math.PI* (framecount / 120.0) )
    }

    for(var i = 0; i < triangleVertices2.length; i++) {
        triangleVertices2[i] = triangleVertices_init2[i] + 0.1 * Math.sin(2*Math.PI* (framecount / 120.0) )
    } 
}


function setupBuffers() {
	//var rotAngle = 0
  vertexPositionBufferLeftSide = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferLeftSide);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices_init), gl.DYNAMIC_DRAW);
  vertexPositionBufferLeftSide.itemSize = 3;
  vertexPositionBufferLeftSide.numberOfItems = 9;
    
    vertexPositionBufferRightSide = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferRightSide);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices_init2), gl.DYNAMIC_DRAW);
    vertexPositionBufferRightSide.itemSize = 3;
    vertexPositionBufferRightSide.numberOfItems = 9;    
    
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
        1.0, 0.90, 0.0, 1.0,
        1.0, 0.80, 0.0, 1.0,
        1.0, 0.70, 0.0, 1.0,
        1.0, 0.60, 0.0, 1.0,
        1.0, 0.50, 0.0, 1.0,
        1.0, 0.40, 0.0, 1.0,
        1.0, 0.30, 0.0, 1.0,
        1.0, 0.20, 0.0, 1.0,
        1.0, 0.10, 0.0, 1.0
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 9;  
}

function draw() { 
    
    
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
  mat4.identity(mvMatrix);
  //mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotAngle));  
    drawHelper(vertexPositionBufferLeftSide);
    drawHelper(vertexPositionBufferRightSide);

}
function drawHelper(buff){
     gl.bindBuffer(gl.ARRAY_BUFFER, buff);
    
    if(buff == vertexPositionBufferLeftSide){
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
        vertexPositionBufferLeftSide.itemSize = 3;
        vertexPositionBufferLeftSide.numberOfItems = 9;
    }
    else if(buff == vertexPositionBufferRightSide){
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices2), gl.DYNAMIC_DRAW);
        vertexPositionBufferRightSide.itemSize = 3;
        vertexPositionBufferRightSide.numberOfItems = 9;
    }
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         buff.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();
  gl.drawArrays(gl. TRIANGLE_STRIP, 0, buff.numberOfItems);
}

function animate() {
    var timeNow = new Date().getTime();
    var elapsed = timeNow - lastTime;
    lastTime = timeNow;    
    updateVerticesForBuffers();  
}


function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

function tick() {
    framecount++
    requestAnimFrame(tick);
    draw();
    animate();    
}

