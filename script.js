// ======================================================
// NEON DODGE
// ======================================================

// =========================
// ELEMENTS
// =========================

const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const fullscreenBtn =
    document.getElementById("fullscreenBtn");
const scoreDisplay = document.getElementById("score");
const bestDisplay = document.getElementById("best");
const heartsDisplay = document.getElementById("hearts");

const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");

const finalScore = document.getElementById("finalScore");
const heartLost = document.getElementById("heartLost");

const musicBtn = document.getElementById("musicBtn");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

// Hearts-left indicator
const heartsLeftMessage =
    document.getElementById("heartsLeftMessage");

// =========================
// GAME VARIABLES
// =========================

let score = 0;
let hearts = 3;

let gameRunning = false;
let paused = false;

let playerX = 50;

// Fast but controllable
const PLAYER_SPEED = 7;

let obstacles = [];

let particles = [];
let playerParticles = [];

let obstacleTimer = 0;
let lastTime = 0;

let baseSpeed = 230;
let difficulty = 1;

let waveNumber = 0;

let bestScore =
    Number(localStorage.getItem("neonDodgeBest")) || 0;

bestDisplay.textContent = bestScore;

// ======================================================
// AUDIO
// ======================================================

let audioContext = null;
let musicOn = true;
let musicInterval = null;
let musicStep = 0;

function createAudio() {

    if (!audioContext) {

        audioContext = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();
    }

    if (audioContext.state === "suspended") {

        audioContext.resume();
    }
}

function playTone(
    frequency,
    duration,
    type = "sine",
    volume = 0.05
) {

    if (!musicOn) return;

    createAudio();

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type = type;

    oscillator.frequency.value =
        frequency;

    gain.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + duration
    );
}

// ======================================================
// MUSIC
// ======================================================

const melody = [
    261.63,
    329.63,
    392.00,
    329.63,
    293.66,
    349.23,
    440.00,
    349.23
];

function musicTick() {

    if (
        !musicOn ||
        !gameRunning ||
        paused
    ) {
        return;
    }

    playTone(
        melody[musicStep % melody.length],
        0.18,
        "square",
        0.022
    );

    musicStep++;
}

function startMusic() {

    createAudio();

    stopMusic();

    musicInterval =
        setInterval(
            musicTick,
            220
        );
}

function stopMusic() {

    if (musicInterval) {

        clearInterval(
            musicInterval
        );

        musicInterval = null;
    }
}

// ======================================================
// SOUND EFFECTS
// ======================================================

function playHeartLostSound() {

    if (!musicOn) return;

    playTone(
        130,
        0.15,
        "sawtooth",
        0.07
    );

    setTimeout(() => {

        playTone(
            80,
            0.25,
            "sawtooth",
            0.05
        );

    }, 80);
}

function playScoreSound() {

    if (!musicOn) return;

    playTone(
        600,
        0.08,
        "square",
        0.03
    );

    setTimeout(() => {

        playTone(
            800,
            0.08,
            "square",
            0.025
        );

    }, 70);
}

function playGameOverSound() {

    if (!musicOn) return;

    playTone(
        300,
        0.15,
        "sawtooth",
        0.05
    );

    setTimeout(() => {

        playTone(
            180,
            0.2,
            "sawtooth",
            0.04
        );

    }, 150);

    setTimeout(() => {

        playTone(
            100,
            0.35,
            "sawtooth",
            0.03
        );

    }, 300);
}

// ======================================================
// MUSIC BUTTON
// ======================================================

musicBtn.addEventListener(
    "click",
    () => {

        createAudio();

        musicOn = !musicOn;

        if (musicOn) {

            musicBtn.textContent =
                "🔊 MUSIC";

            if (
                gameRunning &&
                !paused
            ) {

                startMusic();
            }

        } else {

            musicBtn.textContent =
                "🔇 MUSIC";

            stopMusic();
        }
    }
);

// ======================================================
// START GAME
// ======================================================

startBtn.addEventListener(
    "click",
    () => {

        createAudio();

        startScreen.classList.add(
            "hidden"
        );

        startGame();
    }
);

restartBtn.addEventListener(
    "click",
    () => {

        createAudio();

        gameOverScreen.classList.add(
            "hidden"
        );

        startGame();
    }
);

function startGame() {

    score = 0;
    hearts = 3;

    difficulty = 1;

    baseSpeed = 230;

    waveNumber = 0;

    playerX = 50;

    obstacleTimer = 0;

    gameRunning = true;
    paused = false;

    lastTime =
        performance.now();

    scoreDisplay.textContent =
        "0";

    updateHearts();

    player.style.left =
        "50%";

    clearObstacles();

    clearParticles();

    // Hide hearts message
    if (heartsLeftMessage) {

        heartsLeftMessage.classList.remove(
            "show"
        );
    }

    pauseBtn.textContent =
        "⏸ PAUSE";

    if (musicOn) {

        startMusic();
    }

    requestAnimationFrame(
        gameLoop
    );
}

// ======================================================
// PAUSE
// ======================================================

pauseBtn.addEventListener(
    "click",
    () => {

        if (!gameRunning)
            return;

        if (!paused) {

            paused = true;

            pauseScreen.classList.remove(
                "hidden"
            );

            pauseBtn.textContent =
                "▶ RESUME";

            stopMusic();

        } else {

            resumeGame();
        }
    }
);

resumeBtn.addEventListener(
    "click",
    () => {

        resumeGame();
    }
);

function resumeGame() {

    if (!gameRunning)
        return;

    paused = false;

    pauseScreen.classList.add(
        "hidden"
    );

    pauseBtn.textContent =
        "⏸ PAUSE";

    lastTime =
        performance.now();

    if (musicOn) {

        startMusic();
    }

    requestAnimationFrame(
        gameLoop
    );
}

// ======================================================
// PLAYER MOVEMENT
// ======================================================

function movePlayer(direction) {

    if (
        !gameRunning ||
        paused
    ) {
        return;
    }

    playerX +=
        direction *
        PLAYER_SPEED;

    playerX =
        Math.max(
            4,
            Math.min(
                96,
                playerX
            )
        );

    player.style.left =
        playerX + "%";
}

// ======================================================
// KEYBOARD CONTROLS
// ======================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
                "ArrowLeft" ||
            event.key.toLowerCase() ===
                "a"
        ) {

            movePlayer(-1);
        }

        if (
            event.key ===
                "ArrowRight" ||
            event.key.toLowerCase() ===
                "d"
        ) {

            movePlayer(1);
        }

        if (
            event.key === " " ||
            event.key.toLowerCase() ===
                "p"
        ) {

            if (gameRunning) {

                pauseBtn.click();
            }
        }
    }
);

// ======================================================
// MOBILE CONTROLS
// ======================================================

leftBtn.addEventListener(
    "touchstart",
    event => {

        event.preventDefault();

        movePlayer(-1);
    }
);

rightBtn.addEventListener(
    "touchstart",
    event => {

        event.preventDefault();

        movePlayer(1);
    }
);

leftBtn.addEventListener(
    "mousedown",
    () => {

        movePlayer(-1);
    }
);

rightBtn.addEventListener(
    "mousedown",
    () => {

        movePlayer(1);
    }
);

// ======================================================
// TOUCH SWIPE
// ======================================================

let touchStartX = 0;

gameArea.addEventListener(
    "touchstart",
    event => {

        touchStartX =
            event.touches[0].clientX;
    }
);

gameArea.addEventListener(
    "touchmove",
    event => {

        if (
            !gameRunning ||
            paused
        ) {
            return;
        }

        const touchX =
            event.touches[0].clientX;

        const difference =
            touchX -
            touchStartX;

        if (
            Math.abs(
                difference
            ) > 8
        ) {

            movePlayer(
                difference > 0
                    ? 1
                    : -1
            );

            touchStartX =
                touchX;
        }
    }
);

// ======================================================
// CREATE RED BLOCK
// ======================================================

function createObstacle(
    xPosition,
    startY = -60
) {

    const obstacle =
        document.createElement(
            "div"
        );

    obstacle.classList.add(
        "obstacle"
    );

    obstacle.style.left =
        xPosition + "%";

    obstacle.style.top =
        startY + "px";

    // Slight random size
    const size =
        32 +
        Math.random() * 12;

    obstacle.style.width =
        size + "px";

    obstacle.style.height =
        size + "px";

    obstacle.style.boxShadow =
        `
        0 0 8px #ff003c,
        0 0 18px #ff003c,
        0 0 30px rgba(255,0,60,.5)
        `;

    gameArea.appendChild(
        obstacle
    );

    obstacles.push({

        element: obstacle,

        x: xPosition,

        y: startY,

        speed:
            baseSpeed +
            Math.random() * 80
    });
}

// ======================================================
// SPAWN WAVE
// ======================================================

function spawnWave() {

    waveNumber++;

    let blockCount;

    // EASY
    if (score < 2000) {

        blockCount = 2;

    }

    // A LITTLE HARDER
    else if (score < 5000) {

        blockCount = 3;

    }

    // MEDIUM
    else if (score < 8000) {

        blockCount = 4;

    }

    // HARDER
    else if (score < 12000) {

        blockCount = 4;

    }

    // VERY LATE GAME
    else {

        blockCount = 5;
    }

    const positions = [];

    for (
        let i = 0;
        i < blockCount;
        i++
    ) {

        let position;
        let attempts = 0;

        do {

            position =
                7 +
                Math.random() * 86;

            attempts++;

        } while (
            positions.some(
                oldPosition =>
                    Math.abs(
                        oldPosition -
                            position
                    ) < 14
            ) &&
            attempts < 30
        );

        positions.push(
            position
        );

        createObstacle(
            position,
            -60 -
                i * 35
        );
    }
}

// ======================================================
// COLLISION
// ======================================================

function checkCollision(
    obstacle
) {

    const playerRect =
        player.getBoundingClientRect();

    const obstacleRect =
        obstacle.element
            .getBoundingClientRect();

    return (

        playerRect.left <
            obstacleRect.right &&

        playerRect.right >
            obstacleRect.left &&

        playerRect.top <
            obstacleRect.bottom &&

        playerRect.bottom >
            obstacleRect.top
    );
}

// ======================================================
// LOSE HEART
// ======================================================

function loseHeart(
    obstacle
) {

    hearts--;

    updateHearts();

    playHeartLostSound();

    // ==========================================
    // HEARTS LEFT MESSAGE
    // ==========================================

    if (heartsLeftMessage) {

        if (hearts > 0) {

            heartsLeftMessage.textContent =
                `❤️ ${hearts} HEART${
                    hearts === 1
                        ? ""
                        : "S"
                } LEFT`;

        } else {

            heartsLeftMessage.textContent =
                "💔 NO HEARTS LEFT";
        }

        heartsLeftMessage.classList.remove(
            "show"
        );

        // Restart animation
        void heartsLeftMessage.offsetWidth;

        heartsLeftMessage.classList.add(
            "show"
        );

        setTimeout(() => {

            heartsLeftMessage.classList.remove(
                "show"
            );

        }, 1000);
    }

    // ==========================================
    // SCREEN SHAKE
    // ==========================================

    gameArea.classList.remove(
        "shake"
    );

    void gameArea.offsetWidth;

    gameArea.classList.add(
        "shake"
    );

    // ==========================================
    // OLD HEART MESSAGE
    // ==========================================

    if (heartLost) {

        heartLost.classList.remove(
            "show"
        );

        void heartLost.offsetWidth;

        heartLost.classList.add(
            "show"
        );
    }

    // ==========================================
    // EXPLOSION
    // ==========================================

    if (obstacle) {

        createExplosion(
            obstacle.x,
            obstacle.y
        );
    }

    // ==========================================
    // GAME OVER
    // ==========================================

    if (hearts <= 0) {

        setTimeout(() => {

            endGame();

        }, 500);
    }
}

// ======================================================
// UPDATE HEARTS
// ======================================================

function updateHearts() {

    let text = "";

    for (
        let i = 0;
        i < hearts;
        i++
    ) {

        text += "❤️";
    }

    for (
        let i = hearts;
        i < 3;
        i++
    ) {

        text += "🖤";
    }

    heartsDisplay.textContent =
        text;
}

// ======================================================
// SCORE + PROGRESSIVE DIFFICULTY
// ======================================================

function increaseScore(
    amount
) {

    score += amount;

    scoreDisplay.textContent =
        Math.floor(score);

    // ==========================================
    // EASY
    // ==========================================

    if (score < 2000) {

        difficulty = 1;

        baseSpeed =
            230 +
            score / 40;
    }

    // ==========================================
    // 2000 - 5000
    // ==========================================

    else if (score < 5000) {

        difficulty =
            1.1 +
            (score - 2000) /
                15000;

        baseSpeed =
            280 +
            (score - 2000) /
                35;
    }

    // ==========================================
    // 5000 - 8000
    // ==========================================

    else if (score < 8000) {

        difficulty =
            1.3 +
            (score - 5000) /
                10000;

        baseSpeed =
            360 +
            (score - 5000) /
                30;
    }

    // ==========================================
    // 8000 - 12000
    // ==========================================

    else if (score < 12000) {

        difficulty =
            1.6 +
            (score - 8000) /
                9000;

        baseSpeed =
            460 +
            (score - 8000) /
                28;
    }

    // ==========================================
    // 12000+
    // ==========================================

    else {

        difficulty =
            2 +
            (score - 12000) /
                10000;

        baseSpeed =
            600 +
            (score - 12000) /
                30;
    }

    // Score milestone
    if (
        Math.floor(score) > 0 &&
        Math.floor(score) %
            1000 === 0
    ) {

        playScoreSound();
    }
}

// ======================================================
// EXPLOSION PARTICLES
// ======================================================

function createExplosion(
    xPercent,
    y
) {

    const rect =
        gameArea.getBoundingClientRect();

    const x =
        (xPercent / 100) *
        rect.width;

    for (
        let i = 0;
        i < 14;
        i++
    ) {

        const particle =
            document.createElement(
                "div"
            );

        particle.style.position =
            "absolute";

        particle.style.width =
            "5px";

        particle.style.height =
            "5px";

        particle.style.borderRadius =
            "50%";

        particle.style.background =
            "#ff003c";

        particle.style.boxShadow =
            "0 0 10px #ff003c";

        particle.style.left =
            x + "px";

        particle.style.top =
            y + "px";

        particle.style.pointerEvents =
            "none";

        particle.style.zIndex =
            "30";

        gameArea.appendChild(
            particle
        );

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            40 +
            Math.random() *
                120;

        particles.push({

            element: particle,

            x: x,

            y: y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life: 0.5
        });
    }
}

// ======================================================
// PLAYER TRAIL
// ======================================================

function createPlayerTrail() {

    if (!gameRunning)
        return;

    const areaRect =
        gameArea.getBoundingClientRect();

    const playerRect =
        player.getBoundingClientRect();

    const x =
        playerRect.left -
        areaRect.left +
        playerRect.width / 2;

    const y =
        playerRect.top -
        areaRect.top +
        playerRect.height / 2;

    const particle =
        document.createElement(
            "div"
        );

    particle.style.position =
        "absolute";

    particle.style.width =
        "6px";

    particle.style.height =
        "6px";

    particle.style.borderRadius =
        "50%";

    particle.style.background =
        "#00ffff";

    particle.style.boxShadow =
        "0 0 10px #00ffff";

    particle.style.left =
        x + "px";

    particle.style.top =
        y + "px";

    particle.style.pointerEvents =
        "none";

    particle.style.zIndex =
        "4";

    gameArea.appendChild(
        particle
    );

    playerParticles.push({

        element: particle,

        life: 0.3,

        x: x,

        y: y
    });
}

// ======================================================
// UPDATE PARTICLES
// ======================================================

function updateParticles(
    deltaTime
) {

    // Explosion particles
    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            particles[i];

        particle.x +=
            particle.vx *
            deltaTime;

        particle.y +=
            particle.vy *
            deltaTime;

        particle.vy +=
            80 *
            deltaTime;

        particle.life -=
            deltaTime;

        particle.element.style.left =
            particle.x + "px";

        particle.element.style.top =
            particle.y + "px";

        particle.element.style.opacity =
            Math.max(
                particle.life / 0.5,
                0
            );

        if (
            particle.life <=
            0
        ) {

            particle.element.remove();

            particles.splice(
                i,
                1
            );
        }
    }

    // Player trail
    for (
        let i =
            playerParticles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            playerParticles[i];

        particle.life -=
            deltaTime;

        particle.y +=
            20 *
            deltaTime;

        particle.element.style.top =
            particle.y + "px";

        particle.element.style.opacity =
            Math.max(
                particle.life / 0.3,
                0
            );

        if (
            particle.life <=
            0
        ) {

            particle.element.remove();

            playerParticles.splice(
                i,
                1
            );
        }
    }
}

// ======================================================
// GAME LOOP
// ======================================================

function gameLoop(
    timestamp
) {

    if (
        !gameRunning ||
        paused
    ) {
        return;
    }

    const deltaTime =
        Math.min(
            (
                timestamp -
                lastTime
            ) / 1000,
            0.05
        );

    lastTime =
        timestamp;

    // Score
    increaseScore(
        deltaTime * 25
    );

    // Player trail
    createPlayerTrail();

    // Particles
    updateParticles(
        deltaTime
    );

    // ==========================================
    // SPAWN RATE
    // ==========================================

    obstacleTimer -=
        deltaTime;

    const spawnRate =
        Math.max(
            0.65,
            1.15 -
                score /
                    18000
        );

    if (
        obstacleTimer <=
        0
    ) {

        spawnWave();

        obstacleTimer =
            spawnRate;
    }

    // ==========================================
    // MOVE BLOCKS
    // ==========================================

    for (
        let i =
            obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obstacle =
            obstacles[i];

        obstacle.y +=
            obstacle.speed *
            difficulty *
            deltaTime;

        obstacle.element.style.top =
            obstacle.y + "px";

        // Collision
        if (
            checkCollision(
                obstacle
            )
        ) {

            obstacle.element.remove();

            obstacles.splice(
                i,
                1
            );

            loseHeart(
                obstacle
            );

            continue;
        }

        // Remove off screen
        if (
            obstacle.y >
            gameArea.clientHeight +
                100
        ) {

            obstacle.element.remove();

            obstacles.splice(
                i,
                1
            );
        }
    }

    requestAnimationFrame(
        gameLoop
    );
}

// ======================================================
// GAME OVER
// ======================================================

function endGame() {

    gameRunning = false;

    paused = false;

    stopMusic();

    playGameOverSound();

    finalScore.textContent =
        Math.floor(score);

    if (
        score >
        bestScore
    ) {

        bestScore =
            Math.floor(score);

        localStorage.setItem(
            "neonDodgeBest",
            bestScore
        );

        bestDisplay.textContent =
            bestScore;
    }

    gameOverScreen.classList.remove(
        "hidden"
    );

    pauseScreen.classList.add(
        "hidden"
    );
}

// ======================================================
// CLEAR OBSTACLES
// ======================================================

function clearObstacles() {

    obstacles.forEach(
        obstacle => {

            obstacle.element.remove();
        }
    );

    obstacles = [];
}

// ======================================================
// CLEAR PARTICLES
// ======================================================

function clearParticles() {

    particles.forEach(
        particle => {

            particle.element.remove();
        }
    );

    playerParticles.forEach(
        particle => {

            particle.element.remove();
        }
    );

    particles = [];

    playerParticles = [];
}

// ======================================================
// PREVENT RIGHT CLICK
// ======================================================

gameArea.addEventListener(
    "contextmenu",
    event => {

        event.preventDefault();
    }
);
// ==========================================
// FULLSCREEN
// ==========================================

fullscreenBtn.addEventListener(
    "click",
    () => {

        if (!document.fullscreenElement) {

            // Enter fullscreen
            document.documentElement
                .requestFullscreen()
                .catch(error => {

                    console.log(
                        "Fullscreen error:",
                        error
                    );

                });

        } else {

            // Exit fullscreen
            document.exitFullscreen();
        }
    }
);

// ==========================================
// UPDATE BUTTON TEXT
// ==========================================

document.addEventListener(
    "fullscreenchange",
    () => {

        if (document.fullscreenElement) {

            fullscreenBtn.textContent =
                "✕ EXIT FULLSCREEN";

        } else {

            fullscreenBtn.textContent =
                "⛶ FULLSCREEN";
        }
    }
);