// --- SENSOR SETUP ---
// Brightness sensors for black line tracking
addLineSensor(20, -8, 1, 1, 1); // Sensor 0: left
addLineSensor(20, 8, 1, 1, 1); // Sensor 1: right

// Stop sensor: red vs green+blue
addLineSensor(25, 0, 1, 0, 0); // Sensor 2: red only
addLineSensor(25, 0, 0, 1, 1); // Sensor 3: green+blue

// White detection sensor (center)
addLineSensor(20, 0, 1, 1, 1); // Sensor 4: center white sensor

// --- FUNCTIONS ---
function isBlack(sensorIndex) {
  return readSensor(sensorIndex) < 0.4; // black is dark
}

function isStop() {
  let red = readSensor(2);
  let nonRed = readSensor(3);
  return red > 0.5 && nonRed < 0.4; // pure red detection
}

function isPureWhiteCenter() {
  return readSensor(4) > 0.9; // strong white reading
}

// --- MAIN LOOP ---
let pureWhiteCounter = 0;
const maxWhiteSteps = 50;

while (true) {
  if (isStop()) {
    console.log("🟥 Red block reached. Stopping.");
    break;
  }

  let leftOnBlack = isBlack(0);
  let rightOnBlack = isBlack(1);

  if (isPureWhiteCenter()) {
    pureWhiteCounter++;
  } else {
    pureWhiteCounter = 0;
  }

  if (pureWhiteCounter > maxWhiteSteps) {
    right(180);
    forward(25);
    left(90);
    pureWhiteCount = 0;
  }

  if (leftOnBlack && rightOnBlack) {
    forward(2);
  } else if (leftOnBlack) {
    left(5);
    forward(1);
  } else if (rightOnBlack) {
    right(5);
    forward(1);
  } else {
    forward(1); // try to re-acquire
  }
}
