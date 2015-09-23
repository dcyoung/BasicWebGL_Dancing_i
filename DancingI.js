/* Summary: 
    This script animates a capital letter "I" to look like it is bouncing 
    similar to the old pixar lamp. It draws the letter using 2 triangle strips with 
    no degenerate triangles, and then animates the movements using keyframes. 
    
    The animation was broken into 4 basic positions and each was assigned a keyframe:
        -pre squash
        -squash
        -post squash
        -hover
    Each keyframe is a matrix of vertex positions defining the form of the left half 
    only for that keyframe's specific pose. Because the letter "I" is symmetrical, 
    it was possible to use only the left half and calculate the vertex positions of 
    the right half based off the left. A set of matrices (triangleVerticesLeftSide,
    and triangleVerticesRightSide) hold the current vertex position for the left
    and right sides of the animated letter at all times. The matrices for the keyframes
    simply define target positions and do not change over time. 
    
    To aniamte the bouncing letter, the actual vertices for the current position are 
    updated to interpolate between different keyframe targets in the proper sequence. 
    A library called TWEEN (short for in-between), was used to interpolate the vertex 
    positions between different keyframes and then those tweens were chained together 
    in the correct order to create a looping animation. Again, because the letter is 
    symetric, the tweens only interpolate values for the left half of the letter and
    then everytime they update, a function is called to also update the right half of
    the letter by simply looking at the newly updated left half.    
    
*/

var gl;
var canvas;
var shaderProgram;
var vertexPositionBufferLeftSide;
var vertexPositionBufferLeftSideLines
var vertexPositionBufferRightSide

// Create a place to store vertex colors
var vertexColorBuffer;
var mvMatrix = mat4.create();
var lastTime = 0;
var framecount = 0;



//create two matrices to hold the current vertex positions for each half of the letter
var triangleVerticesLeftSide= [
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

var triangleVerticesRightSide= [
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


//Define the keyframe... each is simply a matrix of vertex positions
//for the left half of the letter "I" for specific pose.
var keyLeft_PostSquash = [
    -0.4,   -1.0,   0.0,
    -0.4,   -0.8,   0.0,
    0.0,   -1.0,    0.0,
    -0.1,  -0.8,    0.0,
    0.0,    -0.4,    0.0,
    -0.1,   0.0,    0.0,
    0.0,    0.2,    0.0,
    -0.4,   -0.02,    0.0,
    -0.42,   0.18,    0.0
];
var keyLeft_PreSquash = [
    -0.4,   -1.0,   0.0,
    -0.4,   -0.8,   0.0,
    0.0,   -1.0,    0.0,
    -0.1,  -0.8,    0.0,
    0.0,    -0.4,    0.0,
    -0.1,   0.0,    0.0,
    0.0,    0.2,    0.0,
    -0.43,   0.02,    0.0,
    -0.4,   0.22,    0.0
];
var keyLeft_Squash = [
    -0.6,	-1.0,	0,
    -0.6,	-0.7,	0,
    0.0,	-1.0,	0,
    -0.2,	-0.9,	0,
    0.0,	-0.5,	0,
    -0.1,	-0.5,	0,
    0.0,	-0.4,	0,
    -0.4,	-0.6,	0,
    -0.42,	-0.5,	0
];
var triangleVertices_Hover= [
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


//Initialize the Tweens that will be used to interpolate to each keyframe
var tweenKey_Left_PreSquash = new TWEEN.Tween(triangleVerticesLeftSide).to(keyLeft_PreSquash,700).easing(TWEEN.Easing.Quadratic.In);
var tweenKey_Left_PostSquash = new TWEEN.Tween(triangleVerticesLeftSide).to(keyLeft_PostSquash,500).easing(TWEEN.Easing.Quadratic.In);
var tweenKey_Left_Squash = new TWEEN.Tween(triangleVerticesLeftSide).to(keyLeft_Squash,500).easing(TWEEN.Easing.Quadratic.Out);
var tweenKey_Left_Hover = new TWEEN.Tween(triangleVerticesLeftSide).to(triangleVertices_Hover,1000).easing(TWEEN.Easing.Quadratic.Out);



function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
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


//old method, no longer used
//function updateVerticesForBuffers() {
//    for(var i = 0; i < triangleVerticesLeftSide.length; i++) {
//        triangleVerticesLeftSide[i] = triangleVertices_initLeftSide[i] + 0.1 * Math.sin(2*Math.PI* (framecount / 120.0) )
//    }
//
//    for(var i = 0; i < triangleVerticesRightSide.length; i++) {
//        triangleVerticesRightSide[i] = triangleVertices_initRightSide[i] + 0.1 * Math.sin(2*Math.PI* (framecount / 120.0) )
//    } 
//    
//}


//update the vertices for the right half of the letter "I" to match whats been changed/interpolated for the left side
function updateOtherSideVertices(){
    for(var i = 0; i < triangleVerticesLeftSide.length; i+=3) {
        triangleVerticesRightSide[i] = -triangleVerticesLeftSide[i];
        triangleVerticesRightSide[i+1] = triangleVerticesLeftSide[i+1];  
    }   
}

//setup the buffers
function setupBuffers() {
    //vertex position buffer for the left side of the capital letter I
    vertexPositionBufferLeftSide = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferLeftSide);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVerticesLeftSide), gl.DYNAMIC_DRAW);
    vertexPositionBufferLeftSide.itemSize = 3;
    vertexPositionBufferLeftSide.numberOfItems = 9;
    
    //vertex position buffer for the right side of the capital letter I
    vertexPositionBufferRightSide = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferRightSide);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVerticesRightSide), gl.DYNAMIC_DRAW);
    vertexPositionBufferRightSide.itemSize = 3;
    vertexPositionBufferRightSide.numberOfItems = 9;    
    
    //vertex color buffer, will work for both sides
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
        1.0, 0.10, 0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = 9;  
}


//setup the tweens including chaining order and on update
function setupTweens(){
    //make sure that every time the tween interpolates values for the left side, 
    //it also copies those values (making note of x-flip) to the right vertices as well
    tweenKey_Left_Hover.onUpdate(updateOtherSideVertices);
    tweenKey_Left_PostSquash.onUpdate(updateOtherSideVertices);
    tweenKey_Left_PreSquash.onUpdate(updateOtherSideVertices);
    tweenKey_Left_Squash.onUpdate(updateOtherSideVertices);
    
    //setup the order of the keyframes by chaining the tweens in the following order:
    //hover->fall->squash->jump->hover->repeat
    tweenKey_Left_PostSquash.chain(tweenKey_Left_Hover);
    tweenKey_Left_Hover.chain(tweenKey_Left_PreSquash);
    tweenKey_Left_PreSquash.chain(tweenKey_Left_Squash);
    tweenKey_Left_Squash.chain(tweenKey_Left_PostSquash);

    //choose the hover to start with
    tweenKey_Left_Hover.start();

}



//draw the capital letter "I" by first clearing the viewport and then drawing each array carrying a side of the "I" 
function draw() { 
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
    mat4.identity(mvMatrix);
 
    drawHelper(vertexPositionBufferLeftSide, document.getElementById("doUseWireframe").checked);
    drawHelper(vertexPositionBufferRightSide, document.getElementById("doUseWireframe").checked);
}


//helper function to draw a buffer with conditionals on what type of buffer is being drawn
//permits calling a single function even if the left or right side of the letter is being drawn
function drawHelper(buff, bDrawLines){
     gl.bindBuffer(gl.ARRAY_BUFFER, buff);
    
    //make sure the buffer data is set using the proper array (left or right side)
    if(buff == vertexPositionBufferLeftSide){
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVerticesLeftSide), gl.DYNAMIC_DRAW);
        vertexPositionBufferLeftSide.itemSize = 3;
        vertexPositionBufferLeftSide.numberOfItems = 9;
    }
    else if(buff == vertexPositionBufferRightSide){
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVerticesRightSide), gl.DYNAMIC_DRAW);
        vertexPositionBufferRightSide.itemSize = 3;
        vertexPositionBufferRightSide.numberOfItems = 9;
    }
    
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         buff.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
    setMatrixUniforms();
    
    //draw the buffer as lines if the function was asked to do so, and triangles if not
    if(bDrawLines == true){
        if(buff == vertexPositionBufferLeftSide){
            for(var i = 0; i < triangleVerticesLeftSide.length-2; i++) {
                gl.drawArrays(gl.LINE_LOOP, i, 3);
            }
        }
        else if(buff == vertexPositionBufferRightSide){
            for(var i = 0; i < triangleVerticesRightSide.length-2; i++) {
                gl.drawArrays(gl.LINE_LOOP, i, 3);
            }
        }
    }
    else{
        gl.drawArrays(gl. TRIANGLE_STRIP, 0, buff.numberOfItems);
    }
}

//update the last time, no longer used 
//function animate() {
//    var timeNow = new Date().getTime();
//    var elapsed = timeNow - lastTime;
//    lastTime = timeNow;    
//    //updateVerticesForBuffers();  
//}


function startup() {
    //get the canvas by the DOM element id and create a GL context
    canvas = document.getElementById("myGLCanvas");
    gl = createGLContext(canvas);
    //setup the shaders and buffers
    setupShaders(); 
    setupBuffers();
    //clear the background to be just black
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    //setup the tweens which will handle interpolating values between keyframes
    setupTweens();
    
    //kickoff the tick function which will keep the program going from here
    tick();
}

//every tick update the tweens and draw things
function tick() {
    framecount++
    requestAnimFrame(tick);
    draw();
    TWEEN.update();
}

