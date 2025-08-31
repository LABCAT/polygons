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

    p.colourScheme = [];

    p.generateColourScheme = () => {
        p.colourScheme = new ColorGenerator(p, 'bright', 0.2).getTetradic();
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
        p.selectedGridType = p.generateRectGrid;
        p.grid = p.generateRectGrid();
    };


    /** 
     * Main draw loop - This is where your animations happen
     * This runs continuously after setup
     */
    p.draw = () => {
        if (p.showingStatic) {
            p.background(0, 0, 0, 0.9);
            p.drawGrid();
            p.noLoop(); 
        } else if(p.audioLoaded && p.song.isPlaying() || p.songHasFinished){
            p.background(0, 0, 0, 0.9);
            p.drawGrid();
        }
    }

    /**
     * Draw the grid with centered square cells
     * Each cell is colored based on its position using HSB color mode
     */
    p.drawGrid = () => {
        if (!p.grid) return;
        if (p.grid.layout === 'hexagon') {
            p.drawHexagonGrid();
        } else if (p.grid.layout === 'triangle') {
            p.drawTriGrid();
        } else if (p.grid.layout === 'pentagon') {
            p.drawPentagonGrid();
        } else if (p.grid.layout === 'octagon') {
            p.drawOctagonGrid();
        } else {
            p.drawRectangularGrid();
        }
    };

    p.drawRectangularGrid = () => {
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

    p.drawHexagonGrid = () => {
        if (!p.grid || p.grid.layout !== 'hexagon') {
            return;
        }
        
        const gridRadius = p.grid.gridRadius;
        const canvasSize = Math.min(p.width, p.height);
        const cellSize = (canvasSize * 0.5) / (gridRadius * 2);
        const hexWidth = cellSize * 1.5;
        const hexHeight = cellSize * Math.sqrt(3);
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        
        let cellIndex = 0;
        for (let q = -gridRadius; q <= gridRadius; q++) {
            for (let r = Math.max(-gridRadius, -q - gridRadius); r <= Math.min(gridRadius, -q + gridRadius); r++) {
                const x = centerX + hexWidth * q;
                const y = centerY + hexHeight * (r + q/2);
                
                const polygon = p.grid.grid[cellIndex];
                polygon.size = cellSize;
                polygon.draw(x, y);
                cellIndex++;
            }
        }
    };

    p.drawTriGrid = () => {
        if (!p.grid || p.grid.layout !== 'triangle') {
            return;
        }
        
        const triangleSize = p.grid.triangleSize;
        
        for (let i = 0; i < p.grid.grid.length; i++) {
            const polygon = p.grid.grid[i];
            polygon.size = triangleSize;
            polygon.draw(polygon.x, polygon.y);
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
            const track2 = result.tracks[8].notes; // Big Cat Arp
            p.scheduleCueSet(track1, 'executeTrack1');
            p.scheduleCueSet(track2, 'executeTrack2');
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


    p.activateGridCells = (note) => {
        const { currentCue, durationTicks } = note;
        const duration = (durationTicks / p.PPQ) * (60 / p.bpm);

        let availableCells;
        let totalCells;
        
        if (p.grid.layout === 'rect') {
            availableCells = p.grid.grid.flat().filter(cell => !cell.canDraw);
            totalCells = p.grid.rows * p.grid.cols;
        } else {
            availableCells = p.grid.grid.filter(cell => !cell.canDraw);
            totalCells = p.grid.grid.length;
        }
        

        
        const barEndCues = [11, 22, 34, 44];
        let cellsToActivate;
        
        if (barEndCues.includes(currentCue % 45)) {
            cellsToActivate = availableCells.length;
        } else {
            cellsToActivate = Math.floor(totalCells / 12);
        }
        

        
        for (let i = 0; i < cellsToActivate && availableCells.length > 0; i++) {
            const selectedCell = p.random(availableCells);
            selectedCell.canDraw = true;
            selectedCell.init(duration);
            availableCells.splice(availableCells.indexOf(selectedCell), 1);
        }
    };

    p.setSelectedGridType = () => {
        const gridTypes = [p.generateRectGrid, p.generateTriGrid, p.generateHexGrid, p.generatePentGrid, p.generateOctGrid];
        const currentType = p.grid.layout === 'rect' ? p.generateRectGrid : 
                           p.grid.layout === 'triangle' ? p.generateTriGrid : 
                           p.grid.layout === 'hexagon' ? p.generateHexGrid :
                           p.grid.layout === 'pentagon' ? p.generatePentGrid :
                           p.generateOctGrid;
        const availableTypes = gridTypes.filter(type => type !== currentType);
        return p.random(availableTypes);
    };

    p.executeTrack1 = (note) => {
        const { currentCue } = note;

        const barStartCues = [1, 13, 24, 36];
        
        if (barStartCues.includes(currentCue % 45)) {
            if(currentCue % 45 === 1) {
                p.selectedGridType = p.setSelectedGridType();
            }
            p.grid = p.selectedGridType();
        } 
        
        p.activateGridCells(note);
    }

    p.executeTrack2 = (note) => {
        const { currentCue } = note;

        const barStartCues = [1, 13, 24, 36];
        
        if (barStartCues.includes(currentCue % 45)) {
            if(currentCue % 45 === 1) {
                p.selectedGridType = p.setSelectedGridType();
            }
            p.grid = p.selectedGridType();
        } 
        
        p.activateGridCells(note);
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

    /**
     * Generate a random grid with equal rows and columns
     * Grid size will be randomly selected between 4 and 8 (inclusive)
     * Ensures the new grid size is always different from the previous one
     * Each cell contains a random value between 0 and 1
     * @returns {Object} Object containing rows, cols, and the generated grid
     */
    p.numOfRows = 0;
    p.generateRectGrid = () => {
        const availableSizes = [4,5,6,7,8,9,10,11,12].filter(size => size !== p.numOfRows);
        const grid = [];
        p.numOfRows = p.random(availableSizes);
        p.generateColourScheme();
        
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
            layout: 'rect',
            grid: grid
        };
    };

    /**
     * Generate a hexagonal grid with polygons
     * @returns {Object} Object containing the hexagonal grid data
     */
    p.hexGridRadius = 0;
    p.generateHexGrid = () => {
        const availableSizes = [2, 3, 4, 5, 6].filter(size => size !== p.hexGridRadius);
        p.hexGridRadius = p.random(availableSizes);
        p.generateColourScheme();
        const hexGrid = [];
        
        for (let q = -p.hexGridRadius; q <= p.hexGridRadius; q++) {
            for (let r = Math.max(-p.hexGridRadius, -q - p.hexGridRadius); r <= Math.min(p.hexGridRadius, -q + p.hexGridRadius); r++) {
                const polygon = new Polygon(p);
                hexGrid.push(polygon);
            }
        }
        
        return {
            gridRadius: p.hexGridRadius,
            layout: 'hexagon',
            grid: hexGrid
        };
    };

    /**
     * Generate a triangular grid that covers the whole screen
     * @returns {Object} Object containing the triangular grid data
     */
    p.triGridRows = 0;
    p.generateTriGrid = () => {
        const availableSizes = [6, 7, 8, 9, 10].filter(size => size !== p.triGridRows);
        p.triGridRows = p.random(availableSizes);
        p.generateColourScheme();
        const triGrid = [];
        
        const triangleHeight = p.height / (p.triGridRows + 1);
        const triangleSize = Math.max(triangleHeight / (Math.sqrt(3) / 2), 20);
        const triangleWidth = triangleSize;
        
        const centerX = p.width / 2;
        const startY = triangleHeight;
        

        
        for (let row = 0; row < p.triGridRows; row++) {
            const polygonsInRow = row + 1;
            const rowWidth = polygonsInRow * triangleWidth;
            const startX = centerX - (rowWidth / 2) + (triangleWidth / 2);
            
            for (let col = 0; col < polygonsInRow; col++) {
                const polygon = new Polygon(p);
                polygon.x = startX + col * triangleWidth;
                polygon.y = startY + row * triangleHeight;
                triGrid.push(polygon);
            }
        }
        
        return {
            triangleSize: triangleSize,
            maxRows: p.triGridRows,
            layout: 'triangle',
            grid: triGrid
        };
    };

    p.drawPentagonGrid = () => {
        if (!p.grid || p.grid.layout !== 'pentagon') {
            return;
        }
        
        const pentagonSize = p.grid.pentagonSize;
        
        for (let i = 0; i < p.grid.grid.length; i++) {
            const polygon = p.grid.grid[i];
            polygon.size = pentagonSize;
            polygon.draw(polygon.x, polygon.y);
        }
    };

    p.drawOctagonGrid = () => {
        if (!p.grid || p.grid.layout !== 'octagon') {
            return;
        }
        
        const octagonSize = p.grid.octagonSize;
        
        for (let i = 0; i < p.grid.grid.length; i++) {
            const polygon = p.grid.grid[i];
            polygon.size = octagonSize;
            polygon.draw(polygon.x, polygon.y);
        }
    };



    p.pentGridRows = 0;
    p.generatePentGrid = () => {
        p.generateColourScheme();
        const pentGrid = [];
        
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        const maxRadius = Math.min(p.width, p.height) * 0.45;
        const availableSizes = [3,4,5,6].filter(size => size !== p.pentGridRows);
        const pointsPerEdge = p.random(availableSizes);
        p.pentGridRows = pointsPerEdge;
        const pentagonSize = maxRadius / (pointsPerEdge * 1.25);
        
        const layerRadius = maxRadius;
        const pentagonVertices = [];
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = centerX + Math.cos(angle) * layerRadius;
            const y = centerY + Math.sin(angle) * layerRadius;
            pentagonVertices.push({x, y});
        }
        
        for (let edge = 0; edge < 5; edge++) {
            const startX = pentagonVertices[edge].x;
            const startY = pentagonVertices[edge].y;
            const endX = pentagonVertices[(edge + 1) % 5].x;
            const endY = pentagonVertices[(edge + 1) % 5].y;
            
            for (let i = 1; i < pointsPerEdge; i++) {
                const t = i / (pointsPerEdge - 1);
                const polygon = new Polygon(p);
                polygon.x = startX + (endX - startX) * t;
                polygon.y = startY + (endY - startY) * t;
                pentGrid.push(polygon);
            }
        }
        
        const rows = {};
        pentGrid.forEach(polygon => {
            const yKey = Math.round(polygon.y);
            if (!rows[yKey]) rows[yKey] = [];
            rows[yKey].push(polygon);
        });
        
        const sortedRows = Object.keys(rows).map(Number).sort((a, b) => a - b);
        
        const calculateTargetCounts = (pointsPerEdge) => {
            const numRows = pointsPerEdge * 2 - 1;
            const targetCounts = [];
            
            for (let row = 0; row < numRows; row++) {
                if (row === 0) {
                    targetCounts.push(1);
                } else if (row < pointsPerEdge) {
                    targetCounts.push(2 * row + 1);
                } else {
                    const remainingRows = numRows - row;
                    if (remainingRows === 0) {
                        targetCounts.push(2 * remainingRows + 2);
                    } else {
                        targetCounts.push(2 * remainingRows + 1);
                    }
                }
            }
            
            return targetCounts;
        };
        
        const targetCounts = calculateTargetCounts(pointsPerEdge);
        
        for (let i = 0; i < sortedRows.length && i < targetCounts.length; i++) {
            const currentRow = rows[sortedRows[i]];
            const currentCount = currentRow.length;
            const targetCount = targetCounts[i];
            
            if (currentCount < targetCount) {
                const currentXPositions = currentRow.map(p => Math.round(p.x)).sort((a, b) => a - b);
                const minX = Math.min(...currentXPositions);
                const maxX = Math.max(...currentXPositions);
                const range = maxX - minX;
                
                const spacing = range / (targetCount - 1);
                
                for (let j = 0; j < targetCount; j++) {
                    const targetX = minX + (spacing * j);
                    const xRounded = Math.round(targetX);
                    const yRounded = Math.round(currentRow[0].y);
                    
                    const existingPolygon = currentRow.find(p => Math.round(p.x) === xRounded);
                    if (!existingPolygon) {
                        const polygon = new Polygon(p);
                        polygon.x = targetX;
                        polygon.y = yRounded;
                        pentGrid.push(polygon);
                    }
                }
            }
        }
        
        return {
            pentagonSize: pentagonSize,
            maxRows: p.pentGridRows,
            layout: 'pentagon',
            grid: pentGrid
        };
    };

    p.octGridRows = 0;
    p.generateOctGrid = () => {
        p.generateColourScheme();
        const octGrid = [];
        
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        const maxRadius = Math.min(p.width, p.height) * 0.45;
        const availableSizes = [3, 4, 5].filter(size => size !== p.octGridRows);
        const pointsPerEdge = p.random(availableSizes);
        p.octGridRows = pointsPerEdge;
        const octagonSize = maxRadius / (pointsPerEdge * 1.25 + 0.5);
        
        const layerRadius = maxRadius;
        const octagonVertices = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4 + Math.PI / 8;
            const x = centerX + Math.cos(angle) * layerRadius;
            const y = centerY + Math.sin(angle) * layerRadius;
            octagonVertices.push({x, y});
        }
        
        for (let edge = 0; edge < 8; edge++) {
            const startX = octagonVertices[edge].x;
            const startY = octagonVertices[edge].y;
            const endX = octagonVertices[(edge + 1) % 8].x;
            const endY = octagonVertices[(edge + 1) % 8].y;
            
            for (let i = 1; i < pointsPerEdge; i++) {
                const t = i / (pointsPerEdge - 1);
                const polygon = new Polygon(p);
                polygon.x = startX + (endX - startX) * t;
                polygon.y = startY + (endY - startY) * t;
                octGrid.push(polygon);
            }
        }
        
        const rows = {};
        octGrid.forEach(polygon => {
            const yKey = Math.round(polygon.y);
            if (!rows[yKey]) rows[yKey] = [];
            rows[yKey].push(polygon);
        });
        
        const sortedRows = Object.keys(rows).map(Number).sort((a, b) => a - b);
        
        const calculateTargetCounts = (pointsPerEdge) => {
            const numRows = pointsPerEdge * 3 - 2;
            const targetCounts = [];
            
            for (let row = 0; row < numRows; row++) {
                if (row < Math.floor(numRows / 2)) {
                    targetCounts.push(pointsPerEdge + (row * 2));
                } else {
                    const remainingRows = numRows - row - 1;
                    targetCounts.push(pointsPerEdge + (remainingRows * 2));
                }
            }
            
            return targetCounts;
        };
        
        const targetCounts = calculateTargetCounts(pointsPerEdge);
        
        for (let i = 0; i < sortedRows.length && i < targetCounts.length; i++) {
            const currentRow = rows[sortedRows[i]];
            const currentCount = currentRow.length;
            const targetCount = targetCounts[i];
            
            if (currentCount < targetCount) {
                const currentXPositions = currentRow.map(p => Math.round(p.x)).sort((a, b) => a - b);
                const minX = Math.min(...currentXPositions);
                const maxX = Math.max(...currentXPositions);
                const range = maxX - minX;
                
                const spacing = range / (targetCount - 1);
                
                for (let j = 0; j < targetCount; j++) {
                    const targetX = minX + (spacing * j);
                    const xRounded = Math.round(targetX);
                    const yRounded = Math.round(currentRow[0].y);
                    
                    const existingPolygon = currentRow.find(p => Math.round(p.x) === xRounded);
                    if (!existingPolygon) {
                        const polygon = new Polygon(p);
                        polygon.x = targetX;
                        polygon.y = yRounded;
                        octGrid.push(polygon);
                    }
                }
            }
        }
        
        return {
            octagonSize: octagonSize,
            maxRows: p.octGridRows,
            layout: 'octagon',
            grid: octGrid
        };
    }
};

export default PolygonsNo1;