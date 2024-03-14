
MyGame.main = (function (systems, renderer, graphics) {
    'use strict';
    
    let canvas = null
    let ctx = null
    let inputBuffer = {}
    let COORD_SIZE = 0
    let LUNAR_SIZE = 50
    let gameState = MyGame.gameState
    let lastTimestamp = performance.now()

    //control keys
    let myKeyboard = Input.Keyboard();
    let rotateLeftKey = localStorage.getItem('rotateLeft')
    if(rotateLeftKey === null){
        localStorage.setItem('rotateLeft', 'ArrowLeft')
        rotateLeftKey = 'ArrowLeft'
    }
    let rotateRightKey = localStorage.getItem('rotateRight')
    if(rotateRightKey === null){
        localStorage.setItem('rotateRight','ArrowRight')
        rotateRightKey = 'ArrowRight'
    }
    let thrustKey = localStorage.getItem('thrustKey')
    if(thrustKey===null){
        localStorage.setItem('thrustKey', 'ArrowUp')
        thrustKey = 'ArrowUp'
    }
    let momentum = 0

    //image variables
    let lunarLander = null
    let collision = false
    let collided = false

    //terrain variable
    const maxHieght = 990
    const minHeight = 500
    const start = { x: 0, y: getRandom(minHeight, maxHieght) };
    const end = { x: 1000, y: getRandom(minHeight, maxHieght) };
    const numIterations = 6;
    const s = 2; // Surface-roughness factor
    const safeZoneWidth = 120;
    const safeZone = getSafeZone()
    const terrainPoints = generateTerrain(start, end, numIterations, s);
    if(gameState === 'game'){
        initialize()
    }
    else if(gameState ==='changeControls')[
        initializeMovementChange()
    ]


    //Particle variables
    let particles = systems.ParticleSystem({
        center: { x: lunarLander?.location?.x, y: lunarLander?.location?.y },
        size: { x: 10, y: 10 },
        speed: { mean: 50, stdev: 25 },
        lifetime: { mean: 4, stdev: 1 }
    },
    graphics);
    let renderParticles = renderer.ParticleSystem(particles, graphics, 'rgba(255, 255, 255, 1)', 'rgba(0, 0, 0, 1)');
    
    function initialize() {
        canvas = document.getElementById('lunarCanvas');
        COORD_SIZE=canvas.width
        ctx = canvas.getContext('2d');
        gameState = 'game'
        lunarLander = initializeLander({
            imageSource: './Static/cartoonMoonLander.png',
            location: {x: 100, y:100},
            rotation: {rotate: 1.5}
        })
    




        window.addEventListener('keydown', function (event) {
            inputBuffer[event.key] = event.key
        })
        lastTimestamp = performance.now();
        requestAnimationFrame(gameLoop)
    }

    function initializeMovementChange() {
        gameState = 'changeControls'
        lastTimestamp = performance.now();
        document.getElementById('thrustKeyInput').value = thrustKey
        document.getElementById('rotateRightKeyInput').value = rotateRightKey
        document.getElementById('rotateLeftKeyInput').value = rotateLeftKey
        
        requestAnimationFrame(gameLoop)
    }

    function initializeLander(spec, elapsedTime){
        let image = new Image()
        image.isReady = false
        let circle = {
            radius: 25,
            center: {x: spec.location.x, y: spec.location.y }
        } 
        function rotateLeft(elapsedTime) {
            spec.rotation.rotate -= Math.PI / 180 * 4
        }
        function rotateRight(elapsedTime) {
            spec.rotation.rotate += Math.PI / 180 * 4
        }
        function thrust(elapsedTime) {
            const velocityX = (Math.sin(spec.rotation.rotate) )* 4; // Adjust THRUST_SPEED as needed
            const velocityY = Math.cos(spec.rotation.rotate) * -4;
            spec.location.x += velocityX;
            spec.location.y += velocityY;
            circle.center.x = spec.location.x 
            circle.center.y = spec.location.y 
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
            rotation: spec.rotation,
            circle: circle
            
        }
    }

    function gameLoop(timestamp) {
        
        let elapsedTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        processInput(elapsedTime)
        update(elapsedTime)
        render(elapsedTime)

        requestAnimationFrame(gameLoop)
    }


    function processInput(elapsedTime) {
        if (gameState === 'changeControls') {
            
        }
        if(!collided) {
        myKeyboard.update(elapsedTime)
        moveLander()
        }

        
    }

    function update(elapsedTime) {
        gravity()
        collisionDetection()
        particles.update(elapsedTime, lunarLander)    
    }

    function render(elapsedTime) {
        drawTerrain(terrainPoints, safeZone);
        renderParticles.render()
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
        let filteredPoints = points.filter(point => {
            return point.x < safeZone.x - 20 || point.x > safeZone.x + safeZoneWidth;
        });
        const safeZoneStart = { x: safeZone.x - 20, y: safeZone.y };
        const safeZoneEnd = { x: safeZone.x + safeZoneWidth, y: safeZone.y }
        filteredPoints = filteredPoints.concat(safeZoneStart);
        filteredPoints = filteredPoints.concat(safeZoneEnd);
        filteredPoints.sort((a, b) => a.x - b.x);
        
        return filteredPoints;
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

    function gravity(){
        if(!collided) {
        lunarLander.location.y += 1.62
        lunarLander.circle.center.y += 1.62
        }
    }

    function collisionDetection() {
        for(let x=0; x<terrainPoints.length-1; x++) {
                collision = lineCircleIntersection(terrainPoints[x], terrainPoints[x + 1], lunarLander.circle)
            if(collision){
                collided = true
            }
        }
    }

    function lineCircleIntersection(pt1, pt2, circle) {
        let v1 = { x: pt2.x - pt1.x, y: pt2.y - pt1.y };
        let v2 = { x: pt1.x - circle.center.x, y: pt1.y - circle.center.y };
        let b = -2 * (v1.x * v2.x + v1.y * v2.y);
        let c =  2 * (v1.x * v1.x + v1.y * v1.y);
        let d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
        if (isNaN(d)) { // no intercept
            return false;
        }
        // These represent the unit distance of point one and two on the line
        let u1 = (b - d) / c;  
        let u2 = (b + d) / c;
        if (u1 <= 1 && u1 >= 0) {  // If point on the line segment
            return true;
        }
        if (u2 <= 1 && u2 >= 0) {  // If point on the line segment
            return true;
        }
        return false;
    }

    
}(MyGame.systems, MyGame.render, MyGame.graphics));