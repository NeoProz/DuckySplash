let tick = 0;
let score = 0;
let waterScroll = 1.5;
let fishSpeed = 1.5;
let lost = false;
let started = false;
let duckFrames;
let forwardFish;
let backwardFish;
let quackSound;
let backgroundMusic;
let duckPos;
let duckState = {energy: 1, diving: false, frame: 0, comingUp: false, diveStart: null};
let fishStates = [];
let highscore = 0;
const duckResistance = 0.3;
const pixelSize = 3; // for old pixelated setting (unused now)
let cloudposx = [];
let cloudposy = [];

function preload() {
  duckFrames = [loadImage('static/assets/duck-animation/duck0.png'), loadImage('static/assets/duck-animation/duck1.png'), loadImage('static/assets/duck-animation/duck2.png'), loadImage('static/assets/duck-animation/duck3.png')];
  forwardFish = loadImage('static/assets/forward-fish.png');
  backwardFish = loadImage('static/assets/backward-fish.png');
  quackSound = loadSound('static/assets/quack.mp3');
  backgroundMusic = loadSound('static/assets/background-music.mp3');
}

function setup() {
  const canvas = createCanvas(innerWidth*3/4, innerHeight*3/4);
  canvas.parent('game');

  duckFrames.forEach((frame) => {
    frame.resize(120, 120);
  });
  forwardFish.resize(60, 60);
  backwardFish.resize(60, 60);

  reset();
}

function reset() {
  tick = 0;
  score = 0;
  waterScroll = 1.5;
  fishSpeed = 1.5;
  lost = false;
  duckPos;
  duckState = {energy: 1, diving: false, frame: 0, comingUp: false, diveStart: null};
  fishStates = [];
  cloudposx = [];
  cloudposy = [];

  getHighscore();
  
  duckPos = [width/2, height/2];
  for (var i = 0; i < 75; i++) {
    cloudposx.push(random(0, width));
    cloudposy.push(random(0, 20));
  }

  for (var i = 0; i < 3; i++) {
    fishStates.push(newFish());
  }
}

function draw() {
  if (lost || !started) {
    background(50, 50, 50, 230);
    textAlign(CENTER, CENTER);
    fill(255);
    var newText;
    if (!started) {
      newText = 'Tap to start.'
    }
    if (lost) {
      newText = 'You were swept downstream. Tap to play again.'
    }
    textSize(40);
    text(newText, width/2, height/2)
    noLoop();
    return;
  }
  
  background(140, 227, 230);

  noStroke();
  
  drawWater();
  drawClouds()
  moveDuck();
  moveFish();
  drawFish();
  drawDuck();
  drawEnergy();
  drawScore();
  drawHighscore();

  if (!backgroundMusic.isPlaying() && !lost) {
    backgroundMusic.play();
  }

  if (tick%100 === 0) {
    getHighscore();
  }

  waterScroll += 0.002;
  fishSpeed += 0.005;
  tick++;
  score = floor(tick / 10);
}

function mousePressed() {
  if (!started) {
    started = true;
    reset();
    loop();
  }
  if (lost) {
    lost = false;
    reset();
    loop();
  }
}

function newFish() {
  return {x: random(20, width - 20), y: height/2 + random(60, 70), vel: random(-4, 4)};
}

function nearestPixel(x, y) {
  return [round(x/pixelSize)*pixelSize, round(y/pixelSize)*pixelSize];
}

function drawWater() {
  fill(11, 96, 181);
  beginShape();
  vertex(width, height/2);
  vertex(width, height);
  vertex(0, height);
  vertex(0, height/2);
  for (var i = 0; i < width/pixelSize; i++) {
    /*var newPixel = nearestPixel(i*pixelSize, height/2 + sin(i*pixelSize/16 + tick*waterScroll/16)*5.5);
    vertex(newPixel[0], newPixel[1]);
    vertex(newPixel[0] + pixelSize, newPixel[1]);*/
    vertex(i*pixelSize, height/2 + sin(i*pixelSize/16 + tick*waterScroll/16)*5.5);
  }
  endShape();
}

function keyPressed() {
  if (keyCode === DOWN_ARROW) {
    if (!duckState.diving) {
      duckState.diving = true;
      duckState.frame = 1;
      duckState.comingUp = false;
      duckState.diveStart = tick;
    }
  }
	if (keyCode === KeyS) {
    if (!duckState.diving) {
      duckState.diving = true;
      duckState.frame = 1;
      duckState.comingUp = false;
      duckState.diveStart = tick;
    }
  }
}

function drainEnergy() {
  duckState.energy = max(0, duckState.energy - 0.002);
}

function handleFishCatch() {
  var newFishStates = [];
  fishStates.forEach((fish) => {
    if (abs(duckPos[0] + 30 - fish.x) < 40) {
      newFishStates.push(newFish());
      duckState.energy = min(duckState.energy + 0.15, 1);
      quackSound.play();
      return;
    }
    
    newFishStates.push(fish);
  });

  fishStates = newFishStates;
}

function moveDuck() {
  duckPos[0] -= waterScroll*(1 - duckResistance);

  if (keyIsDown(RIGHT_ARROW)) {
    duckPos[0] += fishSpeed*duckState.energy;
    drainEnergy();
  }
  if (keyIsDown(LEFT_ARROW)) {
    duckPos[0] -= fishSpeed*duckState.energy;
    drainEnergy();
  }

  if (duckState.diving && (tick - duckState.diveStart)%5 === 0) {
    if (!duckState.comingUp) {
      duckState.frame += 1;
      
      if (duckState.frame === duckFrames.length - 1) {
        handleFishCatch();
        duckState.comingUp = true;
      }
    } else {
      duckState.frame -= 1;
      
      if (duckState.frame === 0) {
        duckState.diving = false;
        duckState.comingUp = false;
      }
    }
  }

  if (duckPos[0] < 0) {
    lost = true;
    backgroundMusic.stop();
    setHighscore();
  }
}

function moveFish() {
  fishStates.forEach((fish) => {
    fish.x += fish.vel;
    if (fish.x < 40) {
      fish.vel *= -1;
      fish.x = 40;
    }
    if (fish.x > width - 70) {
      fish.vel *= -1;
      fish.x = width - 70;
    }
  });
}

function drawDuck() {
  image(duckFrames[duckState.frame], duckPos[0] - 30, duckPos[1] - 65 + duckState.frame*15);
}

function drawFish() {
  fishStates.forEach((fish) => {
    if (fish.vel < 0) {
      imageToDraw = forwardFish;
    } else {
      imageToDraw = backwardFish;
    }
    image(imageToDraw, fish.x, fish.y + sin(tick/5)*10);
  });
}

function drawEnergy() {
  fill(0);
  rect(10, 10, width/2, 50, 10);
  fill(0, 255, 0);
  rect(15, 15, (width/2 - 10)*duckState.energy, 40, 5);
}

function drawScore() {
  fill(0);
  textSize(40);
  textAlign(LEFT, CENTER);
  text(`Score: ${score}`, width/2 + 30, 35);
}

function drawClouds() {
  noStroke();
  fill(255, 255, 255, 100);
  for (var i = 0; i < cloudposx.length; i++) {
    circle(cloudposx[i],cloudposy[i],50);
  }
}

function drawHighscore() {
  fill(0);
  textSize(40);
  textAlign(LEFT, CENTER);
  text(`World best: ${highscore}`, 10, 90);
}

function getHighscore() {
  fetch('/highscore')
    .then(response => response.json())
    .then(data => {
      highscore = data.score;
    });
}

function setHighscore() {
  fetch(`/highscore/set?score=${score}`, {method: 'POST'});
}