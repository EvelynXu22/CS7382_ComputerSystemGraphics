
// Initials Z
let objDepth = 10;

// Points Counter
let YNum = 90;
let XNum = 60;
var pedestalN = 50;
let pedestalCurvedNum = 2 * pedestalN + 2;  // Plus 2 Starting Points => make it a close loop
let pedestalLateralNum = 2 * pedestalN + 4;
let confettiNum = 200 * 3;  // 200 confetti pieces

// Radius of Pedestal
var topRadius = 150 / 256;
var bottomRadius = 100 / 256;

// Calculating Pedestal Points Coordinates
function getPedestalPoints() {
    let y1 = -1/256;
    let y2 = -80 / 256;
    var points = [];    //Curved Surface Points
    var top = [0, y1, 0];       // Top Lateral Surface Points
    var bottom = [0, y2, 0];      // Bottom Lateral Surface Points

    for (var i = 0; i < pedestalN; i++) {
        x1 = topRadius * Math.cos(i * (2 * Math.PI / pedestalN));
        z1 = topRadius * Math.sin(i * (2 * Math.PI / pedestalN));

        x2 = bottomRadius * Math.cos(i * (2 * Math.PI / pedestalN));
        z2 = bottomRadius * Math.sin(i * (2 * Math.PI / pedestalN));

        points.push(x1, y1, z1, x2, y2, z2);
        top.push(x1, y1, z1);
        bottom.push(x2, y2, z2);
    }
    // Add starting points to make it a closed loop
    x1 = topRadius * Math.cos(0);
    z1 = topRadius * Math.sin(0);
    x2 = bottomRadius * Math.cos(0);
    z2 = bottomRadius * Math.sin(0);
    points.push(x1, y1, z1, x2, y2, z2);
    top.push(x1, y1, z1);
    bottom.push(x2, y2, z2);

    // Gather Points
    points = points.concat(top).concat(bottom);
    return points
}

// Calculating Confetti Pieces Points Coordinates
function getConfettiPoints(){
    var points = [];
    for (var i = 0; i < confettiNum; i++){
        // A Small Triangle
        points.push(0, 0 , 0);
        points.push(0.05, 0.05 , 0);
        points.push(0.05, -0.05 , 0);
    }
    return points;
}

// Calculating All Color Data
function getColors() {
    var colors = [];

    var ycolor = [126 / 255, 219 / 255, 251 / 255];     // Color of Letter Y
    var xcolor = [221 / 255, 62 / 255, 247 / 255];      // Color of Letter X
    var pedestalCurveColor = [95 / 255, 65 / 255, 246 / 255];
    var pedestalLateralColor = [74/255,59/255,220/255]

    // Color Data of Letter Y
    tmp = Array.apply(null, Array(YNum)).map(function () {
        return ycolor
    })
    colors = colors.concat(tmp.flat())

    // Color Data of Letter X
    tmp = Array.apply(null, Array(XNum)).map(function () {
        return xcolor
    })
    colors = colors.concat(tmp.flat())

    // Color Data of Pedestal Curved Surface
    tmp = Array.apply(null, Array(pedestalCurvedNum)).map(function () {
        return pedestalCurveColor
    })
    colors = colors.concat(tmp.flat())
    
    // Color Data of Pedestal Lateral Surface data
    tmp = Array.apply(null, Array(pedestalLateralNum)).map(function () {
        return pedestalLateralColor
    })
    colors = colors.concat(tmp.flat())

    // Randomly Calculating Color of Confetti 
    tmp = Array.apply(null, Array(confettiNum)).map(function () {
        r = Math.ceil(Math.random()*255)/255;
        b = Math.ceil(Math.random()*255)/255;
        g = Math.ceil(Math.random()*255)/255;
        return [r, g, b, r, g, b, r, g, b];
    })
    colors = colors.concat(tmp.flat())

    return colors
}

// Calculating All Start Angles Data
function getStartAngles(){
    var angles = [];

    var defultAngle = [0,0,0];

    // Filled Array with default angles except for confetti
    tmp = Array.apply(null, Array(YNum+XNum+pedestalCurvedNum+pedestalLateralNum)).map(function () {
        return defultAngle
    })
    angles = angles.concat(tmp.flat())

    // Randomly Calculate Start Angles for Every Confetti Piece
    for (var i = 0; i < confettiNum; i++){
        let x = Math.random() * Math.PI * 2;
        let y = Math.random() * Math.PI * 2;
        let z = Math.random() * Math.PI * 2;

        angles.push(x, y, z, x, y, z, x, y, z);
    }

    return angles
}

// Calculating All Offset Data
function getOffset(){
    var offset = [];

    var defultOffset = [0,0];

    // Filled Array with default Offset except for confetti
    tmp = Array.apply(null, Array(YNum+XNum+pedestalCurvedNum+pedestalLateralNum)).map(function () {
        return defultOffset
    })
    offset = offset.concat(tmp.flat())

    // Randomly Calculate Offset for Every Confetti Piece
    for (var i = 0; i < confettiNum; i++){
        let x = Math.random() * 2 - 1;
        let y = Math.random() * 3 + 0.7;
        offset.push(x, y, x, y, x, y);
    }
    return offset
}

// Letter Y's Points Coordinates
var YPoints = [
    // Y
    // Front (3 tetragonums)
    -100, 200, objDepth,
    -80, 200, objDepth,
    -60, 100, objDepth,
    -80, 200, objDepth,
    -60, 100, objDepth,
    -40, 100, objDepth,

    -20, 200, objDepth + 1,
    0, 200, objDepth + 1,
    -60, 100, objDepth + 1,
    0, 200, objDepth + 1,
    -60, 100, objDepth + 1,
    -40, 100, objDepth + 1,

    -60, 100, objDepth,
    -40, 100, objDepth,
    -60, 0, objDepth,
    -40, 100, objDepth,
    -60, 0, objDepth,
    -40, 0, objDepth,

    // Back (3 tetragonums)
    -100, 200, -objDepth,
    -80, 200, -objDepth,
    -60, 100, -objDepth,
    -80, 200, -objDepth,
    -60, 100, -objDepth,
    -40, 100, -objDepth,

    -20, 200, -objDepth - 1,
    0, 200, -objDepth - 1,
    -60, 100, -objDepth - 1,
    0, 200, -objDepth - 1,
    -60, 100, -objDepth - 1,
    -40, 100, -objDepth - 1,

    -60, 100, -objDepth,
    -40, 100, -objDepth,
    -60, 0, -objDepth,
    -40, 100, -objDepth,
    -60, 0, -objDepth,
    -40, 0, -objDepth,

    //Side (3 tetragonums for 2 Sides)
    -100, 200, -objDepth,
    -100, 200, objDepth,
    -60, 100, -objDepth,
    -100, 200, objDepth,
    -60, 100, -objDepth,
    -60, 100, objDepth,

    -80, 200, -objDepth,
    -80, 200, objDepth,
    -40, 100, -objDepth,
    -80, 200, objDepth,
    -40, 100, -objDepth,
    -40, 100, objDepth,

    -20, 200, -objDepth - 1,
    -20, 200, objDepth + 1,
    -60, 100, -objDepth - 1,
    -20, 200, objDepth + 1,
    -60, 100, -objDepth - 1,
    -60, 100, objDepth + 1,

    0, 200, -objDepth - 1,
    0, 200, objDepth + 1,
    -40, 100, -objDepth - 1,
    0, 200, objDepth + 1,
    -40, 100, -objDepth - 1,
    -40, 100, objDepth + 1,

    -60, 100, -objDepth,
    -60, 100, objDepth,
    -60, 0, -objDepth,
    -60, 100, objDepth,
    -60, 0, -objDepth,
    -60, 0, objDepth,

    -40, 100, -objDepth,
    -40, 100, objDepth,
    -40, 0, -objDepth,
    -40, 100, objDepth,
    -40, 0, -objDepth,
    -40, 0, objDepth,


    // Up (2 tetragonums)
    -100, 200, -objDepth,
    -100, 200, objDepth,
    -80, 200, -objDepth,
    -100, 200, objDepth,
    -80, 200, -objDepth,
    -80, 200, objDepth,

    -20, 200, -objDepth - 1,
    -20, 200, objDepth + 1,
    0, 200, -objDepth - 1,
    -20, 200, objDepth + 1,
    0, 200, -objDepth - 1,
    0, 200, objDepth + 1,

    // Down (1 tetragonum)
    -60, 0, -objDepth,
    -60, 0, objDepth,
    0, 0, -objDepth,
    -60, 0, objDepth,
    0, 0, -objDepth,
    0, 0, objDepth,
];
YPoints = YPoints.map(function (value) {
    // Normalized with Canvas Size
    return value = value / 256;
})

// Letter X's Points Coordinates
var XPoints = [
    //X
    //Front
    -20, 200, objDepth,
    0, 200, objDepth,
    80, 0, objDepth,

    0, 200, objDepth,
    80, 0, objDepth,
    100, 0, objDepth,

    80, 200, objDepth,
    100, 200, objDepth,
    -20, 0, objDepth,

    100, 200, objDepth,
    -20, 0, objDepth,
    0, 0, objDepth,

    //Back
    -20, 200, -objDepth,
    0, 200, -objDepth,
    80, 0, -objDepth,

    0, 200, -objDepth,
    80, 0, -objDepth,
    100, 0, -objDepth,

    80, 200, -objDepth,
    100, 200, -objDepth,
    -20, 0, -objDepth,

    100, 200, -objDepth,
    -20, 0, -objDepth,
    0, 0, -objDepth,

    //Side
    -20, 200, -objDepth,
    -20, 200, objDepth,
    80, 0, -objDepth,

    -20, 200, objDepth,
    80, 0, -objDepth,
    80, 0, objDepth,

    0, 200, -objDepth,
    0, 200, objDepth,
    100, 0, -objDepth,

    0, 200, objDepth,
    100, 0, -objDepth,
    100, 0, objDepth,

    80, 200, -objDepth,
    80, 200, objDepth,
    -20, 0, -objDepth,

    80, 200, objDepth,
    -20, 0, -objDepth,
    -20, 0, objDepth,

    100, 200, -objDepth,
    100, 200, objDepth,
    0, 0, -objDepth,

    100, 200, objDepth,
    0, 0, -objDepth,
    0, 0, objDepth,


    //Up&Down
    80, 200, -objDepth,
    80, 200, objDepth,
    100, 200, -objDepth,

    80, 200, objDepth,
    100, 200, -objDepth,
    100, 200, objDepth,

    80, 0, -objDepth,
    80, 0, objDepth,
    100, 0, -objDepth,

    80, 0, objDepth,
    100, 0, -objDepth,
    100, 0, objDepth,
];
XPoints = XPoints.map(function (value) {
    // Normalized with Canvas Size
    return value = value / 256;
})


var pedestalPoints = getPedestalPoints();
var confettiPoints = getConfettiPoints();
var allColors = getColors();
var startAngles = getStartAngles();
var offset = getOffset();


