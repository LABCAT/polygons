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
        this.duration = 0;
        this.birthTime = 0;
        this.progress = 0;
    }

    init(duration) {
        this.duration = duration * 1000;
        this.birthTime = this.p.song.currentTime() * 1000;
        this.progress = 0;
    }

    update() {
        if(this.progress < 1) {
            const currentTime = this.p.song.currentTime() * 1000;
            const elapsed = currentTime - this.birthTime;
            const rawProgress = elapsed / this.duration;
            this.progress = this.p.constrain(rawProgress, 0, 1);
        }
    }

    draw(x, y) {
        if(!this.canDraw) return;
        
        this.update();
        
        this.p.push();
        if (this.shape === 'equilateral') {
            this.p.translate(x, y + this.size * 0.125);
        } else {
            this.p.translate(x, y);
        }
        this.p.fill(this.colour);
        this.p.stroke(0, 0, 100, 0.3);
        
        const shapesToDraw = Math.floor(this.progress * 5) + 1;
        for (let i = 0; i < shapesToDraw; i++) {
            let shapeSize = this.size / Math.pow(1.2, i);
            shapeSize = this.shape === 'rect' ? shapeSize * 0.8 : shapeSize;
            this.p[this.shape](0, 0, shapeSize, shapeSize);
        }
        
        this.p.pop();
    }
}