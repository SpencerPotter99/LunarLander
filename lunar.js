

let canvas = null
let ctx = null
let inputBuffer = {}
let COORD_SIZE = 0
let LUNAR_SIZE = 50

//control keys
let myKeyboard = Input.Keyboard();
let rotateLeftKey = 'ArrowLeft'
let rotateRightKey = 'ArrowRight'
let thrustKey = 'ArrowUp'
let momentum = 0

//image variables
let lunarLander = null

//terrain variable
const maxHieght = 990
const minHeight = 500
const start = { x: 0, y: getRandom(minHeight, maxHieght) };
const end = { x: 1000, y: getRandom(minHeight, maxHieght) };
const numIterations = 6;
const s = 2; // Surface-roughness factor
const safeZoneWidth = 120;
const terrainPoints = generateTerrain(start, end, numIterations, s);
const safeZone = getSafeZone()


function initialize() {
    canvas = document.getElementById('lunarCanvas');
    COORD_SIZE=canvas.width
    ctx = canvas.getContext('2d');
    lunarLander = initializeLander({
        imageSource: './Static/cartoonMoonLander.png',
        location: {x: 100, y:100},
        rotation: {rotate: 0}
    })
 




    window.addEventListener('keydown', function (event) {
        inputBuffer[event.key] = event.key
    })
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop)
}

function initializeLander(spec){
    let image = new Image()
    image.isReady = false

    function rotateLeft() {
        spec.rotation.rotate -= Math.PI / 180 * 4
    }
    function rotateRight() {
        spec.rotation.rotate += Math.PI / 180 * 4
    }
    function thrust() {
        const velocityX = (Math.sin(spec.rotation.rotate) )* 2; // Adjust THRUST_SPEED as needed
        const velocityY = Math.cos(spec.rotation.rotate) * -2;
        spec.location.x += velocityX;
        spec.location.y += velocityY;
    }

    image.onload = function () {
        this.isReady = true
    }
    image.src=spec.imageSource
    return {
        rotateLeft: rotateLeft,
        rotateRight: rotateRight,
        thrust: thrust,
        location: spec.location,
        image: image,
        rotation: spec.rotation
        
    }
}

function gameLoop(timestamp) {
    
    let elapsedTime = timestamp - lastTimestamp;
    processInput(elapsedTime)
    update(elapsedTime)
    render(elapsedTime)

    requestAnimationFrame(gameLoop)
}


function processInput(elapsedTime) {
    moveLander()
    myKeyboard.update(elapsedTime)
}

function update(elapsedTime) {

}

function render(elapsedTime) {
    drawTerrain(terrainPoints, safeZone);
    renderImage(lunarLander)
}

function renderImage(object) {
    if(object.image.isReady) {
        ctx.save()
        ctx.translate(object.location.x, object.location.y);
        ctx.rotate(object.rotation.rotate);
        ctx.translate(-object.location.x, -object.location.y);
        ctx.drawImage(
            object.image,
            object.location.x - LUNAR_SIZE / 2,
            object.location.y - LUNAR_SIZE / 2,
            LUNAR_SIZE,
            LUNAR_SIZE
        )
        ctx.restore()
    }
}

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function drawTerrain(points, safeZone) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
        if(points[i].x >= safeZone.x - 20 && points[i].x <= safeZone.x + safeZoneWidth) {
            // Draw the safe zone
            ctx.lineTo(safeZone.x, safeZone.y);
            ctx.stroke()
            ctx.beginPath();
            ctx.moveTo(safeZone.x, safeZone.y);
            ctx.shadowBlur = 20; // Set shadow blur for glowing effect
            ctx.shadowColor = "lime"; // Set shadow color to green
            ctx.strokeStyle = "lime"; // Set stroke color to green
            ctx.lineWidth = 3; // Set line width for visibility
            ctx.lineTo(safeZone.x + safeZoneWidth, safeZone.y);
            ctx.stroke(); // Stroke the safe zone line

            ctx.shadowBlur = 0; // Reset shadow blur
            ctx.shadowColor = "transparent"; // Reset shadow color
            ctx.strokeStyle = "black"; // Reset stroke color
            ctx.lineWidth = 1; // Reset line width
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(safeZone.x + safeZoneWidth, safeZone.y)
        } else {
            ctx.lineTo(points[i].x, points[i].y);
        }
    }
    ctx.stroke();
}

function getRandomGaussian(mean, variance) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    const randStdNormal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + Math.sqrt(variance) * randStdNormal;
}

function computeElevation(a, b, s) {
    const maxVariation = 150; // Maximum variation allowed from the previous elevation
    const prevElevation = (a.y + b.y) / 2;
    const minElevation = Math.max(minHeight, prevElevation - maxVariation);
    const maxElevation = Math.min(maxHieght, prevElevation + maxVariation);
    const elevation = getRandom(minElevation, maxElevation);
    return elevation;
}

function getSafeZone() {
    const safeZone = { x: getRandom(50, 850), y: getRandom(minHeight, maxHieght) };
    return safeZone
}

function midpointDisplacement(points, s) {
    const newPoints = [points[0]];

    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const midpoint = {
            x: (a.x + b.x) / 2,
            y: computeElevation(a, b, s)
        };
        newPoints.push(midpoint, b);
    }

    return newPoints;
}

function generateTerrain(start, end, numIterations, s,) {
    let points = [start, end];


    for (let i = 0; i < numIterations; i++) {
        points = midpointDisplacement(points, s);
    }

    return points;
}

function moveLander (lander) {
    if(myKeyboard.keys.hasOwnProperty(rotateLeftKey)){
        myKeyboard.registerCommand(rotateLeftKey, lunarLander.rotateLeft())
    }
    if(myKeyboard.keys.hasOwnProperty(rotateRightKey)){
        myKeyboard.registerCommand(rotateRightKey, lunarLander.rotateRight())
    }
    if(myKeyboard.keys.hasOwnProperty(thrustKey)){
        myKeyboard.registerCommand(thrustKey, lunarLander.thrust())
    }

}

