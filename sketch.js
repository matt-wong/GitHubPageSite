let angle = 0;
let rotationSpeed = 0.01;
let cameraRadius = 300;

let shapes = [];
let colorPalettes = [];
let currentPalette = 0;
let noiseTexture;

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

async function loadColorPalettes() {
  try {
    // Get random palettes from COLOURlovers API
    const response = await fetch('https://www.colourlovers.com/api/palettes/random?format=json&numResults=5');
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
    
    // Generate shapes with the loaded palettes
    generateShapes();
  } catch (error) {
    console.log('Failed to load palettes, using fallback colors:', error);
    // Fallback to default colors
    colorPalettes = [
      [[255, 255, 255], [255, 0, 0], [0, 255, 0], [0, 0, 255]],
      [[255, 192, 203], [255, 165, 0], [255, 255, 0], [0, 255, 255]],
      [[128, 0, 128], [255, 20, 147], [0, 255, 127], [255, 69, 0]]
    ];
    generateShapes();
  }
}

function generateShapes() {
  const numberOfShapes = random(10, 20);
  for (let i = 0; i < numberOfShapes; i++) {
    const palette = colorPalettes[currentPalette % colorPalettes.length];
    shapes.push({
      x: random(-200, 200),
      y: random(-200, 200),
      z: random(-200, 200),
      size: random(20, 80),
      color: palette[floor(random(palette.length))],
      type: random(['box', 'sphere', 'cone']),
      hasTexture: random() < 0.5
    });
  }
}

function draw() {
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
}

function mouseMoved() {
  // Interactive rotation based on mouse position
  const centerline = width / 2;
  const distanceFromCenterline = mouseX - centerline;
  //if create deadzone for rotation speed
  if (distanceFromCenterline > 25 || distanceFromCenterline < -25) {
    rotationSpeed = -0.0001 * distanceFromCenterline;
  } else {
    rotationSpeed = 0;
  }
}

function keyPressed() {
  if (key === ' ') {
    // Spacebar to cycle through palettes
    currentPalette = (currentPalette + 1) % colorPalettes.length;
    regenerateShapes();
  } else if (key === 'r' || key === 'R') {
    // R to reload palettes from API
    shapes = [];
    loadColorPalettes();
  }
}

function regenerateShapes() {
  shapes = [];
  generateShapes();
}
