let angle = 0;
let rotationSpeed = 0.01;
let cameraRadius = 300;

let shapes = [];
let colorPalettes = {};
let currentPalette = 0;
let noiseTexture;

let loading = false;

let model3D;

function preload() {
  model3D = loadModel('assets/Elf-Ghost-P.stl', true);
}

function setup() {
    let canvas = createCanvas(1200, 600, WEBGL);
    canvas.parent('canvas-container');

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

    // Load color palettes from COLOURlovers API
    loadColorPalettes();
}

async function regenScene() {
    this.loading = true;
    await loadColorPalettes();
    await generateShapes();
    this.loading = false;
}

async function loadColorPalettes() {
    try {
        // Use CORS proxy to avoid CORS issues
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = `https://www.colourlovers.com/api/palettes/random?format=json&numResults=5&timestamp=${Date.now()}`;
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

        // Generate shapes with the loaded palettes
        generateShapes();
    } catch (error) {
        console.log('Failed to load palettes, using fallback colors:', error);
        // Fallback to default colors
        colorPalettes = [[[255, 255, 255], [255, 0, 0], [0, 255, 0], [0, 0, 255]]];
        generateShapes();
    }
}

async function generateShapes() {
    shapes = [];
    if (!colorPalettes) {
        return;
    }
    const numberOfShapes = random(10, 20);
    for (let i = 0; i < numberOfShapes; i++) {

        const randomColors = colorPalettes?.[floor(random(colorPalettes.length))];

        shapes.push({
            x: random(-200, 200),
            y: random(-200, 200),
            z: random(-200, 200),
            size: random(20, 80),
            color: randomColors[floor(random(randomColors.length))],
            type: random(['box', 'sphere', 'cone']),
            hasTexture: random() < 0.5
        });
    }
}

function draw() {
    if (this.loading){
        background(0, 0, 255);
        return;
    }
    background(128, 128, 128);

    // Add some ambient lighting
    ambientLight(60, 60, 60);

    // Add directional lighting
    directionalLight(255, 255, 255, -1, 0.5, -1);

    // Rotate the camera around the Z-axis
    angle += rotationSpeed;

    // Calculate camera position orbiting around the center
    let cameraX = cos(angle) * cameraRadius;
    let cameraY = sin(angle) * cameraRadius;
    let cameraZ = 200; // Height of the camera

    // Set camera position and look at the center
    camera(cameraX, cameraY, cameraZ, 0, 0, 0, 0, 0, 1);

    // Draw all shapes
    for (let shape of shapes) {
        push();
        translate(shape.x, shape.y, shape.z);

        // if (shape.hasTexture) {
        //   texture(noiseTexture);
        //   noStroke();
        // } else {
        fill(shape.color[0], shape.color[1], shape.color[2]);
        noStroke();
        // }

        if (shape.type === 'box') {
            box(shape.size, shape.size, shape.size);
        } else if (shape.type === 'sphere') {
            sphere(shape.size);
        } else if (shape.type === 'cone') {
            cone(shape.size, shape.size * 1.5);
        }
        pop();
    }

    myMesh = new p5.Geometry(20, 20, p5.Geometry.TORUS, 100, 40);
    model(myMesh);
}

function mouseMoved() {
    // Interactive rotation based on mouse position
    const centerline = width / 2;
    const distanceFromCenterline = mouseX - centerline;
    //if create deadzone for rotation speed
    if (distanceFromCenterline > 25 || distanceFromCenterline < -25) {
        rotationSpeed = -0.00001 * distanceFromCenterline;
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
