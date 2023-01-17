"use strict";

var gl;
var program

var theta = [0, 0, 0];		// Rotation angles for x, y and z axes
var thetaLoc;			// Holds shader uniform variable location

//  uniform variable holder
var uX;
var uY;
var uTime;

// attribute variable holder
var aColor;
var aPosition;
var aStartAngle;
var aOffset;

var x = 0;  // uX
var y = 0;   // uY
var flag = false;		// Toggle Rotation Control
var isPedestal = true;    // Pedestal Display Control
var isConfetti = false;   // Confetti Display Control
var isOnlyInitialRotate = false;    // Only Rotate Initials Control

var speed = 50;

// Hold the data that will be buffered
var points;
var colors;
var angles;
var offsets;

var axis = 0;			// Currently active axis of rotation
var xAxis = 0;			//  Will be assigned on of these codes for
var yAxis = 1;			//  
var zAxis = 2;      //

var startTime = (window.performance || Date).now();

window.onload = init();

// When window on load
function init() {

  var canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext('webgl2');
  if (!gl) alert("WebGL 2.0 isn't available");

  //
  //  Configure WebGL
  //
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  //  Load shaders and initialize attribute buffers

  program = initShaders(gl, "vertex-shader", "fragment-shader");

  gl.useProgram(program);

  // Initialize event handlers
  loadEvent();
  // Initialize Data to Float32Array
  initializePoints();
  // Initialize GPU Buffers
  initializeGPUBuffers();


  gl.clearColor(0, 0, 0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Callback Render Method
  render();
};

// Callback Render Method
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Reset offset
  gl.uniform3fv(thetaLoc, [0, 0, 0]);
  gl.uniform1f(uX, 0);
  gl.uniform1f(uY, 1);
  gl.uniform1f(uTime, 0);

  // ====================================================
  // Confetti
  if (isConfetti) {
    gl.uniform1f(uTime, ((window.performance || Date).now() - startTime) / 1000);
    gl.drawArrays(gl.TRIANGLES, YNum + XNum + pedestalCurvedNum + pedestalLateralNum, confettiNum);
  }

  // ====================================================
  // Initials spin on the pedesta
  if (isOnlyInitialRotate) {
    gl.uniform1f(uX, 0);
    gl.uniform1f(uY, 0);
    gl.uniform1f(uTime, 0);
    axis = yAxis;
    theta[axis] += 0.017;

    // Draw Initials
    gl.uniform3fv(thetaLoc, [0, theta[axis], 0]);
    gl.drawArrays(gl.TRIANGLES, 0, YNum + XNum);

    // Draw pedestal
    gl.uniform3fv(thetaLoc, [0, 0, 0]);
    gl.drawArrays(gl.TRIANGLE_STRIP, YNum + XNum, pedestalCurvedNum);
    gl.drawArrays(gl.TRIANGLE_FAN, YNum + XNum + pedestalCurvedNum, pedestalLateralNum);

  }

  // ====================================================
  // Initials spin with the pedestal

  if (!isOnlyInitialRotate) {
    // update offset
    if (flag) {
      theta[axis] += 0.017;
    }
    gl.uniform3fv(thetaLoc, theta);
    gl.uniform1f(uX, x);
    gl.uniform1f(uY, y);
    gl.uniform1f(uTime, 0);

    // Draw pedestal
    if (isPedestal) {
      gl.drawArrays(gl.TRIANGLE_STRIP, YNum + XNum, pedestalCurvedNum);
      gl.drawArrays(gl.TRIANGLE_FAN, YNum + XNum + pedestalCurvedNum, pedestalLateralNum);
    }

    // Draw initials
    gl.drawArrays(gl.TRIANGLES, 0, YNum + XNum);
  }

  // Recall Render
  setTimeout(
    function () { requestAnimationFrame(render); },
    speed
  );
};

// Initialize event handlers
function loadEvent() {
  // Speed Slider
  document.getElementById("slider").onchange = function (event) {
    speed = 50 - event.target.value;
  };

  // Rotate Toggle
  document.getElementById("ButtonT").onclick = function () {
    flag = !flag;
  };

  // Pedestal Diaplay Toggle
  document.getElementById("ButtonP").onclick = function () {
    isPedestal = !isPedestal;
  };

  // Only Rotate Initials Toggle
  document.getElementById("ButtonI").onclick = function () {
    isOnlyInitialRotate = !isOnlyInitialRotate;
    flag = false;
    isPedestal = true;
  };

  // Confetti Display Toggle
  document.getElementById("ButtonC").onclick = function () {
    isConfetti = !isConfetti;
    startTime = (window.performance || Date).now();
  };

  // X Position Slider
  document.getElementById("X-slider").onpointermove = function (event) {
    x = event.target.value;
  };

  // Y Psition Slider
  document.getElementById("Y-slider").onpointermove = function (event) {
    y = event.target.value;
  };

  // Rotation Axis Change Buttons
  document.getElementById("xButton").onclick = function () {
    axis = xAxis;
  };
  document.getElementById("yButton").onclick = function () {
    axis = yAxis;
  };
  document.getElementById("zButton").onclick = function () {
    axis = zAxis;
  };

  // Control Speed and Rotation With Menu
  document.getElementById("Controls").onclick = function (event) {
    switch (event.target.index) {
      case 0:
        flag = !flag;
        break;

      case 1:
        speed /= 2.0;
        break;

      case 2:
        speed *= 2.0;
        break;
    }
  };

  // Control Speed and Rotation With Keyboard
  window.onkeydown = function (event) {
    var key = String.fromCharCode(event.keyCode);
    switch (key) {
      case '1':
        flag = !flag;
        break;

      case '2':
        speed /= 2.0;
        break;

      case '3':
        speed *= 2.0;
        break;
    }
  };
};

// Initialize Data to Float32Array
function initializePoints() {
  colors = new Float32Array(allColors);
  points = new Float32Array(YPoints.concat(XPoints).concat(pedestalPoints).concat(confettiPoints));
  angles = new Float32Array(startAngles);
  offsets = new Float32Array(offset);
};

// Initialize GPU Buffers
function initializeGPUBuffers() {

  // Color Buffer
  // Load the data into the GPU
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

  // Associate out shader variables with our data buffer
  aColor = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aColor);

  // Position Buffer
  // Load the data into the GPU
  var pointsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

  // Associate out shader variables with our data buffer
  aPosition = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);


  // =======================================================
  // For Confetti
  // Start Angles Buffer
  // Load the data into the GPU
  var anglesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, anglesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, angles, gl.STATIC_DRAW);

  // Associate out shader variables with our data buffer
  aStartAngle = gl.getAttribLocation(program, "aStartAngle");
  gl.vertexAttribPointer(aStartAngle, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aStartAngle);

  // Offset Buffer
  // Load the data into the GPU
  var offsetBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STATIC_DRAW);

  // Associate out shader variables with our data buffer
  aOffset = gl.getAttribLocation(program, "aOffset");
  gl.vertexAttribPointer(aOffset, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aOffset);

  // =======================================================
  // Associate Uniform Variable Location
  thetaLoc = gl.getUniformLocation(program, "uTheta");
  uX = gl.getUniformLocation(program, "uX");
  uY = gl.getUniformLocation(program, "uY");
  uTime = gl.getUniformLocation(program, "uTime");

};
