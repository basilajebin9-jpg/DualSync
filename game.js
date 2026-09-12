const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 500;

// =====================================================
// IMAGES
// =====================================================

const maveliImage = new Image();
maveliImage.src = "maveli.png";

const kidImage = new Image();
kidImage.src = "vamana.png";

const villainImage = new Image();
villainImage.src = "villain.png";

const bananaImage = new Image();
bananaImage.src = "banana.png";

// =====================================================
// GAME VARIABLES
// =====================================================

let gameRunning = false;
let gameEnding = false;

let score = 0;
let speed = 5;
let gravity = 0.7;

let gravityFlipped = false;
let gravityFlipping = false;

let animationId;

let obstacleTimer = 0;
let sceneryTimer = 0;
let runTime = 0;
let worldX = 0;

let obstacles = [];
let scenery = [];

const groundY = 420;
const ceilingY = 65;

// =====================================================
// GRAVITY FLIP
// =====================================================

let flipProgress = 0;
let flipStartY = 0;
let flipTargetY = 0;

let flipStartScale = 1;
let flipEndScale = 1;
let flipScale = 1;

// =====================================================
// ENDING VARIABLES
// =====================================================

let endingState = "none";
let endingTimer = 0;

let villainScale = 1.25;
let villainX = 500;

let villainKick = 0;

let maveliKnockback = 0;
let maveliFade = 1;

let undergroundProgress = 0;

let screenShake = 0;
let impactFlash = 0;

let impactDone = false;

let dustParticles = [];

// =====================================================
// MAVELI
// =====================================================

const maveli = {
    x: 170,
    y: groundY - 100,

    width: 95,
    height: 100,

    velocityY: 0,

    jumping: false,
    ducking: false,

    falling: false,

    fallVelocity: 0,

    rotation: 0
};

// =====================================================
// VAMANA / KID
// =====================================================

const vamana = {
    x: 55,
    y: groundY - 65,

    width: 45,
    height: 65,

    giant: false
};

// =====================================================
// KEYBOARD
// =====================================================

document.addEventListener("keydown", function (event) {

    if (event.code === "ArrowUp" || event.code === "KeyW") {

        event.preventDefault();

        if (!gameRunning || gameEnding) return;
        if (maveli.falling) return;
        if (gravityFlipping) return;

        jump();
    }

    if (event.code === "ArrowDown" || event.code === "KeyS") {

        event.preventDefault();

        if (!gameRunning || gameEnding) return;
        if (maveli.falling) return;
        if (gravityFlipping) return;

        maveli.ducking = true;
    }

    if (
        event.code === "Space" &&
        !event.repeat
    ) {

        event.preventDefault();

        flipGravity();
    }
});

document.addEventListener("keyup", function (event) {

    if (event.code === "ArrowDown" || event.code === "KeyS") {
        maveli.ducking = false;
    }
});

// =====================================================
// R = RETRY AFTER GAME OVER
// =====================================================

document.addEventListener("keydown", function (event) {

    if (event.code === "KeyR") {

        const gameOver =
            document.getElementById("gameOver");

        if (
            !gameRunning &&
            gameOver &&
            gameOver.style.display !== "none"
        ) {

            const retryButton =
                document.getElementById("retryButton");

            if (retryButton) {
                retryButton.style.display = "none";
            }

            gameOver.style.display = "none";
            gameOver.style.visibility = "hidden";
            gameOver.style.opacity = "0";
            gameOver.style.pointerEvents = "none";

            startGame();
        }
    }
});

// =====================================================
// JUMP
// =====================================================

function jump() {

    if (gravityFlipped) {

        if (
            Math.abs(
                maveli.y - ceilingY
            ) < 10
        ) {

            maveli.velocityY = -11;

            maveli.jumping = true;
        }

    } else {

        if (
            Math.abs(
                maveli.y -
                (groundY - maveli.height)
            ) < 10
        ) {

            maveli.velocityY = -11;

            maveli.jumping = true;
        }
    }
}

// =====================================================
// GRAVITY FLIP
// =====================================================

function flipGravity() {

    if (!gameRunning) return;
    if (gameEnding) return;
    if (maveli.falling) return;
    if (gravityFlipping) return;

    gravityFlipped =
        !gravityFlipped;

    gravityFlipping = true;

    flipProgress = 0;

    flipStartY = maveli.y;

    flipTargetY =
        gravityFlipped
            ? ceilingY
            : groundY - maveli.height;

    if (gravityFlipped) {

        flipStartScale = 1;
        flipEndScale = -1;

    } else {

        flipStartScale = -1;
        flipEndScale = 1;
    }

    flipScale =
        flipStartScale;

    maveli.velocityY = 0;

    maveli.jumping = false;
    maveli.ducking = false;
}

// =====================================================
// UPDATE MAVELI
// =====================================================

function updateMaveli() {

    // Ending fall
    if (maveli.falling) {

        updateMaveliEndingFall();

        return;
    }

    // Smooth gravity flip
    if (gravityFlipping) {

        flipProgress += 0.085;

        if (flipProgress > 1) {

            flipProgress = 1;
        }

        const smooth =
            flipProgress *
            flipProgress *
            (3 - 2 * flipProgress);

        maveli.y =
            flipStartY +
            (flipTargetY - flipStartY) *
            smooth;

        flipScale =
            flipStartScale +
            (flipEndScale - flipStartScale) *
            smooth;

        if (flipProgress >= 1) {

            gravityFlipping = false;

            maveli.y =
                flipTargetY;

            maveli.velocityY = 0;

            maveli.jumping = false;
        }

        runTime += 0.35;

        return;
    }

    // Normal physics
    const direction =
        gravityFlipped
            ? -1
            : 1;

    maveli.velocityY +=
        gravity * direction;

    maveli.y +=
        maveli.velocityY;

    // Ceiling
    if (gravityFlipped) {

        if (maveli.y <= ceilingY) {

            maveli.y = ceilingY;

            maveli.velocityY = 0;

            maveli.jumping = false;
        }
    }

    // Ground
    else {

        const floor =
            groundY - maveli.height;

        if (maveli.y >= floor) {

            maveli.y = floor;

            maveli.velocityY = 0;

            maveli.jumping = false;
        }
    }

    if (!maveli.jumping) {

        runTime += 0.35;
    }
}

// =====================================================
// MAVELI FALL INTO GROUND
// =====================================================

function updateMaveliEndingFall() {

    maveli.fallVelocity += 0.42;

    maveli.y +=
        maveli.fallVelocity;

    maveli.x +=
        maveliKnockback;

    maveli.rotation += 0.06;

    const floor =
        groundY - maveli.height;

    if (maveli.y > floor) {

        undergroundProgress =
            Math.min(
                1,
                (maveli.y - floor) / 150
            );

        maveliFade =
            1 -
            undergroundProgress * 0.55;

        if (!impactDone) {

            impactDone = true;

            impactFlash = 0.8;

            screenShake = 12;

            createDust(
                maveli.x +
                maveli.width / 2,

                groundY
            );
        }
    }

    updateDust();

    if (screenShake > 0) {

        screenShake *= 0.88;

        if (screenShake < 0.2) {
            screenShake = 0;
        }
    }

    if (impactFlash > 0) {

        impactFlash *= 0.88;

        if (impactFlash < 0.02) {
            impactFlash = 0;
        }
    }

    if (
        undergroundProgress >= 1
    ) {

        endingState =
            "gameover";

        endingTimer = 0;
    }
}

// =====================================================
// VAMANA FOLLOW MAVELI
// =====================================================

function updateVamana() {

    if (gameEnding) return;

    const followGap = 115;

    const desiredX =
        maveli.x - followGap;

    vamana.x +=
        (desiredX - vamana.x) *
        0.30;

    const maximumX =
        maveli.x - 65;

    if (
        vamana.x >
        maximumX
    ) {

        vamana.x =
            maximumX;
    }

    let targetY;

    // Only follow Maveli vertically during normal jump.
    // During gravity flip, the kid stays on the ground.
    if (
        maveli.jumping &&
        !gravityFlipped &&
        !gravityFlipping
    ) {

        targetY =
            maveli.y +
            maveli.height -
            vamana.height;

    } else {

        targetY =
            groundY -
            vamana.height;
    }

    vamana.y +=
        (targetY - vamana.y) *
        0.30;

    if (
        !gravityFlipped &&
        !maveli.jumping &&
        !gravityFlipping
    ) {

        const groundPosition =
            groundY -
            vamana.height;

        if (
            vamana.y >
            groundPosition
        ) {

            vamana.y =
                groundPosition;
        }
    }
}

// =====================================================
// SCENERY
// =====================================================

function createScenery() {

    const types = [
        "coconut",
        "coconut",
        "banana",
        "house",
        "coconut",
        "temple",
        "coconut",
        "flower",
        "tree"
    ];

    const type =
        types[
            Math.floor(
                Math.random() *
                types.length
            )
        ];

    scenery.push({

        x:
            canvas.width + 50,

        y:
            groundY,

        type:
            type,

        scale:
            0.75 +
            Math.random() * 0.5,

        speed:
            0.55 +
            Math.random() * 0.4
    });
}

// =====================================================
// INITIAL SCENERY
// =====================================================

function createInitialScenery() {

    scenery = [

        {
            x: 90,
            y: groundY,
            type: "coconut",
            scale: 0.95,
            speed: 0.65
        },

        {
            x: 270,
            y: groundY,
            type: "house",
            scale: 0.8,
            speed: 0.6
        },

        {
            x: 460,
            y: groundY,
            type: "coconut",
            scale: 1.0,
            speed: 0.7
        },

        {
            x: 650,
            y: groundY,
            type: "banana",
            scale: 0.85,
            speed: 0.6
        },

        {
            x: 820,
            y: groundY,
            type: "coconut",
            scale: 0.9,
            speed: 0.68
        }
    ];
}

// =====================================================
// UPDATE SCENERY
// =====================================================

function updateScenery() {

    sceneryTimer++;

    if (
        sceneryTimer > 80
    ) {

        createScenery();

        sceneryTimer = 0;
    }

    scenery.forEach(
        item => {

            item.x -=
                speed *
                item.speed;
        }
    );

    scenery =
        scenery.filter(
            item =>
                item.x >
                -150
        );
}

// =====================================================
// DRAW SCENERY
// =====================================================

function drawScenery() {

    scenery.forEach(
        item => {

            ctx.save();

            ctx.translate(
                item.x,
                item.y
            );

            ctx.scale(
                item.scale,
                item.scale
            );

            // =================================================
            // TREE
            // =================================================

            if (
                item.type === "tree"
            ) {

                ctx.fillStyle =
                    "#7a4a25";

                ctx.fillRect(
                    -12,
                    -150,
                    24,
                    150
                );

                ctx.fillStyle =
                    "#2e8b3c";

                ctx.beginPath();

                ctx.arc(
                    0,
                    -170,
                    55,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                ctx.beginPath();

                ctx.arc(
                    -35,
                    -145,
                    40,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                ctx.beginPath();

                ctx.arc(
                    35,
                    -145,
                    40,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }

            // =================================================
            // COCONUT TREE
            // =================================================

            if (
                item.type === "coconut"
            ) {

                // Kerala Coconut Tree Trunk (slender, curved, ringed)
                const trunkTopX = 14;
                const trunkTopY = -190;

                // Tapering trunk
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.quadraticCurveTo(-15, -95, trunkTopX - 6, trunkTopY);
                ctx.lineTo(trunkTopX + 6, trunkTopY);
                ctx.quadraticCurveTo(-3, -95, 10, 0);
                ctx.closePath();

                const trunkGrad =
                    ctx.createLinearGradient(
                        -10,
                        0,
                        trunkTopX + 6,
                        trunkTopY
                    );
                trunkGrad.addColorStop(0, "#744520");
                trunkGrad.addColorStop(0.5, "#8d582f");
                trunkGrad.addColorStop(1, "#663b19");
                ctx.fillStyle = trunkGrad;
                ctx.fill();

                // Ringed segments on the coconut tree trunk
                ctx.strokeStyle = "rgba(55, 30, 12, 0.45)";
                ctx.lineWidth = 2;
                for (let r = 16; r < 185; r += 15) {
                    const t = r / 190;
                    const rx = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * (-10) + t * t * trunkTopX;
                    const ry = -r;
                    const w = 8.5 * (1 - t * 0.38);
                    ctx.beginPath();
                    ctx.moveTo(rx - w, ry);
                    ctx.lineTo(rx + w, ry - 2);
                    ctx.stroke();
                }

                // Coconuts cluster under the crown
                const coconuts = [
                    { x: trunkTopX - 6, y: trunkTopY + 8, r: 8, col: "#734b22" },
                    { x: trunkTopX + 3, y: trunkTopY + 10, r: 8.5, col: "#5e8226" },
                    { x: trunkTopX - 1, y: trunkTopY + 16, r: 8, col: "#69431e" },
                    { x: trunkTopX + 9, y: trunkTopY + 15, r: 7.5, col: "#527520" },
                    { x: trunkTopX - 8, y: trunkTopY + 17, r: 7, col: "#7f5127" }
                ];

                coconuts.forEach(c => {
                    ctx.fillStyle = c.col;
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                    ctx.beginPath();
                    ctx.arc(c.x - c.r * 0.3, c.y - c.r * 0.3, c.r * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Lush Kerala Coconut Fronds (Arching Oola)
                const fronds = [
                    { angle: -155, len: 95, arch: 38, col: "#2a8037", ribCol: "#1e6128" },
                    { angle: -130, len: 105, arch: 45, col: "#329440", ribCol: "#246e2f" },
                    { angle: -105, len: 110, arch: 32, col: "#3ca34a", ribCol: "#287a35" },
                    { angle: -80, len: 115, arch: 28, col: "#44b353", ribCol: "#2e883c" },
                    { angle: -55, len: 110, arch: 34, col: "#3aa049", ribCol: "#287a35" },
                    { angle: -30, len: 105, arch: 46, col: "#329440", ribCol: "#246e2f" },
                    { angle: -10, len: 95, arch: 40, col: "#2a8037", ribCol: "#1e6128" },
                    { angle: -170, len: 75, arch: 30, col: "#226e2d", ribCol: "#185422" },
                    { angle: 5, len: 75, arch: 32, col: "#226e2d", ribCol: "#185422" }
                ];

                fronds.forEach(f => {
                    const rad = f.angle * Math.PI / 180;
                    const cosA = Math.cos(rad);
                    const sinA = Math.sin(rad);

                    const midX = trunkTopX + cosA * (f.len * 0.55);
                    const midY = trunkTopY + sinA * (f.len * 0.55) - f.arch * 0.4;

                    const endX = trunkTopX + cosA * f.len;
                    const endY = trunkTopY + sinA * f.len + f.arch;

                    // Leaflets along the frond
                    ctx.strokeStyle = f.col;
                    ctx.lineWidth = 3.2;
                    const leafletCount = 12;
                    for (let l = 2; l < leafletCount; l++) {
                        const t = l / leafletCount;
                        const fx = (1 - t) * (1 - t) * trunkTopX + 2 * (1 - t) * t * midX + t * t * endX;
                        const fy = (1 - t) * (1 - t) * trunkTopY + 2 * (1 - t) * t * midY + t * t * endY;

                        const leafAngle = rad + Math.PI / 2 + (cosA > 0 ? 0.3 : -0.3);
                        const leafLen = 13 * Math.sin(t * Math.PI) * (1 - t * 0.3);

                        ctx.beginPath();
                        ctx.moveTo(fx, fy);
                        ctx.lineTo(fx + Math.cos(leafAngle) * leafLen, fy + Math.sin(leafAngle) * leafLen + 4);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.moveTo(fx, fy);
                        ctx.lineTo(fx - Math.cos(leafAngle) * leafLen * 0.8, fy - Math.sin(leafAngle) * leafLen * 0.8 + 4);
                        ctx.stroke();
                    }

                    // Central spine of frond
                    ctx.strokeStyle = f.ribCol;
                    ctx.lineWidth = 2.4;
                    ctx.beginPath();
                    ctx.moveTo(trunkTopX, trunkTopY);
                    ctx.quadraticCurveTo(midX, midY, endX, endY);
                    ctx.stroke();
                });

                // Crown center cap
                ctx.fillStyle = "#3e6c27";
                ctx.beginPath();
                ctx.arc(trunkTopX, trunkTopY, 6, 0, Math.PI * 2);
                ctx.fill();
            }

            // =================================================
            // HOUSE
            // =================================================

            if (
                item.type === "house"
            ) {

                ctx.fillStyle =
                    "#f4d6a0";

                ctx.fillRect(
                    -80,
                    -100,
                    160,
                    100
                );

                ctx.fillStyle =
                    "#a94b32";

                ctx.beginPath();

                ctx.moveTo(
                    -100,
                    -100
                );

                ctx.lineTo(
                    0,
                    -175
                );

                ctx.lineTo(
                    100,
                    -100
                );

                ctx.closePath();

                ctx.fill();

                ctx.fillStyle =
                    "#6b3d25";

                ctx.fillRect(
                    -18,
                    -55,
                    36,
                    55
                );

                ctx.fillStyle =
                    "#6eb7d9";

                ctx.fillRect(
                    -62,
                    -65,
                    30,
                    30
                );

                ctx.fillRect(
                    32,
                    -65,
                    30,
                    30
                );

                ctx.strokeStyle =
                    "#5a3522";

                ctx.lineWidth = 3;

                ctx.strokeRect(
                    -62,
                    -65,
                    30,
                    30
                );

                ctx.strokeRect(
                    32,
                    -65,
                    30,
                    30
                );
            }

            // =================================================
            // TEMPLE
            // =================================================

            if (
                item.type === "temple"
            ) {

                ctx.fillStyle =
                    "#e8c37d";

                ctx.fillRect(
                    -65,
                    -110,
                    130,
                    110
                );

                ctx.fillStyle =
                    "#c87935";

                ctx.beginPath();

                ctx.moveTo(
                    -80,
                    -110
                );

                ctx.lineTo(
                    0,
                    -155
                );

                ctx.lineTo(
                    80,
                    -110
                );

                ctx.closePath();

                ctx.fill();

                ctx.fillStyle =
                    "#d69a45";

                ctx.fillRect(
                    -35,
                    -190,
                    70,
                    80
                );

                ctx.beginPath();

                ctx.moveTo(
                    -45,
                    -190
                );

                ctx.lineTo(
                    0,
                    -225
                );

                ctx.lineTo(
                    45,
                    -190
                );

                ctx.closePath();

                ctx.fill();

                ctx.fillStyle =
                    "#70452b";

                ctx.fillRect(
                    -18,
                    -55,
                    36,
                    55
                );
            }

            // =================================================
            // BANANA PLANT
            // =================================================

            if (
                item.type === "banana"
            ) {

                ctx.fillStyle =
                    "#4f8b35";

                ctx.fillRect(
                    -8,
                    -90,
                    16,
                    90
                );

                ctx.fillStyle =
                    "#3c9b42";

                ctx.beginPath();

                ctx.ellipse(
                    -35,
                    -110,
                    50,
                    18,
                    -0.4,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                ctx.beginPath();

                ctx.ellipse(
                    35,
                    -125,
                    55,
                    20,
                    0.4,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                ctx.beginPath();

                ctx.ellipse(
                    -5,
                    -145,
                    60,
                    18,
                    -0.1,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }

            // =================================================
            // FLOWER
            // =================================================

            if (
                item.type === "flower"
            ) {

                ctx.strokeStyle =
                    "#398b45";

                ctx.lineWidth = 4;

                ctx.beginPath();

                ctx.moveTo(
                    0,
                    0
                );

                ctx.lineTo(
                    0,
                    -45
                );

                ctx.stroke();

                ctx.fillStyle =
                    "#e94c68";

                for (
                    let i = 0;
                    i < 6;
                    i++
                ) {

                    const angle =
                        i *
                        Math.PI /
                        3;

                    ctx.beginPath();

                    ctx.arc(
                        Math.cos(angle) *
                            13,

                        -45 +
                        Math.sin(angle) *
                            13,

                        9,

                        0,
                        Math.PI * 2
                    );

                    ctx.fill();
                }

                ctx.fillStyle =
                    "#f5c542";

                ctx.beginPath();

                ctx.arc(
                    0,
                    -45,
                    8,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }

            ctx.restore();
        }
    );
}

// =====================================================
// OBSTACLES
// =====================================================

function createObstacle() {

    const types = [
        "banana",
        "pot",
        "banana",
        "rock",
        "pookkalam"
    ];

    const type =
        types[
            Math.floor(
                Math.random() *
                types.length
            )
        ];

    let obstacle;

    if (type === "banana") {
        // Hanging banana bundle: DUCK to cross!
        obstacle = {
            x: canvas.width + 60,
            type: "banana",
            width: 80,
            height: 130,
            y: 220,
            hanging: true
        };

        if (gravityFlipped) {
            obstacle.y = ceilingY + 30;
        }
    } else if (type === "pot") {
        // Traditional Kerala clay pot: JUMP to cross!
        obstacle = {
            x: canvas.width + 50,
            type: "pot",
            width: 55,
            height: 55,
            y: groundY - 55,
            hanging: false
        };

        if (gravityFlipped) {
            obstacle.y = ceilingY;
        }
    } else if (type === "rock") {
        // Kerala river rock: JUMP to cross!
        obstacle = {
            x: canvas.width + 50,
            type: "rock",
            width: 60,
            height: 50,
            y: groundY - 50,
            hanging: false
        };

        if (gravityFlipped) {
            obstacle.y = ceilingY;
        }
    } else {
        // Onam floral carpet (Pookkalam): JUMP to cross!
        obstacle = {
            x: canvas.width + 50,
            type: "pookkalam",
            width: 65,
            height: 38,
            y: groundY - 38,
            hanging: false
        };

        if (gravityFlipped) {
            obstacle.y = ceilingY;
        }
    }

    obstacles.push(obstacle);
}

// =====================================================
// UPDATE OBSTACLES
// =====================================================

function updateObstacles() {

    obstacleTimer++;

    const spawnRate =
        Math.max(
            65,
            120 -
            Math.floor(
                score / 100
            )
        );

    if (
        obstacleTimer >
        spawnRate
    ) {

        createObstacle();

        obstacleTimer = 0;
    }

    obstacles.forEach(
        obstacle => {

            obstacle.x -= speed;
        }
    );

    obstacles =
        obstacles.filter(
            obstacle =>
                obstacle.x >
                -100
        );
}

// =====================================================
// DRAW OBSTACLES
// =====================================================

function drawObstacles() {

    obstacles.forEach(
        obstacle => {

            ctx.save();

            ctx.translate(
                obstacle.x,
                obstacle.y
            );

            // =================================================
            // 1. HANGING BANANA BUNDLE (DUCK TO CROSS)
            // =================================================
            if (obstacle.type === "banana") {

                const sway =
                    Math.sin((worldX + obstacle.x) * 0.035) * 0.045;

                ctx.rotate(sway);

                // Hanging rope from top of canvas (y = 0)
                const ropeStartY = -obstacle.y;

                ctx.strokeStyle = "#825026";
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(0, ropeStartY);
                ctx.lineTo(0, 15);
                ctx.stroke();

                // Coir rope texture
                ctx.strokeStyle = "#a36e3c";
                ctx.lineWidth = 2;
                for (let ry = ropeStartY; ry < 12; ry += 10) {
                    ctx.beginPath();
                    ctx.moveTo(-2.5, ry);
                    ctx.lineTo(2.5, ry + 6);
                    ctx.stroke();
                }

                // Rope knot around stalk
                ctx.fillStyle = "#5c3716";
                ctx.beginPath();
                ctx.ellipse(0, 10, 8, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // Draw banana bundle image
                if (bananaImage.complete && bananaImage.naturalWidth > 0) {
                    ctx.drawImage(
                        bananaImage,
                        -obstacle.width / 2,
                        0,
                        obstacle.width,
                        obstacle.height
                    );
                } else {
                    // Fallback banana bunch
                    ctx.fillStyle = "#f5d033";
                    for (let i = 0; i < 7; i++) {
                        ctx.beginPath();
                        ctx.ellipse(
                            -18 + i * 6,
                            20 + (i % 3) * 15,
                            10,
                            30,
                            (i - 3) * 0.12,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                }
            }

            // =================================================
            // 2. KERALA CLAY POT / URULI (JUMP OVER)
            // =================================================
            else if (obstacle.type === "pot") {

                const potW = obstacle.width;
                const potH = obstacle.height;

                // Shadow
                ctx.fillStyle = "rgba(0,0,0,0.22)";
                ctx.beginPath();
                ctx.ellipse(0, potH - 2, potW * 0.42, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // Terracotta belly
                const potGrad = ctx.createRadialGradient(-5, potH * 0.55, 4, 0, potH * 0.55, potW * 0.48);
                potGrad.addColorStop(0, "#e26f39");
                potGrad.addColorStop(0.65, "#b84f22");
                potGrad.addColorStop(1, "#7a2e0e");

                ctx.fillStyle = potGrad;
                ctx.beginPath();
                ctx.ellipse(0, potH * 0.6, potW * 0.42, potH * 0.38, 0, 0, Math.PI * 2);
                ctx.fill();

                // Neck
                ctx.fillStyle = "#a34318";
                ctx.fillRect(-potW * 0.22, potH * 0.16, potW * 0.44, potH * 0.16);

                // Rim
                ctx.fillStyle = "#c85929";
                ctx.beginPath();
                ctx.ellipse(0, potH * 0.16, potW * 0.3, potH * 0.1, 0, 0, Math.PI * 2);
                ctx.fill();

                // Mouth opening
                ctx.fillStyle = "#4a1906";
                ctx.beginPath();
                ctx.ellipse(0, potH * 0.16, potW * 0.22, potH * 0.06, 0, 0, Math.PI * 2);
                ctx.fill();

                // Decorative golden pattern line
                ctx.strokeStyle = "#e8a05c";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, potH * 0.6, potW * 0.38, 0.25, Math.PI - 0.25);
                ctx.stroke();
            }

            // =================================================
            // 3. MOSSY RIVER ROCK (JUMP OVER)
            // =================================================
            else if (obstacle.type === "rock") {

                const rW = obstacle.width;
                const rH = obstacle.height;

                // Shadow
                ctx.fillStyle = "rgba(0,0,0,0.24)";
                ctx.beginPath();
                ctx.ellipse(0, rH - 2, rW * 0.46, 7, 0, 0, Math.PI * 2);
                ctx.fill();

                // Rock base polygon
                ctx.fillStyle = "#5c646b";
                ctx.beginPath();
                ctx.moveTo(-rW * 0.45, rH);
                ctx.lineTo(-rW * 0.4, rH * 0.38);
                ctx.lineTo(-rW * 0.15, rH * 0.05);
                ctx.lineTo(rW * 0.22, rH * 0.12);
                ctx.lineTo(rW * 0.46, rH * 0.5);
                ctx.lineTo(rW * 0.42, rH);
                ctx.closePath();
                ctx.fill();

                // Rock shadow facet
                ctx.fillStyle = "#41474d";
                ctx.beginPath();
                ctx.moveTo(-rW * 0.15, rH * 0.05);
                ctx.lineTo(rW * 0.22, rH * 0.12);
                ctx.lineTo(rW * 0.46, rH * 0.5);
                ctx.lineTo(rW * 0.05, rH * 0.65);
                ctx.closePath();
                ctx.fill();

                // Rock light facet highlight
                ctx.strokeStyle = "#808a93";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-rW * 0.4, rH * 0.38);
                ctx.lineTo(-rW * 0.15, rH * 0.05);
                ctx.lineTo(rW * 0.22, rH * 0.12);
                ctx.stroke();

                // Fresh green Kerala moss patch
                ctx.fillStyle = "#388e3c";
                ctx.beginPath();
                ctx.ellipse(-rW * 0.06, rH * 0.16, rW * 0.22, rH * 0.12, -0.15, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#66bb6a";
                ctx.beginPath();
                ctx.arc(-rW * 0.03, rH * 0.13, rW * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }

            // =================================================
            // 4. ONAM POOKKALAM (JUMP OVER)
            // =================================================
            else if (obstacle.type === "pookkalam") {

                const pW = obstacle.width;
                const pH = obstacle.height;

                // Shadow
                ctx.fillStyle = "rgba(0,0,0,0.16)";
                ctx.beginPath();
                ctx.ellipse(0, pH - 2, pW * 0.48, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // Outer green leaf ring
                ctx.fillStyle = "#2e7d32";
                ctx.beginPath();
                ctx.ellipse(0, pH * 0.55, pW * 0.46, pH * 0.38, 0, 0, Math.PI * 2);
                ctx.fill();

                // Yellow flower ring
                ctx.fillStyle = "#fbc02d";
                ctx.beginPath();
                ctx.ellipse(0, pH * 0.55, pW * 0.38, pH * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();

                // Orange marigold ring
                ctx.fillStyle = "#f57c00";
                ctx.beginPath();
                ctx.ellipse(0, pH * 0.55, pW * 0.28, pH * 0.22, 0, 0, Math.PI * 2);
                ctx.fill();

                // Red petal ring
                ctx.fillStyle = "#d32f2f";
                ctx.beginPath();
                ctx.ellipse(0, pH * 0.55, pW * 0.18, pH * 0.14, 0, 0, Math.PI * 2);
                ctx.fill();

                // Center golden light
                ctx.fillStyle = "#fff176";
                ctx.beginPath();
                ctx.arc(0, pH * 0.55, pW * 0.08, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    );
}

// =====================================================
// COLLISION DETECTION
// =====================================================

function checkCollision() {

    if (
        maveli.falling ||
        gameEnding ||
        gravityFlipping
    ) {

        return false;
    }

    let playerX =
        maveli.x + 20;

    let playerY =
        maveli.y + 10;

    let playerWidth =
        maveli.width - 40;

    let playerHeight =
        maveli.height - 20;

    if (
        maveli.ducking
    ) {

        if (!gravityFlipped) {
            // Anchor to floor: Maveli crouches down low
            playerY =
                (maveli.y + maveli.height) - 50;

            playerHeight =
                44;
        } else {
            // Anchor to ceiling
            playerY =
                maveli.y + 6;

            playerHeight =
                44;
        }
    }

    for (
        const obstacle of obstacles
    ) {

        let obstacleX =
            obstacle.x -
            obstacle.width / 2;

        let obstacleY =
            obstacle.y;

        let obstacleWidth =
            obstacle.width;

        let obstacleHeight =
            obstacle.height;

        if (obstacle.type === "banana") {
            // Hanging banana bundle hitbox (DUCK under)
            obstacleX += 12;
            obstacleY += 8;
            obstacleWidth -= 24;
            obstacleHeight -= 6;
        } else {
            // Ground obstacles hitbox (JUMP over)
            obstacleX += 8;
            obstacleY += 6;
            obstacleWidth -= 16;
            obstacleHeight -= 6;
        }

        if (
            playerX <
                obstacleX +
                obstacleWidth &&

            playerX +
                playerWidth >
                obstacleX &&

            playerY <
                obstacleY +
                obstacleHeight &&

            playerY +
                playerHeight >
                obstacleY
        ) {

            startEnding();

            return true;
        }
    }

    return false;
}

// =====================================================
// START ENDING
// =====================================================

function startEnding() {

    if (gameEnding) return;

    gameEnding = true;

    gameRunning = false;

    endingState = "approach";

    endingTimer = 0;

    villainKick = 0;

    villainScale = 0.65;

    villainX =
        maveli.x + 330;

    maveli.falling = false;

    maveli.fallVelocity = 0;

    maveliKnockback = 0;

    maveliFade = 1;

    undergroundProgress = 0;

    impactDone = false;

    screenShake = 0;

    impactFlash = 0;

    obstacles = [];
}

// =====================================================
// UPDATE ENDING
// =====================================================

function updateEnding() {

    endingTimer++;

    // =================================================
    // VILLAIN APPROACH
    // =================================================

    if (
        endingState === "approach"
    ) {

        villainX -= 4.5;

        const targetX =
            maveli.x + 210;

        if (
            villainX <= targetX
        ) {

            villainX =
                targetX;

            endingState =
                "transform";

            endingTimer = 0;
        }
    }

    // =================================================
    // TRANSFORM
    // =================================================

    else if (
        endingState === "transform"
    ) {

        villainScale +=
            0.025;

        if (
            villainScale >= 1.25
        ) {

            villainScale = 1.25;

            villainX =
                maveli.x + 210;

            endingState =
                "ready";

            endingTimer = 0;
        }
    }

    // =================================================
    // READY
    // =================================================

    else if (
        endingState === "ready"
    ) {

        if (
            endingTimer > 25
        ) {

            endingState =
                "kick";

            endingTimer = 0;

            villainKick = 0;
        }
    }

    // =================================================
    // KICK
    // =================================================

    else if (
        endingState === "kick"
    ) {

        villainKick +=
            0.035;

        if (
            villainKick >= 0.28 &&
            !maveli.falling
        ) {

            maveli.falling = true;

            maveli.fallVelocity =
                2.5;

            maveliKnockback =
                -2.2;

            maveli.rotation =
                -0.15;

            createDust(
                maveli.x +
                maveli.width / 2,

                groundY
            );

            screenShake = 8;

            impactFlash = 0.5;
        }

        if (
            villainKick >= 1
        ) {

            villainKick = 1;

            endingState =
                "fall";

            endingTimer = 0;
        }
    }

    // =================================================
    // FALL
    // =================================================

    else if (
        endingState === "fall"
    ) {

        if (
            maveli.falling
        ) {

            updateMaveliEndingFall();
        }
    }

    // =================================================
    // GAME OVER
    // =================================================

    else if (
        endingState === "gameover"
    ) {

        if (
            endingTimer > 25
        ) {

            showGameOver();
        }
    }
}

// =====================================================
// DRAW MAVELI
// =====================================================

function drawMaveli() {

    ctx.save();

    let drawWidth =
        maveli.width;

    let drawHeight =
        maveli.height;

    if (
        maveli.ducking
    ) {

        drawHeight *=
            0.55;

        drawWidth *=
            1.15;
    }

    let centerY =
        maveli.y +
        maveli.height / 2;

    if (
        maveli.ducking &&
        !gravityFlipped
    ) {

        centerY =
            (maveli.y + maveli.height) -
            drawHeight / 2;

    } else if (
        maveli.ducking &&
        gravityFlipped
    ) {

        centerY =
            maveli.y +
            drawHeight / 2;
    }

    ctx.translate(
        maveli.x +
        maveli.width / 2,

        centerY
    );

    // Running bounce
    if (
        !maveli.jumping &&
        !maveli.falling &&
        !gravityFlipping
    ) {

        const bounce =
            Math.sin(runTime) *
            2;

        ctx.translate(
            0,
            bounce
        );
    }

    // Ending rotation
    if (
        maveli.falling
    ) {

        ctx.rotate(
            maveli.rotation
        );
    }

    /*
        IMPORTANT:

        Flip ONLY vertically.

        Maveli always faces
        LEFT -> RIGHT.
    */

    ctx.scale(
        1,
        flipScale
    );

    ctx.globalAlpha =
        maveliFade;

    ctx.drawImage(
        maveliImage,

        -drawWidth / 2,
        -drawHeight / 2,

        drawWidth,
        drawHeight
    );

    ctx.globalAlpha = 1;

    ctx.restore();
}

// =====================================================
// DRAW VAMANA
// =====================================================

function drawVamana() {

    if (gameEnding) return;

    ctx.save();

    ctx.drawImage(
        kidImage,

        vamana.x,
        vamana.y,

        vamana.width,
        vamana.height
    );

    ctx.restore();
}

// =====================================================
// DRAW REAL VILLAIN
// =====================================================

function drawRealVillain() {

    if (
        endingState === "none" ||
        endingState === "gameover"
    ) {

        return;
    }

    ctx.save();

    const baseWidth = 155;
    const baseHeight = 190;

    const width =
        baseWidth *
        villainScale;

    const height =
        baseHeight *
        villainScale;

    let kickDistance = 0;

    if (
        endingState === "kick"
    ) {

        const kickEase =
            Math.sin(
                villainKick *
                Math.PI
            );

        kickDistance =
            kickEase * 115;
    }

    const drawX =
        villainX -
        kickDistance;

    const drawY =
        groundY -
        height;

    ctx.drawImage(
        villainImage,

        drawX,
        drawY,

        width,
        height
    );

    // Speed lines
    if (
        endingState === "kick"
    ) {

        ctx.strokeStyle =
            "#ffd43b";

        ctx.lineWidth = 5;

        for (
            let i = 0;
            i < 5;
            i++
        ) {

            const offset =
                i * 15;

            ctx.beginPath();

            ctx.moveTo(
                drawX +
                width +
                15,

                drawY +
                35 +
                offset
            );

            ctx.lineTo(
                drawX +
                width +
                50,

                drawY +
                35 +
                offset
            );

            ctx.stroke();
        }
    }

    ctx.restore();
}

// =====================================================
// SKY
// =====================================================

function drawSky() {

    // Brilliant tropical blue sky gradient
    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            groundY
        );

    gradient.addColorStop(
        0,
        "#0a71cf"
    );

    gradient.addColorStop(
        0.35,
        "#2493ec"
    );

    gradient.addColorStop(
        0.7,
        "#62b7f7"
    );

    gradient.addColorStop(
        1,
        "#bae3fe"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawSun();
}

// =====================================================
// SUN
// =====================================================

function drawSun() {

    const sunX = 820;
    const sunY = 72;

    // Outer warm tropical glow
    const outerGlow =
        ctx.createRadialGradient(
            sunX,
            sunY,
            12,
            sunX,
            sunY,
            68
        );

    outerGlow.addColorStop(
        0,
        "rgba(255, 245, 180, 0.45)"
    );

    outerGlow.addColorStop(
        0.5,
        "rgba(255, 228, 125, 0.18)"
    );

    outerGlow.addColorStop(
        1,
        "rgba(255, 215, 95, 0)"
    );

    ctx.fillStyle =
        outerGlow;

    ctx.beginPath();
    ctx.arc(
        sunX,
        sunY,
        68,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Bright sun disk
    const sunGrad =
        ctx.createRadialGradient(
            sunX - 5,
            sunY - 5,
            3,
            sunX,
            sunY,
            26
        );

    sunGrad.addColorStop(
        0,
        "#ffffff"
    );

    sunGrad.addColorStop(
        0.55,
        "#fff3ad"
    );

    sunGrad.addColorStop(
        1,
        "#fedb4b"
    );

    ctx.fillStyle =
        sunGrad;

    ctx.beginPath();
    ctx.arc(
        sunX,
        sunY,
        26,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// =====================================================
// CLOUDS
// =====================================================

function drawClouds() {

    ctx.fillStyle =
        "rgba(255,255,255,0.85)";

    const clouds = [

        {
            baseX: 100,
            y: 75,
            s: 1
        },

        {
            baseX: 420,
            y: 115,
            s: 0.8
        },

        {
            baseX: 740,
            y: 65,
            s: 1.15
        }
    ];

    clouds.forEach(
        cloud => {

            const cx =
                ((cloud.baseX - worldX * 0.1) %
                (canvas.width + 250) +
                canvas.width + 250) %
                (canvas.width + 250) - 100;

            ctx.beginPath();

            ctx.arc(
                cx,
                cloud.y,
                28 *
                cloud.s,
                0,
                Math.PI * 2
            );

            ctx.arc(
                cx + 30 *
                cloud.s,

                cloud.y - 10 *
                cloud.s,

                35 *
                cloud.s,

                0,
                Math.PI * 2
            );

            ctx.arc(
                cx + 65 *
                cloud.s,

                cloud.y,

                27 *
                cloud.s,

                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    );
}

// =====================================================
// KERALA BACKDROP (Distant Hills & Coconut Groves)
// =====================================================

function drawKeralaBackdrop() {

    // 1. Distant Western Ghats (Misty Blue-Green Hills)
    ctx.save();
    ctx.fillStyle = "#3f8460";
    ctx.globalAlpha = 0.30;
    ctx.beginPath();
    ctx.moveTo(0, groundY);

    const hillOffset = (worldX * 0.12) % 600;
    ctx.lineTo(0, groundY - 50);

    for (let x = 0; x <= canvas.width + 60; x += 30) {
        const sampleX = x + hillOffset;
        const h = Math.sin(sampleX * 0.007) * 32 + Math.cos(sampleX * 0.018) * 18 + 55;
        ctx.lineTo(x, groundY - h);
    }

    ctx.lineTo(canvas.width, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Mid-distance Kerala Coconut Palm Grove Skyline
    ctx.save();
    const palmInterval = 46;
    const scrollOffset = (worldX * 0.32) % palmInterval;

    for (let x = -palmInterval; x <= canvas.width + palmInterval * 2; x += palmInterval) {
        const px = x - scrollOffset;
        const seed = Math.sin(Math.floor((x + worldX * 0.32) / palmInterval) * 12.9898);
        const palmH = 50 + Math.abs(seed) * 26;
        const topY = groundY - palmH;
        const curve = seed * 7;

        // Slender distant trunk
        ctx.strokeStyle = "rgba(42, 80, 48, 0.65)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px, groundY);
        ctx.quadraticCurveTo(px + curve * 0.5, groundY - palmH * 0.5, px + curve, topY);
        ctx.stroke();

        // Distant coconut crown (arching fronds)
        ctx.strokeStyle = "rgba(28, 98, 45, 0.78)";
        ctx.lineWidth = 2.2;
        const crownX = px + curve;
        for (let i = 0; i < 7; i++) {
            const angle = -Math.PI * 0.95 + (i * Math.PI * 0.9 / 6);
            const flen = 17 + (i % 2) * 5;
            const ex = crownX + Math.cos(angle) * flen;
            const ey = topY + Math.sin(angle) * flen * 0.6 + 4;

            ctx.beginPath();
            ctx.moveTo(crownX, topY);
            ctx.quadraticCurveTo(
                crownX + Math.cos(angle) * flen * 0.5,
                topY + Math.sin(angle) * flen * 0.4 - 3,
                ex,
                ey
            );
            ctx.stroke();
        }

        // Center cluster
        ctx.fillStyle = "rgba(24, 82, 38, 0.85)";
        ctx.beginPath();
        ctx.arc(crownX, topY, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// =====================================================
// GROUND
// =====================================================

function drawGround() {

    // Lush Kerala green ground gradient
    const groundGradient =
        ctx.createLinearGradient(
            0,
            groundY,
            0,
            canvas.height
        );

    groundGradient.addColorStop(
        0,
        "#38a83d"
    );

    groundGradient.addColorStop(
        0.35,
        "#2d8b33"
    );

    groundGradient.addColorStop(
        1,
        "#1b5c22"
    );

    ctx.fillStyle =
        groundGradient;

    ctx.fillRect(
        0,
        groundY,
        canvas.width,
        canvas.height -
        groundY
    );

    // Bright fresh grass running top strip
    ctx.fillStyle =
        "#59cb5f";

    ctx.fillRect(
        0,
        groundY,
        canvas.width,
        7
    );

    // Grassy running surface fringe (tufts)
    ctx.strokeStyle =
        "#78dc7e";

    ctx.lineWidth = 2;

    const grassStep = 24;
    const grassOffset = (worldX % grassStep);

    for (
        let x = -grassStep;
        x < canvas.width + grassStep;
        x += grassStep
    ) {
        const gx = x - grassOffset;
        ctx.beginPath();
        ctx.moveTo(gx, groundY);
        ctx.lineTo(gx + 3, groundY - 4);
        ctx.lineTo(gx + 6, groundY);
        ctx.stroke();
    }

    // Running speed dashes across the turf
    ctx.strokeStyle =
        "#75d87b";

    ctx.lineWidth = 3;

    for (
        let x =
            -(worldX % 60);

        x < canvas.width;

        x += 60
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            groundY + 24
        );

        ctx.lineTo(
            x + 22,
            groundY + 24
        );

        ctx.stroke();
    }

    // Subtle lower soil / depth dashes
    ctx.strokeStyle =
        "#226e29";

    ctx.lineWidth = 2;

    for (
        let x =
            -((worldX * 0.7) % 80);

        x < canvas.width;

        x += 80
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            groundY + 48
        );

        ctx.lineTo(
            x + 18,
            groundY + 48
        );

        ctx.stroke();
    }
}

// =====================================================
// CEILING
// =====================================================

function drawCeiling() {

    ctx.fillStyle =
        "#38a83d";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        10
    );
}

// =====================================================
// GROUND COVER
// =====================================================

function drawGroundCover() {

    if (
        !maveli.falling
    ) {

        return;
    }

    ctx.save();

    const groundGradient =
        ctx.createLinearGradient(
            0,
            groundY,
            0,
            canvas.height
        );

    groundGradient.addColorStop(
        0,
        "#38a83d"
    );

    groundGradient.addColorStop(
        0.35,
        "#2d8b33"
    );

    groundGradient.addColorStop(
        1,
        "#1b5c22"
    );

    ctx.fillStyle =
        groundGradient;

    ctx.fillRect(
        0,
        groundY,
        canvas.width,
        canvas.height -
        groundY
    );

    ctx.fillStyle =
        "#59cb5f";

    ctx.fillRect(
        0,
        groundY,
        canvas.width,
        7
    );

    if (
        undergroundProgress > 0
    ) {

        const holeWidth =
            55 +
            undergroundProgress *
            55;

        ctx.fillStyle =
            "#59442c";

        ctx.beginPath();

        ctx.ellipse(
            maveli.x +
            maveli.width / 2,

            groundY + 3,

            holeWidth,

            10 +
            undergroundProgress *
            10,

            0,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.strokeStyle =
        "#75d87b";

    ctx.lineWidth = 3;

    for (
        let x =
            -(worldX % 60);

        x < canvas.width;

        x += 60
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            groundY + 24
        );

        ctx.lineTo(
            x + 22,
            groundY + 24
        );

        ctx.stroke();
    }

    ctx.restore();
}

// =====================================================
// DUST
// =====================================================

function createDust(x, y) {

    for (
        let i = 0;
        i < 28;
        i++
    ) {

        dustParticles.push({

            x:
                x,

            y:
                y,

            vx:
                (Math.random() - 0.5) *
                7,

            vy:
                -Math.random() *
                6,

            life:
                1,

            size:
                3 +
                Math.random() * 7
        });
    }
}

// =====================================================
// UPDATE DUST
// =====================================================

function updateDust() {

    dustParticles.forEach(
        p => {

            p.x +=
                p.vx;

            p.y +=
                p.vy;

            p.vy +=
                0.2;

            p.life -=
                0.025;
        }
    );

    dustParticles =
        dustParticles.filter(
            p =>
                p.life > 0
        );
}

// =====================================================
// DRAW DUST
// =====================================================

function drawDust() {

    dustParticles.forEach(
        p => {

            ctx.globalAlpha =
                p.life;

            ctx.fillStyle =
                "#c9b48a";

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    );

    ctx.globalAlpha = 1;
}

// =====================================================
// SCORE
// =====================================================

function updateScore() {

    if (!gameRunning) return;

    if (gameEnding) return;

    score +=
        0.05;

    const scoreElement =
        document.getElementById(
            "score"
        );

    if (scoreElement) {

        scoreElement.textContent =
            "Score: " +
            Math.floor(score);
    }

    speed =
        Math.min(
            11,
            5 +
            score / 500
        );
}

// =====================================================
// GAME OVER
// =====================================================

function showGameOver() {

    gameRunning = false;

    gameEnding = false;

    endingState =
        "none";

    const overlay =
        document.getElementById(
            "gameOver"
        );

    if (overlay) {

        overlay.style.display =
            "flex";

        overlay.style.visibility =
            "visible";

        overlay.style.opacity =
            "1";

        overlay.style.pointerEvents =
            "auto";

        overlay.style.zIndex =
            "9999";
    }

    const finalScore =
        document.getElementById(
            "finalScore"
        );

    if (finalScore) {

        finalScore.textContent =
            "Score: " +
            Math.floor(score);
    }

    let retryButton =
        document.getElementById(
            "retryButton"
        );

    if (!retryButton) {

        retryButton =
            document.createElement(
                "button"
            );

        retryButton.id =
            "retryButton";

        retryButton.textContent =
            "TRY AGAIN";

        document.body.appendChild(
            retryButton
        );

        retryButton.addEventListener(
            "click",
            function () {

                retryButton.style.display =
                    "none";

                if (overlay) {

                    overlay.style.display =
                        "none";

                    overlay.style.visibility =
                        "hidden";

                    overlay.style.opacity =
                        "0";

                    overlay.style.pointerEvents =
                        "none";
                }

                startGame();
            }
        );
    }

    retryButton.style.display =
        "block";

    retryButton.style.visibility =
        "visible";

    retryButton.style.opacity =
        "1";

    retryButton.style.pointerEvents =
        "auto";

    retryButton.style.position =
        "fixed";

    retryButton.style.left =
        "50%";

    retryButton.style.top =
        "65%";

    retryButton.style.transform =
        "translate(-50%, -50%)";

    retryButton.style.zIndex =
        "10000";

    retryButton.style.cursor =
        "pointer";

    retryButton.style.padding =
        "14px 34px";

    retryButton.style.border =
        "none";

    retryButton.style.borderRadius =
        "14px";

    retryButton.style.fontSize =
        "18px";

    retryButton.style.fontWeight =
        "bold";
}

// =====================================================
// RESET GAME
// =====================================================

function resetGame() {

    score = 0;

    speed = 5;

    gravityFlipped = false;

    gravityFlipping = false;

    flipProgress = 0;

    flipScale = 1;

    obstacles = [];

    scenery = [];

    dustParticles = [];

    obstacleTimer = 0;

    sceneryTimer = 0;

    worldX = 0;

    runTime = 0;

    gameEnding = false;

    endingState = "none";

    endingTimer = 0;

    villainScale = 0.65;

    villainX =
        maveli.x + 330;

    villainKick = 0;

    maveliKnockback = 0;

    maveliFade = 1;

    undergroundProgress = 0;

    screenShake = 0;

    impactFlash = 0;

    impactDone = false;

    maveli.x = 170;

    maveli.y =
        groundY -
        maveli.height;

    maveli.velocityY = 0;

    maveli.jumping = false;

    maveli.ducking = false;

    maveli.falling = false;

    maveli.fallVelocity = 0;

    maveli.rotation = 0;

    vamana.x =
        maveli.x - 115;

    vamana.y =
        groundY -
        vamana.height;

    vamana.giant = false;

    const scoreElement =
        document.getElementById(
            "score"
        );

    if (scoreElement) {

        scoreElement.textContent =
            "Score: 0";
    }

    const overlay =
        document.getElementById(
            "gameOver"
        );

    if (overlay) {

        overlay.style.display =
            "none";

        overlay.style.visibility =
            "hidden";

        overlay.style.opacity =
            "0";

        overlay.style.pointerEvents =
            "none";
    }

    const retryButton =
        document.getElementById(
            "retryButton"
        );

    if (retryButton) {

        retryButton.style.display =
            "none";
    }

    createInitialScenery();
}

// =====================================================
// START GAME
// =====================================================

function startGame() {

    cancelAnimationFrame(
        animationId
    );

    resetGame();

    gameRunning = true;

    gameEnding = false;

    gameLoop();
}

// =====================================================
// GAME LOOP
// =====================================================

function gameLoop() {

    ctx.save();

    if (
        screenShake > 0
    ) {

        const shakeX =
            (Math.random() - 0.5) *
            screenShake;

        const shakeY =
            (Math.random() - 0.5) *
            screenShake;

        ctx.translate(
            shakeX,
            shakeY
        );
    }

    // Background
    drawSky();

    drawClouds();

    drawKeralaBackdrop();

    // World movement
    if (
        gameRunning &&
        !gameEnding
    ) {

        worldX +=
            speed;
    }

    // Ground
    drawGround();

    // Normal game
    if (
        gameRunning &&
        !gameEnding
    ) {

        updateMaveli();

        updateVamana();

        updateObstacles();

        updateScenery();

        updateScore();

        checkCollision();
    }

    // Ending
    if (gameEnding) {

        updateEnding();

        if (
            maveli.falling
        ) {

            updateMaveli();
        }

        updateDust();
    }

    // Scenery
    drawScenery();

    // Obstacles
    drawObstacles();

    // Kid
    if (!gameEnding) {

        drawVamana();
    }

    // Maveli
    drawMaveli();

    // Villain
    if (gameEnding) {

        drawRealVillain();
    }

    // Ground cover AFTER Maveli
    drawGroundCover();

    // Dust
    drawDust();

    // Flash
    if (
        impactFlash > 0
    ) {

        ctx.fillStyle =
            `rgba(255,255,255,${impactFlash * 0.35})`;

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }

    ctx.restore();

    animationId =
        requestAnimationFrame(
            gameLoop
        );
}

// =====================================================
// START BUTTON
// =====================================================

const startButton =
    document.getElementById(
        "startButton"
    );

if (startButton) {

    startButton.addEventListener(
        "click",
        function () {

            const startScreen =
                document.getElementById(
                    "startScreen"
                );

            if (startScreen) {

                startScreen.style.display =
                    "none";
            }

            startGame();
        }
    );
}

// =====================================================
// INITIAL SCREEN
// =====================================================

drawSky();

drawClouds();

drawKeralaBackdrop();

drawGround();

createInitialScenery();

drawScenery();

drawVamana();

drawMaveli();