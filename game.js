// Flappy Bird — versão corrigida e funcional
// Coloque este arquivo após o <canvas id="gameCanvas"></canvas> no HTML

let board;
const boardWidth = 360;
const boardHeight = 640;
let context;

let gameStarted = false;
let gameOver = false;

// IMAGENS
let gameOverImg;
let onloadImg;

const birdWidth = 34;
const birdHeight = 24;
const birdStartX = 50;
const birdStartY = boardHeight / 2 - birdHeight / 2;

let birdUpImg;
let birdDownImg;
let birdMidImg;

let bird = {
  x: birdStartX,
  y: birdStartY,
  width: birdWidth,
  height: birdHeight,
};

// CANOS
let pipeArray = [];
const pipeWidth = 64;
const pipeHeight = 532; // altura real do sprite
const pipeGap = 120; // espaço entre os canos

let topPipeImg;
let bottomPipeImg;

// FÍSICA
const velocityX = -2; // velocidade dos canos para a esquerda
let velocityY = 0; // velocidade vertical do pássaro
const gravity = 0.4; // gravidade POSITIVA p/ puxar pra baixo
const jumpStrength = -6; // pulo

// PLACAR
let score = 0;
const scoreImage = [];
for (let i = 0; i < 10; i++) {
  const img = new Image();
  img.src = `./assets/${i}.png`;
  scoreImage.push(img);
}

// SONS
let hitSound;
let wingSound;
let pointSound;

window.onload = function () {
  board = document.getElementById("gameCanvas");
  board.width = boardWidth;
  board.height = boardHeight;
  context = board.getContext("2d");

  // Carregar imagens
  onloadImg = new Image();
  onloadImg.src = "./assets/message.png";
  onloadImg.onload = drawStartMessage;

  birdUpImg = new Image();
  birdUpImg.src = "./assets/redbird-upflap.png";

  birdMidImg = new Image();
  birdMidImg.src = "./assets/redbird-midflap.png";

  birdDownImg = new Image();
  birdDownImg.src = "./assets/redbird-downflap.png";

  topPipeImg = new Image();
  topPipeImg.src = "./assets/toppipe.png"; // confira o nome do arquivo

  bottomPipeImg = new Image();
  bottomPipeImg.src = "./assets/bottompipe.png"; // confira o nome do arquivo

  gameOverImg = new Image();
  gameOverImg.src = "./assets/gameover.png";

  // Sons
  hitSound = new Audio("./assets/audios/hit.wav");
  wingSound = new Audio("./assets/audios/wing.wav");
  pointSound = new Audio("./assets/audios/point.wav");

  // Controles
  window.addEventListener("keydown", handleInput);
  board.addEventListener("mousedown", handleInput);
  board.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      handleInput();
    },
    { passive: false }
  );
};

function handleInput(e) {
  if (!gameStarted) startGame();
  if (gameOver) return;
  // pulo
  velocityY = jumpStrength;
  try {
    wingSound.currentTime = 0;
    wingSound.play();
  } catch {}
}

function startGame() {
  gameStarted = true;
  gameOver = false;
  score = 0;
  pipeArray = [];
  bird.x = birdStartX;
  bird.y = birdStartY;
  velocityY = 0;
  lastSpawn = 0;
  requestAnimationFrame(update);
}

// controle de spawn
let frame = 0;
let lastSpawn = 0;
const SPAWN_INTERVAL = 90; // ~1.5s a 60fps

function update() {
  context.clearRect(0, 0, boardWidth, boardHeight);

  // desenhar fundo simples (opcional)
  // context.fillStyle = "#70c5ce"; // azul céu
  // context.fillRect(0, 0, boardWidth, boardHeight);

  // ----- BIRD -----
  velocityY += gravity;
  bird.y += velocityY;

  // escolhe sprite pela velocidade
  let sprite = birdMidImg;
  if (velocityY < -1) sprite = birdUpImg;
  else if (velocityY > 1) sprite = birdDownImg;
  context.drawImage(sprite, bird.x, bird.y, bird.width, bird.height);

  // colisão com teto/chão
  if (bird.y + bird.height >= boardHeight || bird.y <= 0) {
    return endGame();
  }

  // ----- PIPES -----
  frame++;
  if (frame - lastSpawn >= SPAWN_INTERVAL) {
    placePipes();
    lastSpawn = frame;
  }

  for (let i = pipeArray.length - 1; i >= 0; i--) {
    const p = pipeArray[i];
    p.x += velocityX; // move para a esquerda
    context.drawImage(p.img, p.x, p.y, pipeWidth, pipeHeight);

    // pontuação: quando o pássaro passa o cano de cima
    if (p.isTop && !p.passed && p.x + pipeWidth < bird.x) {
      p.passed = true;
      score++;
      try {
        pointSound.currentTime = 0;
        pointSound.play();
      } catch {}
    }

    if (detectCollision(bird, p)) {
      return endGame();
    }

    // remover canos fora da tela
    if (p.x + pipeWidth < 0) {
      pipeArray.splice(i, 1);
    }
  }

  drawScore();

  if (!gameOver) requestAnimationFrame(update);
}

function placePipes() {
  // y negativo p/ empurrar o cano de cima pra cima
  const randomY = -Math.floor(Math.random() * 250) - 100; // entre -100 e -350 aprox

  const topPipe = {
    img: topPipeImg,
    x: boardWidth,
    y: randomY,
    passed: false,
    isTop: true,
  };

  const bottomPipe = {
    img: bottomPipeImg,
    x: boardWidth,
    y: randomY + pipeHeight + pipeGap,
    passed: false,
    isTop: false,
  };

  pipeArray.push(topPipe, bottomPipe);
}

function detectCollision(a, b) {
  // AABB
  return (
    a.x < b.x + pipeWidth &&
    a.x + a.width > b.x &&
    a.y < b.y + pipeHeight &&
    a.y + a.height > b.y
  );
}

function drawScore() {
  // desenhar dígitos centralizados usando as imagens 0-9
  const s = String(score);
  const digitW = 24; // ajuste conforme a arte
  const digitH = 36;
  let x = (boardWidth - s.length * digitW) / 2;
  for (const ch of s) {
    const img = scoreImage[parseInt(ch, 10)];
    if (img && img.complete) {
      context.drawImage(img, x, 20, digitW, digitH);
    } else {
      // fallback com texto
      context.fillStyle = "#fff";
      context.font = "28px Arial";
      context.fillText(ch, x + 4, 48);
    }
    x += digitW;
  }
}

function drawStartMessage() {
  // centraliza a imagem "message.png"
  if (!onloadImg || !onloadImg.complete) return;
  const dx = (boardWidth - onloadImg.width) / 2;
  const dy = (boardHeight - onloadImg.height) / 2;
  context.clearRect(0, 0, boardWidth, boardHeight);
  context.drawImage(onloadImg, dx, dy);
}

function endGame() {
  gameOver = true;
  try {
    hitSound.currentTime = 0;
    hitSound.play();
  } catch {}
  drawGameOver();
}

function drawGameOver() {
  if (!gameOverImg) return;
  const draw = () => {
    const dx = (boardWidth - gameOverImg.width) / 2;
    const dy = (boardHeight - gameOverImg.height) / 2 - 60;
    context.drawImage(gameOverImg, dx, dy);

    // instrução de reinício
    context.fillStyle = "#333";
    context.font = "16px Arial";
    context.textAlign = "center";
    context.fillText("Pressione qualquer tecla para reiniciar", boardWidth / 2, dy + gameOverImg.height + 28);

    // permitir reiniciar
    const restart = () => {
      window.removeEventListener("keydown", restart);
      board.removeEventListener("mousedown", restart);
      board.removeEventListener("touchstart", restart);
      startGame();
    };
    window.addEventListener("keydown", restart, { once: true });
    board.addEventListener("mousedown", restart, { once: true });
    board.addEventListener("touchstart", restart, { once: true });
  };

  if (gameOverImg.complete) draw();
  else gameOverImg.onload = draw;
}
