function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    this.volume = 1;
    document.body.appendChild(this.sound);
    this.play = function(){
      this.sound.play();
    }
    this.stop = function(){
      this.sound.pause();
    }
    this.setVolume = function(vol){
        if(vol >= 0 && vol <= 1){ // Ensure volume is between 0 and 1
            this.volume = vol;
            this.sound.volume = vol;
        }
    }
  }

MyGame.main = (function (systems, renderer, graphics) {
    'use strict';
    
    let thrustSound = new sound("./Static/thrusterSound.mp3")
    let explostionSound = new sound('./Static/explosionSound.mp3')
    let backgroundSound = new sound('./Static/spaceSound.mp3')
    let winLevelSound = new sound('./Static/winLevel.mp3')
    let exploded = 0
    let canvas = null
    let ctx = null
    let inputBuffer = {}
    let COORD_SIZE = 0
    let LUNAR_SIZE = 50
    let gameState = MyGame.gameState
    let lastTimestamp = performance.now();
    let overallTimestamp = 0
    let winGame = null
    let level = 1
    let countdown = 3;
    let resetLevel = false

    let THRUST = .03

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
    let momentumX = 0
    let momentumY = 0

    //image variables
    let lunarLander = null
    let collision = false
    let collided = false

    //terrain variable
    const maxHieght = 990
    const minHeight = 500
    const start = { x: 0, y: getRandom(minHeight, maxHieght) };
    const end = { x: 1000, y: getRandom(minHeight, maxHieght) };
    let numIterations = 6;
    let s = 2; // Surface-roughness factor
    let safeZoneWidth = 120;
    let safeZone = getSafeZone()
    let safeZone2 = getSafeZone()
    console.log(level)
    let terrainPoints = generateTerrain(start, end, numIterations, s);
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
    let particlesFire = systems.ParticleSystem({
        center: { x: lunarLander?.location?.x, y: lunarLander?.location?.y },
        size: { x: 30, y: 30 },
        speed: { mean: 50, stdev: 25 },
        lifetime: { mean: 4, stdev: 1 }
    },
    graphics);
    let particlesSmoke = systems.ParticleSystem({
        center: { x: lunarLander?.location?.x, y: lunarLander?.location?.y },
        size: { x: 100, y: 100 },
        speed: { mean: 50, stdev: 25 },
        lifetime: { mean: 4, stdev: 1 }
    },
    graphics);
    let renderFire = renderer.ParticleSystem(particlesFire, graphics, './Static/fire.png');
    let renderSmoke = renderer.ParticleSystem(particlesSmoke, graphics, './Static/smoke-2.png');
    let renderParticles = renderer.ParticleSystem(particles, graphics, './Static/fire.png');
    
    function initialize() {
        
        canvas = document.getElementById('lunarCanvas');
        COORD_SIZE=canvas.width
        ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        gameState = 'game'
        lunarLander = initializeLander({
            imageSource: './Static/cartoonMoonLander.png',
            location: {x: 100, y:100},
            rotation: {rotate: 1.5},
            fuel: 20
        })
        backgroundSound.setVolume(.5)
        backgroundSound.play()
    




        window.addEventListener('keydown', function (event) {
            inputBuffer[event.key] = event.key
        })
        requestAnimationFrame(gameLoop)
    }

    function initializeMovementChange() {
        gameState = 'changeControls'
        document.getElementById('thrustKeyInput').value = thrustKey
        document.getElementById('rotateRightKeyInput').value = rotateRightKey
        document.getElementById('rotateLeftKeyInput').value = rotateLeftKey
        
    }

    function initializeLander(spec, elapsedTime){
        let image = new Image()
        image.isReady = false
        let isMoving = false
        let collided = false
        let velocityX = 0
        let velocityY = 0
        let circle = {
            radius: 25,
            center: {x: spec.location.x, y: spec.location.y }
        } 
        function rotateLeft(elapsedTime) {
            if(this.fuel >= 0) {
                spec.rotation.rotate -= Math.PI / 180 * 4
                if (spec.rotation.rotate < 0) {
                    spec.rotation.rotate += 2 * Math.PI;
                }
                this.fuel -= .01
            }
        }
        function rotateRight(elapsedTime) {
            if(this.fuel >= 0) {
                spec.rotation.rotate += Math.PI / 180 * 4
                if (spec.rotation.rotate >= 2 * Math.PI) {
                    spec.rotation.rotate -= 2 * Math.PI;
                }
                this.fuel -= .01
            }
        }
        function thrust(elapsedTime) {
            if(this.fuel >= 0) {
                velocityX += (Math.sin(spec.rotation.rotate) )* THRUST; // Adjust THRUST_SPEED as needed
                velocityY += Math.cos(spec.rotation.rotate) * -THRUST;
                spec.location.x += velocityX;
                spec.location.y += velocityY;
                circle.center.x = spec.location.x 
                circle.center.y = spec.location.y 
                this.fuel -= .05
                
            }
        }

        function landerGravity(){
            if(!lunarLander.isMoving || lunarLander.fuel <=0){
                thrustSound.stop()
            if(!collided) {
                if(velocityY<2.5){
                velocityY += .015
                }
                if(velocityX>0){
                    velocityX -= .01
                    }
            
            lunarLander.location.y += velocityY
            lunarLander.circle.center.y += velocityY
            lunarLander.location.x += velocityX
            lunarLander.circle.center.x += velocityX
            }

            }
            momentumX = velocityX
            momentumY =velocityY
        }

        image.onload = function () {
            this.isReady = true
        }
        image.src=spec.imageSource
        return {
            rotateLeft: rotateLeft,
            rotateRight: rotateRight,
            thrust: thrust,
            landerGravity: landerGravity,
            location: spec.location,
            image: image,
            rotation: spec.rotation,
            circle: circle,
            isMoving: isMoving,
            collided: collided,
            fuel: spec.fuel,
            velocityX: velocityX,
            velocityY: velocityY,
        }
    }

    function gameLoop(timestamp) {
        if(!collided || !winGame){
            overallTimestamp = timestamp
            console.log(overallTimestamp)
        }
        let elapsedTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        processInput(elapsedTime)
        update(elapsedTime)
        render(elapsedTime)

        if(!winGame){
        requestAnimationFrame(gameLoop)
        }
    }


    function processInput(elapsedTime) {
        if(!collided) {
        myKeyboard.update(elapsedTime)
        moveLander()
        }
        else{
            lunarLander.isMoving=false
        }

        
    }

    function update(elapsedTime) {
        gravity()
        collisionDetection()
        particles.update(elapsedTime, lunarLander, momentumX, momentumY)
        if(collided && !winGame){
        particlesSmoke.update(elapsedTime, lunarLander, momentumX, momentumY);
        particlesFire.update(elapsedTime, lunarLander, momentumX, momentumY); 
        }
        if(winGame && level==1){
           endLevel1()
        }

    }

    function endGame(){
        let winGameContainer = document.getElementById('new-game')
        winGameContainer.innerHTML = ''
        let winGameText = document.createElement('h2')
        let scoreText = document.createElement('h2')
        winGameContainer.style.backgroundColor = "rgba(0, 0, 255, 0.5)";
        winGameContainer.style.border = "1px solid rgba(0, 0, 255, 0.5)";
        winGameContainer.style.backdropFilter = "blur(10px)";
        winGameContainer.style.boxShadow = "0 1px 12px rgba(0,0,0,0.25)";
        winGameText.textContent = "You Win!"
        scoreText.textContent = "Total Time To Land: " + Math.floor(overallTimestamp / 1000)+'s'
  
            
        winGameContainer.appendChild(winGameText)
        winGameContainer.appendChild(scoreText)

    
    }

    function endLevel1(){
        // Display countdown in the DOM
         // Initial countdown value
        const countdownInterval = setInterval(() => {
            if (countdown === 0) {
                clearInterval(countdownInterval); // Stop the countdown when it reaches 0
                // Reload the window
                setTimeout(() => {
                    inputBuffer = {};
                    COORD_SIZE = 0;
                    LUNAR_SIZE = 50;
                    gameState = MyGame.gameState;
                    lastTimestamp = performance.now();
                    winGame = null;
                    level = 2;
                    momentumX = 0;
                    momentumY = 0;
                    lunarLander = null;
                    collision = false;
                    countdown = 3;
                    collided = false;
                    numIterations = 6;
                    s = 2; // Surface-roughness factor
                    safeZoneWidth = 75;
                    safeZone = getSafeZone()
                    safeZone2 = getSafeZone()
                    console.log(level)
                    terrainPoints = generateTerrain(start, end, numIterations, s);
                    particles.clearParticles()
                    particlesFire.clearParticles()
                    particlesSmoke.clearParticles()
                    let winGameContainer = document.getElementById('new-game')
                    winGameContainer.style.backgroundColor = "";
                    winGameContainer.style.border = "";
                    winGameContainer.style.backdropFilter = "";
                    winGameContainer.style.opacity = "";
                    winGameContainer.style.boxShadow = "";

                    initialize();
                }, 1000); // Wait for an additional second before reloading
            } else {
                countdown--;
                render()
                console.log(countdown) // Decrement the countdown value
            }
        }, 1000); // Run the countdown every second (1000 milliseconds)
    }

    function render(elapsedTime) {
        drawTerrain(terrainPoints, safeZone);
        if(!collided){
        renderParticles.render()
        }
        renderImage(lunarLander)
        renderSound()

        if(collided && !winGame){
        renderSmoke.render();
        renderFire.render();
        renderResetGame(elapsedTime)
        }
        else{
            renderLunarInfo(elapsedTime)
        }
        if(winGame && level == 2){
            endGame()
        }
    }
    function renderSound(){
        backgroundSound.play()
        if(collided&& !winGame){
            thrustSound.stop()
            if(exploded=== 0){
                explostionSound.play()
                exploded=1
            }
        }
        if(lunarLander.isMoving){
            thrustSound.play()
        }
        if(winGame){
            winLevelSound.play()
            thrustSound.stop()
        }
        
    }

    function renderLunarInfo(elapsedTime) {
        const rotationAngle = lunarLander.rotation.rotate * 180 / Math.PI;
        const speed = Math.floor(Math.abs(momentumX + momentumY) / 0.1)
        let winGameContainer = document.getElementById('new-game')
        winGameContainer.innerHTML = ''

        let fuelContainer = document.getElementById('fuel-div');
        fuelContainer.innerHTML = '';
    
        let fuelText = document.createElement('h2');
        let rotationText = document.createElement('h2');
        let time = document.createElement('h2');
    
        fuelText.textContent = 'Fuel: ' + Math.floor(Math.abs(lunarLander.fuel / 0.5));
        if(Math.abs(lunarLander.fuel / 0.5)>1){
            fuelText.style.color = 'green'
        }
        else{
            fuelText.style.color = 'red'
        }
        time.textContent = `Speed: ` + speed
        if (speed <= 10) {
            time.style.color = 'green'; // Set color to green if rotation is between 340 and 20
        } else {
            time.style.color = 'red'; // Set color to red for other rotation angles
        }

        // Set rotation text content and color based on rotation angle
        
        rotationText.textContent = 'Rotation: ' + Math.floor(rotationAngle / 1);
        if ((rotationAngle >= 355 && rotationAngle <= 360) || (rotationAngle >= 0 && rotationAngle <= 5)) {
            rotationText.style.color = 'green'; // Set color to green if rotation is between 340 and 20
        } else {
            rotationText.style.color = 'red'; // Set color to red for other rotation angles
        }
    
        fuelContainer.appendChild(fuelText);
        fuelContainer.appendChild(time);
        fuelContainer.appendChild(rotationText);
        if(winGame && level=== 1){
            winGameContainer.style.backgroundColor = "rgba(0, 0, 255, 0.5)";
            winGameContainer.style.border = "1px solid rgba(0, 0, 255, 0.5)";
            winGameContainer.style.backdropFilter = "blur(10px)";
            winGameContainer.style.boxShadow = "0 1px 12px rgba(0,0,0,0.25)";
            
            let winGameText = document.createElement('h2')
            let nextLevelCountdown = document.createElement('h2')

            winGameText.textContent = "Next Level Starting in:"
            nextLevelCountdown.textContent = countdown
            
            winGameContainer.appendChild(winGameText)
            winGameContainer.appendChild(nextLevelCountdown)
        }
    }

    function renderResetGame(elapsedTime){
        let winGameContainer = document.getElementById('new-game')
        winGameContainer.innerHTML = ''
        winGameContainer.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
        winGameContainer.style.border = "1px solid rgba(255, 0, 0, 0.5)";
        winGameContainer.style.backdropFilter = "blur(10px)";
        winGameContainer.style.boxShadow = "0 1px 12px rgba(0,0,0,0.25)";
        
        let winGameText = document.createElement('h2')

        winGameText.textContent = "You Died"
        winGameContainer.appendChild(winGameText)
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
        ctx.lineWidth = 8;
        ctx.shadowColor = "grey";
        ctx.moveTo(0,canvas.height)
        ctx.lineTo(points[0].x, points[0].y);
    
        for (let i = 1; i < points.length; i++) {
            if (points[i].x >= safeZone.x - 20 && points[i].x <= safeZone.x + safeZoneWidth) {
                // Draw the safe zone
                ctx.lineTo(safeZone.x, safeZone.y);
                ctx.lineTo(safeZone.x,1000)
                ctx.lineTo(0,1000)
                ctx.fillStyle = "blue"; // Set the fill color
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(safeZone.x, safeZone.y);
                ctx.shadowBlur = 20; // Set shadow blur for glowing effect
                ctx.shadowColor = "lime"; // Set shadow color to green
                ctx.strokeStyle = "lime"; // Set stroke color to green
                ctx.lineWidth = 8; // Set line width for visibility
                ctx.lineTo(safeZone.x + safeZoneWidth, safeZone.y);
                ctx.stroke(); // Stroke the safe zone line
    
                ctx.shadowBlur = 0; // Reset shadow blur
                ctx.shadowColor = "transparent"; // Reset shadow color
                ctx.strokeStyle = "transparent"; // Reset stroke color
                ctx.lineWidth = 8; // Reset line width
                ctx.beginPath()
                ctx.moveTo(safeZone.x, 1000)
                ctx.lineTo(safeZone.x,safeZone.y)
                ctx.lineTo(safeZone.x + safeZoneWidth, safeZone.y)
                ctx.lineTo(safeZone.x + safeZoneWidth,1000)
                ctx.fillStyle = "blue"; // Set the fill color
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(safeZone.x + safeZoneWidth,1000)
                ctx.lineTo(safeZone.x + safeZoneWidth, safeZone.y);
            } else {
                ctx.lineTo(points[i].x, points[i].y);
            }
        }
    
        // Close the path
        ctx.lineTo(points[points.length - 1].x, canvas.height);
        ctx.lineTo(canvas.width, canvas.height)
        ctx.lineTo(safeZone.x + safeZoneWidth, canvas.height);
        ctx.closePath();
    
        // Fill the area below the line
        ctx.fillStyle = "blue"; // Set the fill color
        ctx.fill();
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
    
        const safeZoneStart = { x: safeZone.x - 20, y: safeZone.y, safe: true };
        const safeZoneEnd = { x: safeZone.x + safeZoneWidth, y: safeZone.y, safe: true };
    
        filteredPoints = filteredPoints.concat(safeZoneStart);
        filteredPoints = filteredPoints.concat(safeZoneEnd);
    
        filteredPoints.sort((a, b) => a.x - b.x);
    
        // Mark points outside the safe zone as 'false' for the 'safe' property
        filteredPoints.forEach(point => {
            if (!point.safe) {
                point.safe = false;
            }
        });
        
        return filteredPoints;
    }

    function moveLander (lander) {
        if(myKeyboard.keys.hasOwnProperty(rotateLeftKey)){
            myKeyboard.registerCommand(rotateLeftKey, lunarLander.rotateLeft())
            if(myKeyboard.keys.hasOwnProperty(thrustKey)){
                lunarLander.isMoving = true
            }
            else{
                lunarLander.isMoving = false
            }
            
        }
        if(myKeyboard.keys.hasOwnProperty(rotateRightKey)){
            myKeyboard.registerCommand(rotateRightKey, lunarLander.rotateRight())
            if(myKeyboard.keys.hasOwnProperty(thrustKey)){
                lunarLander.isMoving = true
            }
            else{
                lunarLander.isMoving = false
            }
            
        }
        if(myKeyboard.keys.hasOwnProperty(thrustKey)){
            myKeyboard.registerCommand(thrustKey, lunarLander.thrust())
            lunarLander.isMoving = true
        }
        if(Object.keys(myKeyboard.keys).length === 0){
            lunarLander.isMoving = false
        }

    }

    function gravity(){
        if(!collided) {
            lunarLander.landerGravity()
        }
    }

    function collisionDetection() {
        for(let x=0; x<terrainPoints.length-1; x++) {
                collision = lineCircleIntersection(terrainPoints[x], terrainPoints[x + 1], lunarLander.circle)
            if(collision.intersect){
                if(collision.safe && lunarLander.location.x>= safeZone.x && lunarLander.location.x <= safeZone.x + safeZoneWidth && Math.abs(lunarLander.location.y - safeZone.y) <= 30 && lunarLander.rotation && ((lunarLander.rotation.rotate* 180 / Math.PI) >= 355 || (lunarLander.rotation.rotate* 180 / Math.PI) <= 5) && Math.floor(Math.abs(momentumX + momentumY) / 0.1)<=10){
                    console.log("TEST")
                    winGame = true
                }
                    
                collided = true
                lunarLander.collided = true
            }
        }
        //TODO: make it so they cant go off the screen
    }

    function lineCircleIntersection(pt1, pt2, circle) {
        let v1 = { x: pt2.x - pt1.x, y: pt2.y - pt1.y };
        let v2 = { x: pt1.x - circle.center.x, y: pt1.y - circle.center.y };
        let b = -2 * (v1.x * v2.x + v1.y * v2.y);
        let c =  2 * (v1.x * v1.x + v1.y * v1.y);
        let d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
        if (isNaN(d)) { // no intercept
            return { intersect: false, safe: false }
        }
        // These represent the unit distance of point one and two on the line
        let u1 = (b - d) / c;  
        let u2 = (b + d) / c;
        if (u1 <= 1 && u1 >= 0 && pt1.safe) {  // If point on the line segment is safe
            return { intersect: true, safe: true };
        }
        if (u2 <= 1 && u2 >= 0 && pt2.safe) {  // If point on the line segment is safe
            return { intersect: true, safe: true };
        }
        if (u1 <= 1 && u1 >= 0) {  // If point on the line segment is not safe
            return { intersect: true, safe: false};
        }
        if (u2 <= 1 && u2 >= 0 ) {  // If point on the line segment is not safe
            return { intersect: true, safe: true };
        }
        return { intersect: false, safe: false };
    }

    
}(MyGame.systems, MyGame.render, MyGame.graphics));