"use strict";

// To run this project, you need to set up a local server first
// I used 'Live Server' which is a plug-in that can be set up in vscode
// All of the file in this folder need to be upload, as well as the 'Common' utility files are needed 


var canvas, gl;

var canvasWidth = 516;
var canvasHeight = 360;

// quad texture coordinates
var texCoord = [
    vec2(1, 1),
    vec2(1, 0),
    vec2(0, 0),
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
];

// quad vertices
var vertices = [
    vec2(1, -1),
    vec2(1, 1),
    vec2(-1, 1),
    vec2(-1, 1),
    vec2(-1, -1),
    vec2(1, -1)
];

var program1, program2;
var framebuffer;
var texture1, texture2;
var buffer1, buffer2, buffer3;

var beforeTexture, afterTexture;

var positionsArray = [];

// Parameters for the combination
var similarity = 0.24;
var smoothness = 0.29;
var spill = 0.37;
var keyColor = vec3(0, 1, 0);

// will set to true when video can be copied to texture
var copyVideo = false;

const video = setupVideo('CG_F22_Program4B_YiwenXu_Cat.mp4');


//-------------------------------------------------------------------------------
// Video Frames Reading and Updating Functions

function setupVideo(url) {
    const video = document.createElement('video');

    var playing = false;
    var timeupdate = false;

    video.autoplay = true;
    video.muted = true;
    video.loop = true;

    // Waiting for these 2 events ensures
    // there is data in the video

    video.addEventListener('playing', function () {
        playing = true;
        checkReady();
    }, true);

    video.addEventListener('timeupdate', function () {
        timeupdate = true;
        checkReady();
    }, true);

    video.src = url;
    video.play();

    function checkReady() {
        if (playing && timeupdate) {
            copyVideo = true;
        }
    }

    return video;
}

function updateTexture(texture, video) {
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, video);
}

//-------------------------------------------------------------------------------
// Initialize Buffer and Texture

function initTexture() {

    beforeTexture = gl.getUniformLocation(program2, 'uBeforeUnite');
    afterTexture = gl.getUniformLocation(program2, 'uAfterUnite');
    gl.useProgram(program2);

    let texUnit = 1;
    texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + texUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.uniform1i(beforeTexture, texUnit);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvasWidth, canvasHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


    texUnit = 2;
    texture2 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + texUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(afterTexture, texUnit);

    // Because video has to be download over the internet
    // they might take a moment until it's ready so
    // put a single pixel in the texture so we can
    // use it immediately.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border, srcFormat, srcType,
        pixel);

    // Turn off mips and set  wrapping to clamp to edge so it
    // will work regardless of the dimensions of the video.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

}

function configureTexture(image, width, height){

    gl.bindTexture(gl.TEXTURE_2D, texture1);

    console.log(width,height)
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);


    console.log("Configure Texture")

}

function initBuffer() {

    var vertices2 = [
        vec2(-1.0, -1.0),
        vec2(0.0, 1.0),
        vec2(1.0, -1.0)
    ];

    positionsArray.push(vertices2[0]);
    positionsArray.push(vertices2[1]);
    positionsArray.push(vertices2[2]);

    // Create and initialize a buffer object

    buffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program1, "aPosition");
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    // Bind FBO and render

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    gl.clearColor(1.0, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 3);


    // Bind to window system frame buffer, unbind the texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(program2);

    gl.activeTexture(gl.TEXTURE0 + 1);

    gl.bindTexture(gl.TEXTURE_2D, texture1);

    // send data to GPU for normal render

    buffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program2, "aPosition");
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    buffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer3);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation(program2, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    gl.uniform1i(gl.getUniformLocation(program2, "uTextureMap"), 0);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.viewport(0, 0, canvasWidth, canvasHeight);

    gl.uniform1f(gl.getUniformLocation(program2, "similarity"), similarity);
    gl.uniform1f(gl.getUniformLocation(program2, "smoothness"), smoothness);
    gl.uniform1f(gl.getUniformLocation(program2, "spill"), spill);
    gl.uniform3fv(gl.getUniformLocation(program2, "keyColor"), keyColor);
}

//-------------------------------------------------------------------------------

function addEvent() {

    document.getElementById("keyColor").oninput = function(event){
        let color = event.target.value;
        let r = parseInt(color.slice(1, 3), 16) / 255;
        let g = parseInt(color.slice(3, 5), 16) / 255;
        let b = parseInt(color.slice(5, 7), 16) / 255;
        keyColor = vec3(r, g, b);
    }

    document.getElementById("similarity").onpointermove = function(event){
        similarity = event.target.value;
        document.getElementById("showSimilarity").innerHTML = event.target.value;
    }

    document.getElementById("smoothness").onpointermove = function(event){
        smoothness = event.target.value;
        document.getElementById("showSmoothness").innerHTML = event.target.value;
    }

    document.getElementById("spill").onpointermove = function(event){
        spill = event.target.value;
        document.getElementById("showSpill").innerHTML = event.target.value;
    }


    // Read Image File
    document.getElementById('fileInput').onchange = (e) => {
        // Get the file data from the event variable
        let file = e.target.files[0];
        console.log("Input file")

        // The JavaScript FileReader is used to load files, such as .txt or .png files
        let fileReader = new FileReader();

        fileReader.onload = (e) => {

            // Grab the file from the event variable
            let result = e.target.result;

            // Create an HTML <img>, which will we attach the file data to
            let resultImage = new Image();
            // Start loading the image data
            resultImage.src = result;

            console.log("file onload")

            // Again, create the onload() function before loading the file data
            resultImage.onload = () => {
                console.log(resultImage.width, resultImage.height);

                // Do something with that image
                configureTexture(resultImage, resultImage.width, resultImage.height);
                
            }
        }

        // Read the image. Once this is finished, onload() will be called
        // If you want to read a .txt file, use readAsText(file, "utf-8")
        fileReader.readAsDataURL(file);
    }
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');

    if (!gl) alert("WebGL 2.0 isn't available");
    program1 = initShaders(gl, "vertex-shader1", "fragment-shader1");
    program2 = initShaders(gl, "vertex-shader2", "fragment-shader2");

    initTexture();

    // Allocate a frame buffer object
    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    framebuffer.width = canvasWidth;
    framebuffer.height = canvasHeight;

    // Attach color buffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture1, 0);

    // check for completeness
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE) alert('Frame Buffer Not Complete');

    gl.useProgram(program1);

    initBuffer();

    addEvent();

    render();
}

// Draw the scene repeatedly
function render() {

    if (copyVideo) {
        updateTexture(texture2, video);
    }
    drawScene();

    requestAnimationFrame(render);
}

function drawScene() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the parameters for the combination
    gl.uniform1f(gl.getUniformLocation(program2, "similarity"), similarity);
    gl.uniform1f(gl.getUniformLocation(program2, "smoothness"), smoothness);
    gl.uniform1f(gl.getUniformLocation(program2, "spill"), spill);
    gl.uniform3fv(gl.getUniformLocation(program2, "keyColor"), keyColor);

    gl.activeTexture(gl.TEXTURE0 + 2);

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture2);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

}

