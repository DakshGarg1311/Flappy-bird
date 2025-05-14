// script.js
const bird = document.getElementById('bird');
const gameContainer = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const ground = document.getElementById('ground');
const clouds = document.getElementById('clouds');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

let birdPosition = 300;
let birdVelocity = 0;
let gravity = 0.5;
let jumpForce = -10;
let gameRunning = false;
let score = 0;
let pipes = [];
let pipeGap = 150;
let pipeFrequency = 1500;
let lastPipeTime = 0;
let gameSpeed = 1.5;
let animationId;
let cloudElements = [];
let gameStarted = false;
let particles = [];
let lastTrailTime = 0;
let trailFrequency = 100; // Create trail particle every 100ms
let isMobile = false; // Flag to track if we're on mobile

// Initialize clouds
function initClouds() {
    // Remove any existing clouds
    while (clouds.firstChild) {
        clouds.removeChild(clouds.firstChild);
    }
    
    cloudElements = [];
    
    // Create several clouds with different sizes and positions
    for (let i = 0; i < 5; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        // Random size
        const width = 50 + Math.random() * 100;
        const height = width / 2;
        
        // Random position
        const left = Math.random() * (gameContainer.offsetWidth - width);
        const top = Math.random() * (gameContainer.offsetHeight * 0.6);
        
        // Random speed (slower for larger clouds)
        const speed = 0.2 + (Math.random() * 0.3);
        
        cloud.style.width = width + 'px';
        cloud.style.height = height + 'px';
        cloud.style.left = left + 'px';
        cloud.style.top = top + 'px';
        
        clouds.appendChild(cloud);
        
        // Store cloud data for animation
        cloudElements.push({
            element: cloud,
            speed: speed,
            left: left
        });
    }
}

function updateClouds() {
    cloudElements.forEach(cloud => {
        cloud.left -= cloud.speed;
        
        // Reset cloud position when it goes off-screen
        if (cloud.left < -parseFloat(cloud.element.style.width)) {
            cloud.left = gameContainer.offsetWidth;
            cloud.element.style.top = Math.random() * (gameContainer.offsetHeight * 0.6) + 'px';
        }
        
        cloud.element.style.left = cloud.left + 'px';
    });
}

function playSound(type) {
    const audio = new Audio();
    if (type === 'score') audio.src = 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg';
    else if (type === 'flap') audio.src = 'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg';
    else if (type === 'hit') audio.src = 'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg';
    audio.play();
}

// Handle various input methods for better mobile support
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (!gameStarted) {
            startGame();
        } else {
            handleJump(e);
        }
    }
});

// Touch events for mobile
gameContainer.addEventListener('touchstart', function(e) {
    if (!gameStarted) {
        startGame();
    } else {
        handleJump(e);
    }
    // Prevent scrolling when touching the game
    e.preventDefault();
});

// Click events (works for both desktop and mobile)
gameContainer.addEventListener('click', function(e) {
    if (!gameStarted) {
        startGame();
    } else {
        handleJump(e);
    }
});

restartBtn.addEventListener('click', restartGame);
restartBtn.addEventListener('touchstart', function(e) {
    restartGame();
    e.preventDefault();
});

startBtn.addEventListener('click', startGame);
startBtn.addEventListener('touchstart', function(e) {
    startGame();
    e.preventDefault();
});

function handleJump(e) {
    if (!gameRunning || (e.type === 'keydown' && e.code !== 'Space')) return;
    // Adjust jump force for mobile - make it slightly stronger
    if (isMobile) {
        birdVelocity = jumpForce * 1.1; // Slightly stronger jump on mobile
    } else {
        birdVelocity = jumpForce;
    }
    playSound('flap');
    createJumpParticles();
}

function createJumpParticles() {
    // Create a few particles when bird jumps
    const birdRect = bird.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = (birdRect.left - containerRect.left + 20) + 'px';
        particle.style.top = (birdRect.top - containerRect.top + 20) + 'px';
        
        // Random movement for particles
        const dx = -2 - Math.random() * 3;
        const dy = Math.random() * 6 - 3;
        const life = 500 + Math.random() * 500;
        
        gameContainer.appendChild(particle);
        
        particles.push({
            element: particle,
            dx: dx,
            dy: dy,
            life: life,
            opacity: 1,
            createdAt: Date.now()
        });
    }
}

function createTrailParticle() {
    if (!gameRunning) return;
    
    const birdRect = bird.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    
    const particle = document.createElement('div');
    particle.className = 'trail-particle';
    particle.style.left = (birdRect.left - containerRect.left + 10 + Math.random() * 20) + 'px';
    particle.style.top = (birdRect.top - containerRect.top + 10 + Math.random() * 20) + 'px';
    
    gameContainer.appendChild(particle);
    
    particles.push({
        element: particle,
        dx: 0,
        dy: 0,
        life: 500,
        opacity: 0.8,
        createdAt: Date.now(),
        isTrail: true
    });
}

function createDeathParticles() {
    const birdRect = bird.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF4500'];
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'death-particle';
        
        // Random color from our array
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Random size between 5px and 15px
        const size = 5 + Math.random() * 10;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Position at bird's center
        particle.style.left = (birdRect.left - containerRect.left + 20) + 'px';
        particle.style.top = (birdRect.top - containerRect.top + 20) + 'px';
        
        // Explode in all directions
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        
        // Longer life for death particles
        const life = 1000 + Math.random() * 500;
        
        gameContainer.appendChild(particle);
        
        particles.push({
            element: particle,
            dx: dx,
            dy: dy,
            life: life,
            opacity: 1,
            createdAt: Date.now(),
            isDeath: true
        });
    }
}

function updateParticles() {
    const currentTime = Date.now();
    
    // Create trail particles at regular intervals when bird is moving
    if (currentTime - lastTrailTime > trailFrequency && gameRunning) {
        createTrailParticle();
        lastTrailTime = currentTime;
    }
    
    // Update existing particles
    particles.forEach((particle, index) => {
        const elapsed = currentTime - particle.createdAt;
        
        if (elapsed > particle.life) {
            // Remove expired particles
            particle.element.remove();
            particles.splice(index, 1);
            return;
        }
        
        // Update particle position
        const currentLeft = parseFloat(particle.element.style.left);
        const currentTop = parseFloat(particle.element.style.top);
        
        particle.element.style.left = (currentLeft + particle.dx) + 'px';
        particle.element.style.top = (currentTop + particle.dy) + 'px';
        
        // Add gravity to death particles
        if (particle.isDeath) {
            particle.dy += 0.1;
        }
        
        // Update opacity - fade out
        const lifeRatio = 1 - (elapsed / particle.life);
        const newOpacity = particle.opacity * lifeRatio;
        particle.element.style.opacity = newOpacity;
        
        // For trail particles, also decrease size
        if (particle.isTrail) {
            const size = 6 * lifeRatio;
            particle.element.style.width = size + 'px';
            particle.element.style.height = size + 'px';
        }
    });
}

function startGame() {
    startScreen.style.display = 'none';
    gameStarted = true;
    gameRunning = true;
    score = 0;
    birdPosition = 300;
    birdVelocity = 0;
    pipes = [];
    gameSpeed = 1.5;
    
    // Adjust pipe gap, frequency and gravity based on device
    checkDeviceType();
    
    scoreElement.textContent = score;
    gameOverElement.style.display = 'none';
    document.querySelectorAll('.pipe').forEach(p => p.remove());
    
    // Clear existing particles
    particles.forEach(p => p.element.remove());
    particles = [];
    
    // Initialize clouds
    initClouds();
    
    lastPipeTime = Date.now();
    lastTrailTime = Date.now();
    gameLoop();
}

function restartGame() {
    gameOverElement.style.display = 'none';
    startGame();
}

function gameLoop() {
    if (!gameRunning) return;
    updateBird();
    updatePipes();
    updateParticles();
    updateClouds();
    checkCollisions();
    animationId = requestAnimationFrame(gameLoop);
}

function updateBird() {
    // Get current gravity based on device type
    const currentGravity = isMobile ? 0.3 : 0.5; // Reduced gravity on mobile
    
    birdVelocity += currentGravity;
    birdPosition += birdVelocity;
    bird.style.top = birdPosition + 'px';
    
    // Rotate bird based on velocity
    let rotation = Math.min(Math.max(birdVelocity * 2, -20), 70);
    bird.style.transform = `rotate(${rotation}deg)`;
}

function createPipe() {
    const pipeTop = document.createElement('div');
    const pipeBottom = document.createElement('div');
    pipeTop.className = 'pipe pipe-top';
    pipeBottom.className = 'pipe pipe-bottom';
    
    // Adjust gap position for easier gameplay on mobile
    const minGapPosition = isMobile ? 120 : 100; // Higher min position for mobile
    const gapPositionRange = isMobile ? 150 : 200; // Less variation for mobile
    
    const gapPosition = Math.random() * gapPositionRange + minGapPosition;
    pipeTop.style.height = gapPosition + 'px';
    pipeBottom.style.height = (400 - gapPosition - pipeGap) + 'px';
    pipeTop.style.right = '0px';
    pipeBottom.style.right = '0px';
    gameContainer.appendChild(pipeTop);
    gameContainer.appendChild(pipeBottom);
    pipes.push({ top: pipeTop, bottom: pipeBottom, passed: false });
}

function updatePipes() {
    const currentTime = Date.now();
    // Check if it's time to create a new pipe
    // Use different frequencies for mobile/desktop
    const currentPipeFrequency = isMobile ? 2000 : 1500; // More space between pipes on mobile
    
    if (currentTime - lastPipeTime > currentPipeFrequency) {
        createPipe();
        lastPipeTime = currentTime;
    }

    pipes.forEach(pipe => {
        const currentRight = parseFloat(pipe.top.style.right);
        const newRight = currentRight + gameSpeed;
        pipe.top.style.right = newRight + 'px';
        pipe.bottom.style.right = newRight + 'px';

        const pipeLeft = gameContainer.offsetWidth - newRight - 70;

        if (!pipe.passed && pipeLeft + 70 < 50) {
            score++;
            scoreElement.textContent = score;
            pipe.passed = true;
            playSound('score');
        }

        if (pipeLeft + 70 < 0) {
            pipe.top.remove();
            pipe.bottom.remove();
        }
    });

    pipes = pipes.filter(p => p.top.parentElement != null);
}

function checkCollisions() {
    const birdRect = bird.getBoundingClientRect();
    
    // Check if bird hits the ceiling (top of game container)
    if (birdPosition <= 0) {
        endGame();
        return;
    }
    
    // Check if bird hits pipes or ground
    for (const pipe of pipes) {
        const topRect = pipe.top.getBoundingClientRect();
        const bottomRect = pipe.bottom.getBoundingClientRect();
        if (
            rectsOverlap(birdRect, topRect) ||
            rectsOverlap(birdRect, bottomRect) ||
            birdPosition + bird.offsetHeight >= ground.offsetTop
        ) {
            endGame();
            return;
        }
    }
}

function rectsOverlap(rect1, rect2) {
    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    finalScoreElement.textContent = score;
    
    // Create death particles explosion
    createDeathParticles();
    
    // Continue updating particles for a bit after death
    let deathAnimation = requestAnimationFrame(function animateDeathParticles() {
        updateParticles();
        if (particles.some(p => p.isDeath)) {
            requestAnimationFrame(animateDeathParticles);
        } else {
            // Show game over screen after particles finish
            gameOverElement.style.display = 'block';
        }
    });
    
    playSound('hit');
}

// Check if the user is on a mobile device
function checkDeviceType() {
    isMobile = window.innerWidth <= 768;
    
    // Adjust game parameters for mobile
    if (isMobile) {
        pipeGap = 180; // Wider gap between pipes for mobile
        jumpForce = -9; // Slightly weaker jump (smoother on mobile)
        // gravity is adjusted in updateBird function
    } else {
        pipeGap = 150;
        jumpForce = -10;
    }
}

// Handle window resize for responsive gameplay
window.addEventListener('resize', function() {
    // Adjust game container size for mobile if needed
    adjustForMobile();
    checkDeviceType();
});

// Function to adjust game for mobile devices
function adjustForMobile() {
    // Check if we're on a mobile device
    isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Make game container fit the screen better
        gameContainer.style.width = '100%';
        gameContainer.style.height = '85vh';
        gameContainer.style.maxWidth = '400px';
        gameContainer.style.maxHeight = '600px';
        
        // Adjust controls for easier tapping
        startBtn.style.padding = '20px 40px';
        restartBtn.style.padding = '20px 40px';
    } else {
        // Reset to default for desktop
        gameContainer.style.width = '400px';
        gameContainer.style.height = '600px';
        startBtn.style.padding = '15px 30px';
        restartBtn.style.padding = '12px 25px';
    }
}

// Run mobile adjustments on load
window.addEventListener('load', function() {
    initClouds();
    adjustForMobile();
    checkDeviceType();
});

// Prevent default touch actions on the game container to avoid scrolling
gameContainer.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });
