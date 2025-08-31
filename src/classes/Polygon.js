export class Polygon {
    shapeOptions = ['equilateral', 'rect', 'pentagon', 'hexagon', 'octagon'];

    hueOptions = [60, 120, 180, 240, 300, 360];

    constructor(p5) {
        this.p = p5;
        this.shape = this.p.random(this.shapeOptions);
        this.colour = null;
        this.canDraw = false;
        this.minSize = 0;
        this.maxSize = 100;
        
        // Pattern properties - default to 'default' pattern
        this.patternType = 'default';
        this.rotationSpeed = this.p.random(0.01, 0.05);
        this.pulseSpeed = this.p.random(0.02, 0.08);
        this.waveOffset = 0;
        this.waveSpeed = this.p.random(0.03, 0.07);
        
        // Random rotation direction
        this.rotationDirection = this.p.random([-1, 1]);
        
        // Size progress properties
        this.duration = 0;
        this.birthTime = 0;
        this.progress = 0;
    }

    setPattern(patternType) {
        this.patternType = patternType;
    }

    setColour() {
        this.colour = this.p.random(this.p.colourScheme);
    }

    setAlternativePattern() {
        const altPatterns = ['spiral', 'pulse', 'rotation', 'wave'];
        this.patternType = this.p.random(altPatterns);
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
        
        // Update pattern animations
        this.waveOffset += this.waveSpeed;
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
        
        const shapesToDraw = Math.floor(this.progress * 8) + 1;
        
        switch(this.patternType) {
            case 'spiral':
                this.drawSpiralPattern(shapesToDraw);
                break;
            case 'pulse':
                this.drawPulsePattern(shapesToDraw);
                break;
            case 'rotation':
                this.drawRotationPattern(shapesToDraw);
                break;
            case 'wave':
                this.drawWavePattern(shapesToDraw);
                break;
            default:
                this.drawDefaultPattern(shapesToDraw);
        }
        
        this.p.pop();
    }

    drawSpiralPattern(shapesToDraw) {
        for (let i = 0; i < shapesToDraw; i++) {
            const angle = i * 0.5 * this.rotationDirection + this.p.frameCount * 0.02 * this.rotationDirection;
            const radius = i * 8;
            const xOffset = Math.cos(angle) * radius;
            const yOffset = Math.sin(angle) * radius;
            
            this.p.push();
            this.p.translate(xOffset, yOffset);
            this.p.rotate(angle * 2 * this.rotationDirection);
            
            let shapeSize = this.size / Math.pow(1.3, i);
            shapeSize = this.shape === 'rect' ? shapeSize * 0.8 : shapeSize;
            
            this.p.fill(this.colour);
            this.p.stroke(this.p.strokeColour[0], this.p.strokeColour[1], this.p.strokeColour[2], 0.3);
            this.p[this.shape](0, 0, shapeSize, shapeSize);
            this.p.pop();
        }
    }

    drawPulsePattern(shapesToDraw) {
        const pulse = Math.sin(this.p.frameCount * this.pulseSpeed) * 0.3 + 1;
        
        for (let i = 0; i < shapesToDraw; i++) {
            this.p.push();
            this.p.scale(pulse * (1 - i * 0.1));
            
            let shapeSize = this.size / Math.pow(1.2, i);
            shapeSize = this.shape === 'rect' ? shapeSize * 0.8 : shapeSize;
            
            this.p.fill(this.colour);
            this.p.stroke(this.p.strokeColour[0], this.p.strokeColour[1], this.p.strokeColour[2], 0.3);
            this.p[this.shape](0, 0, shapeSize, shapeSize);
            this.p.pop();
        }
    }

    drawRotationPattern(shapesToDraw) {
        for (let i = 0; i < shapesToDraw; i++) {
            this.p.push();
            this.p.rotate(i * 0.3 + this.p.frameCount * this.rotationSpeed);
            
            let shapeSize = this.size / Math.pow(1.2, i);
            shapeSize = this.shape === 'rect' ? shapeSize * 0.8 : shapeSize;
            
            this.p.fill(this.colour);
            this.p.stroke(this.p.strokeColour[0], this.p.strokeColour[1], this.p.strokeColour[2], 0.3);
            this.p[this.shape](0, 0, shapeSize, shapeSize);
            this.p.pop();
        }
    }

    drawWavePattern(shapesToDraw) {
        for (let i = 0; i < shapesToDraw; i++) {
            const waveX = Math.sin(this.waveOffset * this.rotationDirection + i * 0.5) * 15;
            const waveY = Math.cos(this.waveOffset * this.rotationDirection + i * 0.3) * 10;
            
            this.p.push();
            this.p.translate(waveX, waveY);
            this.p.rotate(Math.sin(this.waveOffset * this.rotationDirection + i * 0.2) * 0.2);
            
            let shapeSize = this.size / Math.pow(1.2, i);
            shapeSize = this.shape === 'rect' ? shapeSize * 0.8 : shapeSize;
            
            this.p.fill(this.colour);
            this.p.stroke(this.p.strokeColour[0], this.p.strokeColour[1], this.p.strokeColour[2], 0.3);
            this.p[this.shape](0, 0, shapeSize, shapeSize);
            this.p.pop();
        }
    }

    drawDefaultPattern(shapesToDraw) {
        for (let i = 0; i < shapesToDraw; i++) {
            let shapeSize = this.size / Math.pow(1.2, i);
            shapeSize = this.shape === 'rect' ? shapeSize * 0.8 : shapeSize;
            
            this.p.fill(this.colour);
            this.p.stroke(this.p.strokeColour[0], this.p.strokeColour[1], this.p.strokeColour[2], 0.3);
            this.p[this.shape](0, 0, shapeSize, shapeSize);
        }
    }
}