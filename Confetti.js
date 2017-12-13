import common from './common';

class Confetti {

    constructor (options) {

        // globals
        this.canvas;
        this.ctx;
        this.W;
        this.H;
        this.mp = 100; //max particles
        this.particles = [];
        this.speed = (common.isMobile()) ? 8 : 4;
        this.angle = 0;
        this.tiltAngle = 0;
        this.confettiActive = true;
        this.animationComplete = true;
        this.deactivationTimerHandler;
        this.reactivationTimerHandler;
        this.animationHandler;
        this.particleColors = {
            colorOptions: ["DodgerBlue", "OliveDrab", "Gold", "pink", "SlateBlue", "lightblue", "Violet", "PaleGreen", "SteelBlue", "SandyBrown", "Chocolate", "Crimson"],
            colorIndex: 0,
            colorIncrementer: 0,
            colorThreshold: 10,
            getColor: function () {
                if (this.colorIncrementer >= 10) {
                    this.colorIncrementer = 0;
                    this.colorIndex++;
                    if (this.colorIndex >= this.colorOptions.length) {
                        this.colorIndex = 0;
                    }
                }
                this.colorIncrementer++;
                return this.colorOptions[this.colorIndex];
            }
        }

        this.init(options.stopElId, options.startElId, options.toggleElId);

        this.Draw = this.Draw.bind(this);
        this.toggleConfetti = this.toggleConfetti.bind(this);
        this.InitializeButton = this.InitializeButton.bind(this);
        this.destroy = this.destroy.bind(this);
    }

    confettiParticle(color, W, H, mp, ctx) {
        this.x = Math.random() * W; // x-coordinate
        this.y = (Math.random() * H) - H; //y-coordinate
        this.r = common.randomFromTo(10, 30); //radius;
        this.d = (Math.random() * mp) + 10; //density;
        this.color = color;
        this.tilt = Math.floor(Math.random() * 10) - 10;
        this.tiltAngleIncremental = (Math.random() * 0.07) + .05;
        this.tiltAngle = 0;

        this.draw = function () {
            ctx.beginPath();
            ctx.lineWidth = this.r / 2;
            ctx.strokeStyle = this.color;
            ctx.moveTo(this.x + this.tilt + (this.r / 4), this.y);
            ctx.lineTo(this.x + this.tilt, this.y + this.tilt + (this.r / 4));
            return ctx.stroke();
        }
    }

    init(stopElId, startElId, toggleElId) {
        this.SetGlobals();
        this.InitializeButton(stopElId, startElId, toggleElId);
        this.InitializeConfetti();

        $(window).resize(function () {
            this.W = window.innerWidth;
            this.H = window.innerHeight;
            this.canvas.width = this.W;
            this.canvas.height = this.H;
        });
    }

    InitializeButton(stopElId, startElId, toggleElId) {
        var self = this;

        if (stopElId) {
            $('#' + stopElId).click(self.DeactivateConfetti.bind(self));
        }
        if (startElId) {
            $('#' + startElId).click(self.RestartConfetti.bind(self));
        }
        if (toggleElId) {
            $('#' + toggleElId).click(self.toggleConfetti.bind(self));
        }
    }

    SetGlobals() {
        this.canvas = document.getElementById("confetiStage");
        this.ctx = this.canvas.getContext("2d");
        this.W = window.innerWidth;
        this.H = window.innerHeight;
        this.canvas.width = this.W;
        this.canvas.height = this.H;
    }

    InitializeConfetti() {
        this.particles = [];
        this.animationComplete = false;
        for (var i = 0; i < this.mp; i++) {
            var particleColor = this.particleColors.getColor();
            this.particles.push(new this.confettiParticle(particleColor, this.W, this.H, this.mp, this.ctx));
        }
        this.StartConfetti();
    }

    Draw() {
        this.ctx.clearRect(0, 0, this.W, this.H);
        var results = [];
        for (var i = 0; i < this.mp; i++) {
            results.push(this.particles[i].draw());
        }
        this.Update();

        return results;
    }

    Update() {
        var remainingFlakes = 0;
        var particle;
        this.angle += 0.01;
        this.tiltAngle += 0.1;

        for (var i = 0; i < this.mp; i++) {
            particle = this.particles[i];
            if (this.animationComplete) return;

            if (!this.confettiActive && particle.y < -15) {
                particle.y = this.H + 100;
                continue;
            }

            this.stepParticle(particle, i);

            if (particle.y <= this.H) {
                remainingFlakes++;
            }
            this.CheckForReposition(particle, i);
        }

        if (remainingFlakes === 0) {
            this.StopConfetti();
        }
    }

    CheckForReposition(particle, index) {
        if ((particle.x > this.W + 20 || particle.x < -20 || particle.y > this.H) && this.confettiActive) {
            if (index % 5 > 0 || index % 2 == 0) //66.67% of the flakes
            {
                this.repositionParticle(particle, Math.random() * this.W, -10, Math.floor(Math.random() * 10) - 10);
            } else {
                if (Math.sin(this.angle) > 0) {
                    //Enter from the left
                    this.repositionParticle(particle, -5, Math.random() * this.H, Math.floor(Math.random() * 10) - 10);
                } else {
                    //Enter from the right
                    this.repositionParticle(particle, this.W + 5, Math.random() * this.H, Math.floor(Math.random() * 10) - 10);
                }
            }
        }
    }
    stepParticle(particle, particleIndex) {
        particle.tiltAngle += particle.tiltAngleIncremental;
        particle.y += (Math.cos(this.angle + particle.d) + 3 + particle.r / 2) / this.speed;
        particle.x += Math.sin(this.angle);
        particle.tilt = (Math.sin(particle.tiltAngle - (particleIndex / 3))) * 15;
    }

    repositionParticle(particle, xCoordinate, yCoordinate, tilt) {
        particle.x = xCoordinate;
        particle.y = yCoordinate;
        particle.tilt = tilt;
    }

    StartConfetti() {
        var self = this;
        this.W = window.innerWidth;
        this.H = window.innerHeight;
        this.canvas.width = this.W;
        this.canvas.height = this.H;
        (function animloop() {
            if (self.animationComplete) return null;
            self.animationHandler = requestAnimFrame(animloop);
            return self.Draw();
        })();
    }

    ClearTimers() {
        clearTimeout(this.reactivationTimerHandler);
        clearTimeout(this.animationHandler);
    }

    toggleConfetti() {
        if (this.confettiActive) {
            this.DeactivateConfetti();
        } else {
            this.RestartConfetti();
        }
    }

    DeactivateConfetti() {
        this.confettiActive = false;
        this.ClearTimers();
    }

    StopConfetti() {
        this.animationComplete = true;
        if (this.ctx == undefined) return;
        this.ctx.clearRect(0, 0, this.W, this.H);
    }

    RestartConfetti() {
        this.ClearTimers();
        this.StopConfetti();
        this.reactivationTimerHandler = setTimeout( () => {
            this.confettiActive = true;
            this.animationComplete = false;
            this.InitializeConfetti();
        }, 100);
    }

    destroy() {
        this.ClearTimers();
        this.animationComplete = true;
    }

}

export default Confetti;