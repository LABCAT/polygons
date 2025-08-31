export class Polygon {
    shapeOptions = ['equilateral', 'rect', 'pentagon', 'hexagon', 'octagon'];

    hueOptions = [60, 120, 180, 240, 300, 360];

    constructor(p5) {
        this.p = p5;
        this.shape = this.p.random(this.shapeOptions);
        this.colour = this.p.random(this.p.colourScheme);
        this.canDraw = false;
        this.minSize = 0;
        this.maxSize = 100;
                
        // Size progress properties
        this.duration = null;
        this.birthTime = null;
        this.progress = 0;
        
        // Draw progress properties
        this.drawProgressEnabled = false;
        this.drawElements = [];
        this.drawProgress = 0;
        this.drawDuration = null;
        this.drawBirthTime = null;
        
        this.initDrawProgress();
    }

    initDrawProgress() {
        // Increase the likelihood of using a fixed color for the whole donut (e.g., 80% chance)
        this.useFixedColour = this.p.random() < 0.8; // 80% chance
        this.fixedColour = this.p.random(this.p.currentColorScheme);

        // Create draw elements array - only the main drawing loops
        this.drawElements = [];
        for (let i = 0; i < (this.numOfRotations * 2); i++) {
            for (let j = 0; j <= 4; j++) {
                this.drawElements.push({
                    type: 'shape',
                    rotation: i,
                    size: j,
                    order: i * 5 + j,
                    colour: this.useFixedColour ? this.fixedColour : this.p.random(this.p.currentColorScheme),
                    // Add randomized rotation offset
                    rotationOffset: this.p.random(-this.p.PI, this.p.PI)
                });
            }
        }
        this.drawElements = this.p.shuffle(this.drawElements);
    }

    init(duration) {
        this.duration = duration * 1000;
        this.birthTime = this.p.song.currentTime() * 1000;
        this.progress = 0;
    }

    update() {
        const currentTime = this.p.song.currentTime() * 1000;
        const elapsed = currentTime - this.birthTime;
        const rawProgress = elapsed / this.duration;
        this.progress = this.p.constrain(rawProgress, 0, 1);
    }

    draw(x, y) {
        if(!this.canDraw) return;
        
        this.update();
        
        this.p.push();
        this.p.translate(x, y);
        this.p.fill(this.colour);
        this.p.stroke(0, 0, 100, 0.4);
        
        const shapesToDraw = Math.floor(this.progress * 3) + 1;
        for (let i = 0; i < shapesToDraw; i++) {
            let shapeSize = this.size / Math.pow(2, i);
            shapeSize = this.shape === 'rect' ? shapeSize * 0.8 : shapeSize;
            this.p[this.shape](0, 0, shapeSize, shapeSize);
        }
        
        this.p.pop();
    }
}