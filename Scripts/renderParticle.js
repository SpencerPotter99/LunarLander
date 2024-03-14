MyGame.render.ParticleSystem  = function (system, graphics, fillStyle, strokeStyle) {
    'use strict';

    //------------------------------------------------------------------
    //
    // Render all particles
    //
    //------------------------------------------------------------------
    function render() {
        Object.getOwnPropertyNames(system.particles).forEach(function (value) {
            let particle = system.particles[value];
            graphics.drawRectangle(particle, fillStyle, strokeStyle);
        });
    }

    let api = {
        render: render
    };

    return api;
};
