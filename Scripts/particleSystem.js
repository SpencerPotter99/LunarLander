MyGame.systems.ParticleSystem = function(spec) {
    'use strict';
    let nextName = 1;       // Unique identifier for the next particle
    let particles = {};

    //------------------------------------------------------------------
    //
    // This creates one new particle
    //
    //------------------------------------------------------------------
    function create(startPosition) {
        let p = {
                center: {x: startPosition.x, y: startPosition.y},
                size: { x: spec.size.x, y: spec.size.y },
                direction: nextCircleVector(),
                speed: nextGaussian(spec.speed.mean, spec.speed.stdev), // pixels per second
                rotation: 0,
                lifetime: nextGaussian(spec.lifetime.mean, spec.lifetime.stdev),    // How long the particle should live, in seconds
                alive: 0    // How long the particle has been alive, in seconds
            };

        return p;
    }

    function nextCircleVector() {
        let angle = Math.random() * 2 * Math.PI;
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
    function update(elapsedTime, lunarLander) {
        let removeMe = [];

        //
        // We work with time in seconds, elapsedTime comes in as milliseconds
        elapsedTime = elapsedTime / 1000;
        
       // Calculate the starting position of the particles based on the lunar lander's location
    let startPosition = {
        x: lunarLander.location.x,
        y: lunarLander.location.y
    };

    Object.getOwnPropertyNames(particles).forEach(function(value, index, array) {
        let particle = particles[value];

        // Update how long it has been alive
        particle.alive += elapsedTime;

        // Update its center
        particle.center.x += (elapsedTime * particle.speed * particle.direction.x);
        particle.center.y += (elapsedTime * particle.speed * particle.direction.y);

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
        for (let particle = 0; particle < 1; particle++) {
            //
            // Assign a unique name to each particle
            particles[nextName++] = create(startPosition);
        }
    }

    let api = {
        update: update,
        get particles() { return particles; }
    };

    return api;
}
