let angle = 0;
let rotationSpeed = 0.01;
let cameraRadius = 300;
let towers = [];
let colorPalettes = {};
let currentPalette = 0;
let noiseTexture;
let floorBlocks = [];

// Shape probability constants
const SHAPE_PROBABILITIES = {
    box: 0.85,    
    sphere: 0.10,
    cone: 0.05 
};

let loading = false;

let model3D;

// Helper function to select shape type based on probabilities
function selectShapeType() {
    const rand = random();
    let cumulative = 0;

    for (const [shapeType, probability] of Object.entries(SHAPE_PROBABILITIES)) {
        cumulative += probability;
        if (rand <= cumulative) {
            return shapeType;
        }
    }

    // Fallback to box if something goes wrong
    return 'box';
}

function preload() {
    // model3D = loadModel('assets/Elf-Ghost-P.stl', true);
}

function setup() {
    let canvas = createCanvas(1200, 600, WEBGL);
    canvas.parent('canvas-container');
    // Create a p5.Camera object.
    cam = createCamera();
    loadTextures();
    camera(0, -80, 400);

    // Load color palettes from COLOURlovers API
    // loadColorPalettes();
    regenScene();
}

function loadTextures() {
    // Create noise texture
    noiseTexture = createGraphics(256, 256);
    noiseTexture.loadPixels();
    for (let x = 0; x < 256; x++) {
        for (let y = 0; y < 256; y++) {
            let index = (x + y * 256) * 4;
            let noiseVal = noise(x * 0.02, y * 0.02) * 255;
            noiseTexture.pixels[index] = noiseVal;
            noiseTexture.pixels[index + 1] = noiseVal * 0.8;
            noiseTexture.pixels[index + 2] = noiseVal * 0.6;
            noiseTexture.pixels[index + 3] = 255;
        }
    }
    noiseTexture.updatePixels();
}

async function regenScene() {
    this.loading = true;
    await loadColorPalettes();

    await generateTowers();
    await generateFloor();
    this.loading = false;
}

async function loadColorPalettes() {
    try {
        // Use CORS proxy to avoid CORS issues
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = `https://www.colourlovers.com/api/palettes/random?format=json&numResults=5`;
        const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
        const palettes = await response.json();

        // Convert hex colors to RGB arrays
        colorPalettes = palettes.map(palette =>
            palette.colors.map(hex => {
                // Convert hex to RGB
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return [r, g, b];
            })
        );

        console.log('colorPalettes', colorPalettes);
    } catch (error) {
        console.log('Failed to load palettes, using fallback colors:', error);
        // Fallback to default colors
        colorPalettes = [[[255, 255, 255], [255, 0, 0], [0, 255, 0], [0, 0, 255]]];
    }
}

async function generateFloor() {
    const numberOfBlocks = 500;
    for (let i = 0; i < numberOfBlocks; i++) {
        floorBlocks.push({
            x: random(-400, 400),
            height: random(1, 50),
            width: random(1, 100),
            depth: random(1, 100),
            z: random(-400, 400)
        });
    }
}

async function generateTowers() {

    const tallRatio = 0.1;

    towers = [];
    if (!colorPalettes) {
        return;
    }
    const numberOfTowers = 10;// random(15, 20);
    for (let i = 0; i < numberOfTowers; i++) {
        let shapes = [];
        let numberOfShapes = random(5, 10);
        if (random(0, 1) < tallRatio) {
            numberOfShapes = random(20, 25);
        }

        for (let j = 0; j < numberOfShapes; j++) {

            const randomColors = colorPalettes?.[floor(random(colorPalettes.length))];

            shapes.push({
                x: random(-5, 5),
                y: random(-20, -160),
                z: random(-5, 5),
                size: random(20, 80),
                color: randomColors[i],
                type: selectShapeType(),
                hasTexture: random() < 0.5,
                rotationX: random(0, PI/8),
                rotationY: random(0, TWO_PI),
                rotationZ: random(0, PI/8)
            });
        }
        towers.push({
            shapes: shapes, x: random(-200, 200),
            y: random(0, -10),
            z: random(-200, 200)
        })

        console.log(towers);
    }
}

function draw() {
    if (this.loading) {
        background(0, 0, 255);
        return;
    }
    background(128, 128, 128);

    // Add more ambient lighting to prevent hollow appearance
    ambientLight(120, 120, 120);

    // Add directional lighting
    directionalLight(255, 255, 255, -1, 0.5, -1);

    // Add point light for better illumination
    pointLight(255, 255, 255, 0, -100, 200);

    orbitControl()

    // angle += rotationSpeed;
    // rotateY(angle);

    // Floor + Ground
    push();
    translate(0, 0, 0);

    noStroke();

    box(600, 1, 600);
    pop();

    buildPilars();
    buildFloor();

    // Draw all shapes
    for (let tower of towers) {
        for (let shape of tower.shapes) {
            push();
            translate(shape.x + tower.x, shape.y + tower.y, shape.z + tower.z);
            
            // Apply rotation to the shape
            rotateX(shape.rotationX);
            rotateY(shape.rotationY);
            rotateZ(shape.rotationZ);

            if (shape.color) {
                fill(shape.color[0], shape.color[1], shape.color[2]);
            } else {
                fill(113, 112, 112);
            }
            noStroke();
            // Use ambient material for solid appearance
            if (shape.color) {
                ambientMaterial(shape.color[0], shape.color[1], shape.color[2]);
            } else {
                ambientMaterial(113, 112, 112);
            }

            if (shape.hasTexture && noiseTexture) {
                // If the shape is marked to have a texture, apply the noise texture for varied appearance
                // texture(noiseTexture);
            }

            if (shape.type === 'box') {
                box(shape.size, shape.size * 1.5, shape.size);
            } else if (shape.type === 'sphere') {
                ellipsoid(shape.size, shape.size * 1.5, shape.size * 1.5);
            } else if (shape.type === 'cone') {
                cone(shape.size, shape.size);
            }
            pop();
        }
    }
}

function buildFloor() {
    for (let block of floorBlocks) {
        push();
        translate(block.x, 0, block.z);
        fill(113, 112, 112);
        noStroke();
        ambientMaterial(13, 12, 12);
        box(block.width, block.height, block.depth);
        pop();
    }
}

function buildPilars() {
    push();
    translate(50, 0, 50);
    fill(13, 12, 12);
    noStroke();
    ambientMaterial(13, 12, 12);
    box(10, 100, 10);
    pop();

    push();
    translate(-50, 0, 50);
    fill(13, 12, 12);
    noStroke();
    ambientMaterial(13, 12, 12);
    box(10, 100, 10);
    pop();

    push();
    translate(-50, 0, -50);
    fill(13, 12, 12);
    noStroke();
    ambientMaterial(13, 12, 12);
    box(10, 100, 10);
    pop();

    push();
    translate(50, 0, -50);
    fill(13, 12, 12);
    noStroke();
    ambientMaterial(13, 12, 12);
    box(10, 100, 10);
    pop();
}

function mouseMoved() {
    // Interactive rotation based on mouse position
    const centerline = width / 2;
    const distanceFromCenterline = mouseX - centerline;
    //if create deadzone for rotation speed
    if (distanceFromCenterline > 25 || distanceFromCenterline < -25) {
        const exponentialSpeedCoeff = distanceFromCenterline ^ 2;
        rotationSpeed = -0.0001 * exponentialSpeedCoeff;
    } else {
        rotationSpeed = 0;
    }
}

async function keyPressed() {
    if (key === ' ') {
        await regenScene();
    }
}

async function regenerateShapes() {
    shapes = [];
    await generateShapes();
}
