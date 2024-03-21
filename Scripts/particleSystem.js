MyGame.systems.ParticleSystem = function(spec) {
    'use strict';
    let nextName = 1;       // Unique identifier for the next particle
    let particles = {};

    function clearParticles() {
        particles = {}
    }

    //------------------------------------------------------------------
    //
    // This creates one new particle
    //
    //------------------------------------------------------------------
    function create(lunarLander) {
        const offsetX = 0; 
        const offsetY = 10;
        const rotatedOffsetX = offsetX * Math.cos(lunarLander.rotation.rotate) - offsetY * Math.sin(lunarLander.rotation.rotate); // Adjusted signs here
        const rotatedOffsetY = offsetX * Math.sin(lunarLander.rotation.rotate) + offsetY * Math.cos(lunarLander.rotation.rotate);
        let p = {
                center: {x: lunarLander.location.x + rotatedOffsetX, y: lunarLander.location.y + rotatedOffsetY},
                size: { x: spec.size.x, y: spec.size.y },
                direction: nextCircleVector(lunarLander.rotation.rotate, lunarLander.collided),
                speed: nextGaussian(spec.speed.mean, spec.speed.stdev), // pixels per second
                rotation: 0,
                lifetime: nextGaussian(spec.lifetime.mean, spec.lifetime.stdev),    // How long the particle should live, in seconds
                alive: 0,    // How long the particle has been alive, in seconds
                collided: lunarLander.collided
            };

        return p;
    }

    function nextCircleVector(rotation, collision) {
        const arcAngle = Math.PI / 4
        let startAngle = rotation - ((arcAngle - (Math.PI / 1.25)) / 2);
        let angle = 0
        if(collision){
            angle = Math.random() * 2 * Math.PI;
        }
        else {
            angle = startAngle + Math.random() * arcAngle;
            console.log(rotation)
            console.log(angle)

        }
        

        return {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
    }

    let usePrevious = false;
    let y2;

    function nextGaussian(mean, stdDev) {
        let x1 = 0;
        let x2 = 0;
        let y1 = 0;
        let z = 0;

        if (usePrevious) {
            usePrevious = false;
            return mean + y2 * stdDev;
        }

        usePrevious = true;

        do {
            x1 = 2 * Math.random() - 1;
            x2 = 2 * Math.random() - 1;
            z = (x1 * x1) + (x2 * x2);
        } while (z >= 1);
        
        z = Math.sqrt((-2 * Math.log(z)) / z);
        y1 = x1 * z;
        y2 = x2 * z;
        
        return mean + y1 * stdDev;
    }


    //------------------------------------------------------------------
    //
    // Update the state of all particles.  This includes removing any that have exceeded their lifetime.
    //
    //------------------------------------------------------------------
    function update(elapsedTime, lunarLander, momentumX, momentumY) {
        let removeMe = [];

        //
        // We work with time in seconds, elapsedTime comes in as milliseconds
        elapsedTime = elapsedTime / 1000;
        
       // Calculate the starting position of the particles based on the lunar lander's location
    let startPosition = {
        x: lunarLander?.location?.x,
        y: lunarLander?.location?.y
    };

    Object.getOwnPropertyNames(particles).forEach(function(value, index, array) {
        let particle = particles[value];

        // Update how long it has been alive
        particle.alive += elapsedTime;
        

        // Update its center
        particle.center.x += (elapsedTime * particle.speed * particle.direction.x);
        particle.center.y += (elapsedTime * particle.speed * particle.direction.y);
        if(!lunarLander.collided){
        particle.center.y +=Math.abs(lunarLander.velocityY )
        particle.center.y += .015 
        particle.center.x-= .01
        }


        // Rotate proportional to its speed
        particle.rotation += particle.speed / 500;

        // If the lifetime has expired, identify it for removal
        if (particle.alive > particle.lifetime) {
            removeMe.push(value);
        }
    });

        //
        // Remove all of the expired particles
        for (let particle = 0; particle < removeMe.length; particle++) {
            delete particles[removeMe[particle]];
        }
        removeMe.length = 0;

        //
        // Generate some new particles
        if (lunarLander?.isMoving || lunarLander.collided){
            for (let particle = 0; particle < 1; particle++) {
                //
                // Assign a unique name to each particle
                particles[nextName++] = create(lunarLander);
            }
        }
    }

    let api = {
        update: update,
        clearParticles: clearParticles,
        get particles() { return particles; }
    };

    return api;
}
