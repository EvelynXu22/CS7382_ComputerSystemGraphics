"use strict";

var canvas, gl, program1, program2, program3;
var modelViewMatrix, projectionMatrix;
var vBuffer, cBuffer, nBuffer;
var modelViewMatrixLoc;
var nMatrix, nMatrixLoc;

var projection = 18;

var NumQuad = 6;
var NumTerrian = 0;

var points = [];
var colors = [];
var normals = [];
var positionsArray = [];
var texCoordsArray = [];


var vertices = [
    vec4(-0.5, -0.5, 0, 1.0),
    vec4(-0.5, 0.5, 0, 1.0),
    vec4(0.5, 0.5, 0, 1.0),
    vec4(0.5, -0.5, 0, 1.0),
]


var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var vertexColors = [
    vec4(0, 0, 0, 0.8),  // black
    vec4(100 / 255, 100 / 255, 100 / 255, 0.8),  //grey
    vec4(211 / 255, 143 / 255, 66 / 255, 0.8),  //ground

]

var BASE_HEIGHT = 2.0;
var BASE_WIDTH = 5.0;

var LOWER_ARM_HEIGHT = 5.0;
var LOWER_ARM_WIDTH = 1.0;

var UPPER_ARM_HEIGHT = 5.0;
var UPPER_ARM_WIDTH = 1.0;

var HEAD_HEIGHT = 6.0;
var HEAD_WIDTH = 6.0;

var MESH_WIDTH = 10.0;
var MESH_HEIGHT = 10.0;

var SCENE_WIDTH = 1;
var SCENE_HEIGHT = 1;

var Base = 0;
var UpperArm = 1;
var Head = 2;

var theta = [0, 0, 0];
var envTheta = [0, 0, 0];
var objTranslate = [0, 0, 0];

var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;
var lightTheta = 0;

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


var meshNormal = vec4(0.0, 0.0, 1.0, 0.0);

var lightPosition = vec4(1.0, -1.0, 0, 1.0);

var ambient = [0.2, 0.2, 0.2, 1.0];
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(0.7, 0.7, 0.7, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialShininess = 100.0;

var ambientProduct = mult(lightAmbient, materialAmbient);
var diffuseProduct = mult(lightDiffuse, materialDiffuse);
var specularProduct = mult(lightSpecular, materialSpecular);

var texturNormal, imageConverted;
var imageWidth, imageHeigh;

//----------------------------------------------------------------------------

function configureTexture(image, width, height) {

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

}

function configureTexture1(image, width, height) {

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

//----------------------------------------------------------------------------

// Calculate Bump Data
function bumpData(rawData) {

    var texSize = 128;
    // Bump Data

    var dataBump = new Array()
    for (var i = 0; i <= texSize; i++)  dataBump[i] = new Array();
    for (var i = 0; i <= texSize; i++) for (var j = 0; j <= texSize; j++)
        dataBump[i][j] = rawData[i * 128 + j];


    // Bump Map Normals

    var normalst = new Array()
    for (var i = 0; i < texSize; i++)  normalst[i] = new Array();
    for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++)
        normalst[i][j] = new Array();
    for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++) {
        normalst[i][j][0] = dataBump[i][j] - dataBump[i + 1][j];
        normalst[i][j][1] = dataBump[i][j] - dataBump[i][j + 1];
        normalst[i][j][2] = 1;
    }

    // Scale to Texture Coordinates

    for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++) {
        var d = 0;
        for (k = 0; k < 3; k++) d += normalst[i][j][k] * normalst[i][j][k];
        d = Math.sqrt(d);
        for (k = 0; k < 3; k++) normalst[i][j][k] = 0.5 * normalst[i][j][k] / d + 0.5;
    }

    // Normal Texture Array
    texturNormal = new Uint8Array(3 * texSize * texSize);

    for (var i = 0; i < texSize; i++)
        for (var j = 0; j < texSize; j++)
            for (var k = 0; k < 3; k++)
                texturNormal[3 * texSize * i + 3 * j + k] = 255 * normalst[i][j][k];
}

// Locate mapping coordinates
function textureMesh() {
    positionsArray.push(vertices[1]);
    texCoordsArray.push(texCoord[1]);

    positionsArray.push(vertices[0]);
    texCoordsArray.push(texCoord[0]);

    positionsArray.push(vertices[3]);
    texCoordsArray.push(texCoord[3]);

    positionsArray.push(vertices[2]);
    texCoordsArray.push(texCoord[2]);
}

function triangle(a, b, c) {

    // console.log(a, b, c)

    var t1 = subtract(b, a);
    var t2 = subtract(c, a);

    // console.log(t1, t2)
    // console.log(cross(t2, t1))

    var normal = normalize(cross(t2, t1));
    normal = vec4(normal[0], normal[1], normal[2], 0.0);

    normals.push(normal);
    normals.push(normal);
    normals.push(normal);

    points.push(a);
    points.push(b);
    points.push(c);
}

function quad(a, b, c, d, color) {
    triangle(vertices[a], vertices[b], vertices[c]);
    triangle(vertices[a], vertices[c], vertices[d]);

    colors.push(vertexColors[color]);
    colors.push(vertexColors[color]);
    colors.push(vertexColors[color]);
    colors.push(vertexColors[color]);
    colors.push(vertexColors[color]);
    colors.push(vertexColors[color]);
}

// Get all quads pos and color vertex
function colorQuads() {
    quad(1, 0, 3, 2, 0);
    quad(1, 0, 3, 2, 1);
}

// Get all mesh pos and color vertex
function mesh() {
    for (var i = 0; i < nRows - 1; i++) {
        for (var j = 0; j < nColumns - 1; j++) {
            let a = vec4(2 * i / nRows - 1, data[i][j], 2 * j / nColumns - 1, 1.0);
            let b = vec4(2 * (i + 1) / nRows - 1, data[i + 1][j], 2 * j / nColumns - 1, 1.0);
            let c = vec4(2 * (i + 1) / nRows - 1, data[i + 1][j + 1], 2 * (j + 1) / nColumns - 1, 1.0);
            let d = vec4(2 * i / nRows - 1, data[i][j + 1], 2 * (j + 1) / nColumns - 1, 1.0);

            var t1 = subtract(b, a);
            var t2 = subtract(c, a);
            var t3 = subtract(d, a)
            var normal = normalize(cross(t2, t1));
            normal = vec4(normal[0], normal[1], normal[2], 0.0);

            normals.push(normal);
            normals.push(normal);

            var normal = normalize(cross(t3, t2));
            normal = vec4(normal[0], normal[1], normal[2], 0.0);

            normals.push(normal);
            normals.push(normal);

            points.push(a);
            points.push(b);
            points.push(c);
            points.push(d);

            colors.push(vertexColors[2]);
            colors.push(vertexColors[2]);
            colors.push(vertexColors[2]);
            colors.push(vertexColors[2]);

            NumTerrian += 4;
        }
    }
}

//----------------------------------------------------------------------------

function addEvent() {

    // Control the joints
    document.getElementById("slider1").onpointermove = function (event) {
        theta[0] = event.target.value;
    };
    document.getElementById("slider2").onpointermove = function (event) {
        theta[1] = event.target.value;
    };
    document.getElementById("slider3").onpointermove = function (event) {
        theta[2] = event.target.value;
    };

    // Control the translation in XZ-plane
    document.getElementById("translateX").onpointermove = function (event) {
        objTranslate[0] = event.target.value;
    };
    document.getElementById("translateZ").onpointermove = function (event) {
        objTranslate[2] = event.target.value;
    };

    // Control the Scale of Mesh
    document.getElementById("scaleXZ").onpointermove = function (event) {
        SCENE_WIDTH = event.target.value;
    };
    document.getElementById("scaleY").onpointermove = function (event) {
        SCENE_HEIGHT = event.target.value;
    };

    // Control the RGB Color of Ambient Light
    document.getElementById("ambientR").onpointermove = function (event) {
        ambient[0] = event.target.value;
    };
    document.getElementById("ambientG").onpointermove = function (event) {
        ambient[1] = event.target.value;
    };
    document.getElementById("ambientB").onpointermove = function (event) {
        ambient[2] = event.target.value;
    };

    // Move the scene
    document.getElementById("IncreasePhi").onclick = function () { phi += dr; };
    document.getElementById("DecreasePhi").onclick = function () { phi -= dr; };
    
    // Control the Position of light
    document.getElementById("UpLight").onclick = function () { lightTheta += dr; console.log(lightTheta); };
    document.getElementById("DownLight").onclick = function () { lightTheta -= dr; console.log(lightTheta); };

    // Swith the method of shading (Gouraud & Phong)
    document.getElementById("shading").onclick = function () {
        var temprogram = program1;
        program1 = program3;
        program3 = temprogram;

        if (this.innerHTML == "Phong Shading") {
            this.innerHTML = "Gouraud Shading"
        }
        else {
            this.innerHTML = "Phong Shading"
        }
    };

}


// Create and initialize buffer objects
function initializeBuffer() {

    //----------------------------------------------------------------------------
    // Program 1
    gl.useProgram(program1);

    modelViewMatrixLoc = gl.getUniformLocation(program1, "modelViewMatrix");

    // projectionMatrix = ortho(-18, 18, -18, 18, -18, 18);
    projectionMatrix = ortho(-projection, projection, -projection, projection, -projection, projection);
    gl.uniformMatrix4fv(gl.getUniformLocation(program1, "projectionMatrix"), false, flatten(projectionMatrix));

    //----------------------------------------------------------------------------
    // Program 2
    gl.useProgram(program2);

    var u_image0Location = gl.getUniformLocation(program2, "uTexMap");
    var u_image1Location = gl.getUniformLocation(program2, "uNormMap");
    gl.uniform1i(u_image0Location, 0);  // texture unit 0
    gl.uniform1i(u_image1Location, 1);  // texture unit 1

    var image = new Image();
    image.src = "CG_F22_Program3_YiwenXu_UFO.png"
    image.addEventListener('load', function () {
        // Create a blank canvas and a canvas context
        // Canvas context is used to draw an image to the canvas
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext("2d");

        // Render the loaded image to the canvas
        imageWidth = image.width;
        imageHeigh = image.height;
        ctx.drawImage(image, 0, 0, image.width, image.height);

        // Get the image rendered to the canvas, returns a Uint8ClampedArray
        let imageData = ctx.getImageData(0, 0, image.width, image.height);

        // Convert to a Uint8Array (not necessary)
        imageConverted = new Uint8Array(image.width * image.height * 4);
        for (let i = 0; i < image.width * image.height * 4; i++) imageConverted[i] = imageData.data[i];

        // Buffer texture
        configureTexture(imageConverted, imageWidth, imageHeigh);

        // Buffer bump map
        bumpData(rawData);
        configureTexture1(texturNormal, imageWidth, imageHeigh);
    })


    gl.uniform4fv(gl.getUniformLocation(program2, "uNormal"), meshNormal);
    gl.uniformMatrix4fv(gl.getUniformLocation(program2, "projectionMatrix"), false, flatten(projectionMatrix));

}

function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program1 = initShaders(gl, "vertex-shader", "fragment-shader");
    program2 = initShaders(gl, "vertex-shader2", "fragment-shader2");
    program3 = initShaders(gl, "vertex-shader3", "fragment-shader3");

    addEvent();

    // Get vertex
    colorQuads();
    mesh();
    textureMesh();

    // Create and initialize buffer objects
    initializeBuffer();

    // var tmp = translate(8, 0, 0)
    // tmp = mult(tmp, rotate(30, vec3(0, 0, 1)));

    var tmp = rotate(30, vec3(0, 0, 1));
    tmp = mult(tmp, translate(8, 0, 0));

    console.log(tmp);

    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    render();
}


//----------------------------------------------------------------------------

function terrian() {
    var s = scale(MESH_WIDTH, MESH_HEIGHT, MESH_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0, 0.0), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    

    for (var i = 0; i < NumTerrian; i += 4) {
        gl.drawArrays(gl.TRIANGLE_FAN, NumQuad * 2 + i, 4);
    }
}

function base() {
    var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * BASE_HEIGHT, 0.0), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));

    gl.drawArrays(gl.TRIANGLES, 0, NumQuad);
}

function lowerArm() {
    var s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));

    gl.drawArrays(gl.TRIANGLES, NumQuad, NumQuad);
}

function upperArm() {

    var s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));

    gl.drawArrays(gl.TRIANGLES, NumQuad, NumQuad);
}

function head() {

    // Change currently used program to texture shader
    // Bind the buffers to it 
    gl.useProgram(program2);

    var vBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc2 = gl.getAttribLocation(program2, "aPosition");
    gl.vertexAttribPointer(positionLoc2, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc2);

    var tBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation(program2, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    gl.activeTexture(gl.TEXTURE0);
    nMatrix = normalMatrix(modelViewMatrix, true);
    gl.uniformMatrix3fv(gl.getUniformLocation(program2, "uNormalMatrix"), false, flatten(nMatrix));
    gl.uniform4fv(gl.getUniformLocation(program2, "uAmbientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program2, "uLightPosition"), flatten(lightPosition));
    gl.uniform4fv(gl.getUniformLocation(program2, "uSpecularProduct"), flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(program2, "uShininess"), materialShininess);

    //----------------------------------------------------------------------------
    var s = scale(HEAD_WIDTH, HEAD_HEIGHT, HEAD_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * HEAD_HEIGHT, 0.0), s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program2, "modelViewMatrix"), false, flatten(t));

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // Change currently used program
    gl.useProgram(program1);
}

//----------------------------------------------------------------------------

function drawScene() {

    // Bind the buffer to the currently used program
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program1, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc)

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program1, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);


    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program1, "aNormal");
    gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    modelViewMatrixLoc = gl.getUniformLocation(program1, "modelViewMatrix");

    gl.uniform4fv(gl.getUniformLocation(program1, "uAmbientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program1, "uDiffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program1, "uSpecularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program1, "uLightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program1, "uShininess"), materialShininess);    
    gl.uniformMatrix4fv(gl.getUniformLocation(program1, "projectionMatrix"), false, flatten(projectionMatrix));
    
    //----------------------------------------------------------------------------

    modelViewMatrix = mult(modelViewMatrix, rotate(envTheta[0], vec3(1, 0, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(envTheta[1], vec3(0, 1, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(envTheta[2], vec3(0, 0, 1)));
    terrian();

    modelViewMatrix = mult(modelViewMatrix, translate(objTranslate[0], objTranslate[1], objTranslate[2]));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[Base], vec3(0, 1, 0)));
    base();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));
    lowerArm();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[UpperArm], vec3(0, 0, 1)));
    upperArm();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, UPPER_ARM_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[Head], vec3(0, 0, 1)));
    head();
}

// Set the properties of light
function setLight() {
    lightPosition[1] = 2.0 * Math.cos(lightTheta);

    lightAmbient = vec4(ambient);
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program1);

    // Set the properties of light
    setLight();

    // Set camera pos for main view
    var eye = vec3(2.0, 3.0 * (1.0 + Math.cos(phi)), 2.0);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);

    modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = mult(modelViewMatrix, translate(8, 0, 0));
    modelViewMatrix = mult(modelViewMatrix, scale(SCENE_WIDTH, SCENE_HEIGHT, SCENE_WIDTH))

    nMatrix = normalMatrix(modelViewMatrix, true);
    gl.uniformMatrix3fv(gl.getUniformLocation(program1, "uNormalMatrix"), false, flatten(nMatrix));

    //----------------------------------------------------------------------------
    drawScene();

    requestAnimationFrame(render);
}


init();