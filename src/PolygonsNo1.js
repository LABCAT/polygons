import { Midi } from '@tonejs/midi';
import { Polygon } from './classes/Polygon.js';
import ColorGenerator from './lib/p5.colorGenerator.js';

const audio = './audio/polygons-no-1.ogg';
const midi = './audio/polygons-no-1.mid';

const PolygonsNo1 = (p) => {
    /** 
     * Core audio properties
     */
    p.song = null;
    p.PPQ = 3840 * 4;
    p.bpm = 96;
    p.audioLoaded = false;
    p.songHasFinished = false;
    p.showingStatic = true;

    /** 
     * Preload function - Loading audio and setting up MIDI
     * This runs first, before setup()
     */
    p.preload = () => {
        /** 
         * Log when preload starts
         */
        p.song = p.loadSound(audio, p.loadMidi);
        p.song.onended(() => {
            p.songHasFinished = true;
            if (p.canvas) {
                p.canvas.classList.add('p5Canvas--cursor-play');
                p.canvas.classList.remove('p5Canvas--cursor-pause');
            }
        });
    };

    /** 
     * Setup function - Initialize your canvas and any starting properties
     * This runs once after preload
     */
    p.setup = () => {
        const seed = p.hashToSeed(hl.tx.hash + hl.tx.tokenId);
        console.log(`Hash: ${hl.tx.hash}, TokenID: ${hl.tx.tokenId}, Seed: ${seed}`);
        p.randomSeed(seed);
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.canvas.classList.add('p5Canvas--cursor-play');
        p.background(0, 0, 0);
        p.rectMode(p.CENTER);
        p.colorMode(p.HSB);
        p.strokeWeight(2);
        p.grid = p.generateRandomGrid();
    };


    /** 
     * Main draw loop - This is where your animations happen
     * This runs continuously after setup
     */
    p.draw = () => {
        if (p.showingStatic) {
            p.background(0, 0, 0);
            p.drawGrid();
            p.noLoop(); 
        } else if(p.audioLoaded && p.song.isPlaying() || p.songHasFinished){
            p.background(0, 0, 0);
            p.drawGrid();
        }
    }

    /**
     * Draw the grid with centered square cells
     * Each cell is colored based on its position using HSB color mode
     */
    p.drawGrid = () => {
        if (!p.grid) return;
        
        const gridSize = p.grid.rows;
        const canvasSize = Math.min(p.width, p.height);
        const gridTotalSize = canvasSize * 0.95;
        const cellSize = gridTotalSize / gridSize;
        const startX = (p.width - gridTotalSize) / 2;
        const startY = (p.height - gridTotalSize) / 2;
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const x = startX + col * cellSize + cellSize / 2;
                const y = startY + row * cellSize + cellSize / 2;
                
                const polygon = p.grid.grid[row][col];
                polygon.size = cellSize;
                polygon.draw(x, y);
            }
        }
    };

    /** 
     * MIDI loading and processing
     * Handles synchronization between audio and visuals
     */
    p.loadMidi = () => {
        Midi.fromUrl(midi).then((result) => {
            /** 
             * Log when MIDI is loaded
             */
            console.log('MIDI loaded:', result);
            /** 
             * Example: Schedule different tracks for different visual elements
             */
            const track1 = result.tracks[5].notes; // Rodent Lead
            p.scheduleCueSet(track1, 'executeTrack1');
            document.getElementById("loader").classList.add("loading--complete");
            document.getElementById('play-icon').classList.add('fade-in');
            p.audioLoaded = true;
        });
    };

    /** 
     * Schedule MIDI cues to trigger animations
     * @param {Array} noteSet - Array of MIDI notes
     * @param {String} callbackName - Name of the callback function to execute
     * @param {Boolean} polyMode - Allow multiple notes at same time if true
     */
    p.scheduleCueSet = (noteSet, callbackName, polyMode = false) => {
        let lastTicks = -1,
            currentCue = 1;
        for (let i = 0; i < noteSet.length; i++) {
            const note = noteSet[i],
                { ticks, time } = note;
            if(ticks !== lastTicks || polyMode){
                note.currentCue = currentCue;
                p.song.addCue(time, p[callbackName], note);
                lastTicks = ticks;
                currentCue++;
            }
        }
    }

    p.executeTrack1 = (note) => {
        const { currentCue, durationTicks } = note;
        const duration = (durationTicks / p.PPQ) * (60 / p.bpm);

        const barStartCues = [1, 13, 24, 36];
        
        
        if (barStartCues.includes(currentCue % 45)) {
            p.grid = p.generateRandomGrid();
        } 
        const availableCells = p.grid.grid.flat().filter(cell => !cell.canDraw);
        const totalCells = p.grid.rows * p.grid.cols;
        const cellsToActivate = Math.floor(totalCells / 16);
        
        for (let i = 0; i < cellsToActivate && availableCells.length > 0; i++) {
            const selectedCell = p.random(availableCells);
            selectedCell.canDraw = true;
            selectedCell.init(duration);
            availableCells.splice(availableCells.indexOf(selectedCell), 1);
        }
    }

    p.executeTrack2 = (note) => {
        const { currentCue, durationTicks } = note;
        const duration = (durationTicks / p.PPQ) * (60 / p.bpm);

    }

    /** 
     * Handle mouse/touch interaction
     * Controls play/pause and reset functionality
     */
    p.mousePressed = () => {
        if(p.audioLoaded){
            if (p.song.isPlaying()) {
                p.song.pause();
                if (p.canvas) {
                    p.canvas.classList.add('p5Canvas--cursor-play');
                    p.canvas.classList.remove('p5Canvas--cursor-pause');
                }
            } else {
                if (parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)) {
                    /** 
                     * Reset animation properties here
                     */
                }
                document.getElementById("play-icon").classList.remove("fade-in");
                p.song.play();
                p.showingStatic = false;
                p.loop(); // Restart the draw loop
                if (p.canvas) {
                    p.canvas.classList.add('p5Canvas--cursor-pause');
                    p.canvas.classList.remove('p5Canvas--cursor-play');
                }
            }
        }
    }

     /** 
     * Convert a string to a deterministic seed for p5.js random functions
     * Used with highlight.xyz for consistent generative art
     * @param {String} str - The string to convert to a seed
     * @returns {Number} - A deterministic seed value
     */
    p.hashToSeed = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
        }
        return Math.abs(hash);
    };
    
    /**
     * Utility: Check if the canvas is in portrait orientation
     * @returns {Boolean} true if portrait, false otherwise
     */
    p.isPortraitCanvas = () => {
        return p.height > p.width;
    };

    p.colourScheme = [];
    p.numOfRows = 0;

    /**
     * Generate a random grid with equal rows and columns
     * Grid size will be randomly selected between 4 and 8 (inclusive)
     * Ensures the new grid size is always different from the previous one
     * Each cell contains a random value between 0 and 1
     * @returns {Object} Object containing rows, cols, and the generated grid
     */
    p.generateRandomGrid = () => {
        const availableSizes = [4,5,6,7,8,9,10,11,12].filter(size => size !== p.numOfRows);
        const grid = [];
        p.numOfRows = p.random(availableSizes);
        p.colourScheme = new ColorGenerator(p, 'bright', 0.4).getTetradic();
        
        for (let row = 0; row < p.numOfRows; row++) {
            grid[row] = [];
            for (let col = 0; col < p.numOfRows; col++) {
                const polygon = new Polygon(p);
                grid[row][col] = polygon;
            }
        }
        
        return {
            rows: p.numOfRows,
            cols: p.numOfRows,
            grid: grid
        };
    };
};

export default PolygonsNo1;