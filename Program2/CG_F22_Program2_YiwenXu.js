"use strict";

var canvas, gl, program;
var uColor, isTerrian;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)
var NumHead = 7;    // one for top and others for the bottom
var NumAxis = 6;
var NumTerrian = 0;

var points = [];
var colors = [];

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0),

    vec4(0, 0, 1, 1),
    vec4(0, 0, -1, 1),
    vec4(1, 0, 0, 1),
    vec4(-1, 0, 0, 1),
    vec4(0, 1, 0, 1),
    vec4(0, -1, 0, 1),
];

// RGBA colors
var vertexColors = [
    vec4(0, 0, 0, 0.8),  // black

    vec4(39 / 255, 94 / 255, 151 / 255, 0.8),  // blue
    vec4(54 / 255, 125 / 255, 208 / 255, 0.8), // light blue
    vec4(20 / 255, 52 / 255, 84 / 255, 0.8),   // dark blue
    vec4(39 / 255, 94 / 255, 151 / 255, 0.8),  // blue
    vec4(54 / 255, 125 / 255, 208 / 255, 0.8), // light blue
    vec4(20 / 255, 52 / 255, 84 / 255, 0.8),   // dark blue

    vec4(100 / 255, 100 / 255, 100 / 255, 0.8),  //grey
    vec4(1.0, 0, 0, 1.0),  // Red

];


// Parameters controlling the size of the drill and axis
var BG_SIDE = 35;

var BASE_HEIGHT = 1.0;
var BASE_WIDTH = 5.0;

var LOWER_ARM_HEIGHT = 2.5;
var LOWER_ARM_WIDTH = 0.5;

var MID_ARM_HEIGHT = 5.0;
var MID_ARM_WIDTH = 1.0;

var UPPER_ARM_HEIGHT = 2.5;
var UPPER_ARM_WIDTH = 0.5;

var HEAD_HEIGHT = 2.0;
var HEAD_WIDTH = 2.0;

var AXIS_LENGTH = 10.0;

// Shader transformation matrices

var modelViewMatrix = mat4();
var projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;
var Head = 3;
var MidArm = 4;

var theta = [0, 0, 0, 0, 0];
var armTranslate = [0, 0, 0];
var envTheta = [0, 0, 0, 0];
// var rotateAxis = vec(1, 0, 0);

var angle = 0;

var flagHead = false;
var flagRotate = false;
var nowAxis = 0;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var modelViewMatrixLoc;

var vBuffer, cBuffer;

// Rotation angles of whole enviroment
var enviroment = {
    'thetaX': 0,
    'thetaY': 0,
    'thetaZ': 0,
}

var nRows = 30;
var nColumns = 30;

// Data for terrian function
var data = [];
for (var i = 0; i < nRows; ++i) {
    data.push([]);
    var x = Math.PI * (2 * i / nRows - 1.0);

    for (var j = 0; j < nColumns; ++j) {
        var y = Math.PI * (2 * j / nRows - 1.0);
        data[i][j] = (Math.sin(x) + Math.cos(y)) * 0.05;
    }
}

init();

//----------------------------------------------------------------------------

function quad(a, b, c, d) {
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[b]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[d]);
}


function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

// Calculate the coordinations of drill head
function pyramid() {
    points.push(vec4(0, 0.5, 0, 1.0));
    colors.push(vertexColors[0])

    let radius = 0.5;
    let NumHeadBottom = NumHead - 2;
    for (var i = 0; i < NumHeadBottom; i++) {
        let x = radius * Math.cos(i * (2 * Math.PI / NumHeadBottom));
        let z = radius * Math.sin(i * (2 * Math.PI / NumHeadBottom));
        points.push(vec4(x, -0.5, z, 1.0));
        colors.push(vertexColors[7]);
    }
    points.push(vec4(radius, -0.5, 0, 1.0));
    colors.push(vertexColors[7])

    points.push(vec4(0, -0.5, 0, 1.0));
    colors.push(vertexColors[0])
    for (var i = 0; i < NumHeadBottom; i++) {
        let x = radius * Math.cos(i * (2 * Math.PI / NumHeadBottom));
        let z = radius * Math.sin(i * (2 * Math.PI / NumHeadBottom));
        points.push(vec4(x, -0.5, z, 1.0));
        colors.push(vertexColors[7]);
    }
    points.push(vec4(radius, -0.5, 0, 1.0));
    colors.push(vertexColors[7]);

}

// Calculate the coordinations of axis
function axis() {
    for (var i = 0; i < NumAxis; i++) {
        points.push(vertices[8 + i]);
        colors.push(vertexColors[8]);
    }
}

// Calculate the coordinations of the terrian mesh
function mesh() {
    for (var i = 0; i < nRows - 1; i++) {
        for (var j = 0; j < nColumns - 1; j++) {
            points.push(vec4(2 * i / nRows - 1, data[i][j], 2 * j / nColumns - 1, 1.0));
            points.push(vec4(2 * (i + 1) / nRows - 1, data[i + 1][j], 2 * j / nColumns - 1, 1.0));
            points.push(vec4(2 * (i + 1) / nRows - 1, data[i + 1][j + 1], 2 * (j + 1) / nColumns - 1, 1.0));
            points.push(vec4(2 * i / nRows - 1, data[i][j + 1], 2 * (j + 1) / nColumns - 1, 1.0));

            NumTerrian += 4;

            colors.push(vertexColors[0]);
            colors.push(vertexColors[0]);
            colors.push(vertexColors[0]);
            colors.push(vertexColors[0]);
        }
    }
}


//--------------------------------------------------
//--------------------------------------------------

function addEvent() {
    // Control diff parts of drill
    document.getElementById("slider1").onpointermove = function (event) {
        theta[0] = event.target.value;
    };
    document.getElementById("slider2").onpointermove = function (event) {
        theta[1] = event.target.value;
    };
    document.getElementById("slider3").onpointermove = function (event) {
        theta[2] = event.target.value;
    };
    document.getElementById("slider4").onpointermove = function (event) {
        theta[4] = event.target.value;
    };

    // Control the translation in XZ-plane
    document.getElementById("translateX").onpointermove = function (event) {
        armTranslate[0] = event.target.value;
    };
    document.getElementById("translateZ").onpointermove = function (event) {
        armTranslate[2] = event.target.value;
    };

    // Control animated rotation of enviroment
    document.getElementById("rotationToggle").onclick = function (event) {
        flagRotate = !flagRotate;
    };
    document.getElementById("rotationX").onclick = function (event) {
        nowAxis = xAxis;
    };
    document.getElementById("rotationY").onclick = function (event) {
        nowAxis = yAxis
    };
    document.getElementById("rotationZ").onclick = function (event) {
        nowAxis = zAxis;
    };

    // Control the rotation of drill head
    document.getElementById("headToggle").onclick = function (event) {
        flagHead = !flagHead;
    };

}

function init() {

    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SCISSOR_TEST);     // enable sets a scissor box

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);

    colorCube();
    pyramid();
    axis();
    mesh();


    // Create and initialize  buffer objects

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);


    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    addEvent();

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    uColor = gl.getUniformLocation(program, "uColor");
    isTerrian = gl.getUniformLocation(program, "isTerrain");
    gl.uniform1i(isTerrian, 0);

    // Set projection
    projectionMatrix = ortho(-20, 20, -20, 20, -20, 20);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));


    render();
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------


function base() {
    var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * BASE_HEIGHT, 0.0), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));

    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

}

//----------------------------------------------------------------------------


function upperArm() {
    var s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));

    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

}

//----------------------------------------------------------------------------


function midArm() {
    var s = scale(MID_ARM_WIDTH, MID_ARM_HEIGHT, MID_ARM_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * MID_ARM_HEIGHT, 0.0), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));

    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

}
//----------------------------------------------------------------------------


function lowerArm() {
    var s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));

    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

}

//----------------------------------------------------------------------------


function head() {
    var s = scale(HEAD_WIDTH, HEAD_HEIGHT, HEAD_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * HEAD_HEIGHT, 0.0), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));

    gl.drawArrays(gl.TRIANGLE_FAN, NumVertices, NumHead);
    gl.drawArrays(gl.TRIANGLE_FAN, NumVertices + NumHead, NumHead)

}

//----------------------------------------------------------------------------


function axes() {
    var s = scale(AXIS_LENGTH, AXIS_LENGTH, AXIS_LENGTH);
    var instanceMatrix = mult(translate(0.0, 0, 0.0), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));

    gl.drawArrays(gl.LINES, NumVertices + NumHead * 2, NumAxis);

}

//----------------------------------------------------------------------------


function terrian() {
    gl.uniform1i(isTerrian, 1);
    for (var i = 0; i < NumTerrian; i += 4) {

        // Draw quad with gradient color
        gl.uniform4fv(uColor, vec4((102 + i * (153 / 3364)) / 255, 184 / 255, 98 / 255, 1.0));
        gl.drawArrays(gl.TRIANGLE_FAN, NumVertices + NumHead * 2 + NumAxis + i, 4);
        
        // Draw black mesh
        gl.uniform4fv(uColor, vec4(0.0, 0.0, 0.0, 1.0));
        gl.drawArrays(gl.LINE_LOOP, NumVertices + NumHead * 2 + NumAxis + i, 4);
    }
    gl.uniform1i(isTerrian, 0);
}

//----------------------------------------------------------------------------

// Draw all of objects (drill, mesh and axis)
function drawScene() {

    // Rotate whole drill and mesh
    if (flagRotate) {
        envTheta[nowAxis] += 1;
    }

    modelViewMatrix = mult(modelViewMatrix, rotate(envTheta[0], vec3(1, 0, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(envTheta[1], vec3(0, 1, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(envTheta[2], vec3(0, 0, 1)));
    axes();
    terrian();


    modelViewMatrix = mult(modelViewMatrix, translate(armTranslate[0], armTranslate[1], armTranslate[2]));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[Base], vec3(0, 1, 0)));
    base();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], vec3(0, 0, 1)));
    lowerArm();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[MidArm], vec3(0, 0, 1)));
    midArm();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, MID_ARM_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[UpperArm], vec3(0, 0, 1)));
    upperArm();

    // Rotate the head of drill
    if (flagHead) {
        theta[Head] += 5;
    };

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, UPPER_ARM_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[Head], vec3(0, 1, 0)));
    head();
}

//----------------------------------------------------------------------------


function render() {


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const { width, height } = gl.canvas;
    gl.viewport(0, 0, width, height);
    gl.scissor(0, 0, width, height);

    // Set camera pos for main view
    var eye = vec3(0, 0, 1.0);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);

    modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = mult(modelViewMatrix, translate(0, 0, 0));

    drawScene()

    //----------------------------------------------------------------------------
    // sets a scissor box at top left
    gl.viewport(0, height / 4 * 3, width / 4, height / 4);
    gl.scissor(0, height / 4 * 3, width / 4, height / 4);
    gl.clearColor(1, 0.8, 0.8, 1);

    // Set camera pos for second view
    eye = vec3(1.0, 1.0, 1.0);
    modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = mult(modelViewMatrix, translate(0, 0, 0));

    drawScene();


    requestAnimationFrame(render);
}
