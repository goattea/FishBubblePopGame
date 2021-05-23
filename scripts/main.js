// canvas setup
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 500;

let score = 0;
let gameFrame = 0;

ctx.font = '50px Georgia';

// mouse interactivity
let canvasPosition = canvas.getBoundingClientRect();
const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    click: false
}

canvas.addEventListener('mousedown', (event) => {
    mouse.click = true;
    mouse.x = event.x - Number.parseInt(canvasPosition.left, 10);
    mouse.y = event.y - Number.parseInt(canvasPosition.top, 10);
});

canvas.addEventListener('mouseup', () => {
    mouse.click = false;
});

// animation sprites
class Sprite {
    constructor(frameCount, imageSrc, cols, rows, width, height) {
        this.frameCount = frameCount;
        this.image = new Image();
        this.image.src = imageSrc;
        this.cols = cols;
        this.rows = rows;
        this.height = height;
        this.width = width;
        this.frames = this.calculateFrameLocations();
    }

    calculateFrameLocations() {
        let frames = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                frames.push({ x: x * this.width, y: y * this.height });
            }
        }
        return frames;
    }
}

let sprites = [];
sprites['player-left'] = new Sprite(12, '/assets/images/player-swim-left.png', 4, 3, 498, 327);
sprites['player-right'] = new Sprite(12, '/assets/images/player-swim-right.png', 4, 3, 498, 327);
sprites['bubble-float'] = new Sprite(1, '/assets/images/bubble-pop-under-water.png', 1, 1, 422, 534);
sprites['bubble-pop'] = new Sprite(7, '/assets/images/bubble-pop-under-water.png', 4, 2, 422, 534);

sprites['player-right'].frames.sort((a, b) => { return a.y === b.y ? b.x - a.x : a.y - b.y; });
sprites['bubble-pop'].frames.splice(0, 1);


// Player
class Player {
    constructor() {
        this.x = canvas.width;
        this.y = canvas.height / 2;
        this.radius = 50;
        this.angle = 0;
        this.frame = 0;
        this.frameRate = 10;
        this.speed = 20;
        this.spriteName = 'player-left';
    }

    update() {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        // calculates theta to get player angle
        this.angle = Math.atan2(dy, dx);

        if (mouse.x !== this.x) {
            this.x -= dx / this.speed;
        }

        if (mouse.y !== this.y) {
            this.y -= dy / this.speed;
        }
    }

    draw() {
        this.spriteName = (this.x >= mouse.x) ? 'player-left' : 'player-right';
        const sprite = sprites[this.spriteName];

        this.frame++;
        let position = Math.floor(this.frame / this.frameRate) % sprite.frameCount;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(
            sprite.image,
            sprite.frames[position].x,
            sprite.frames[position].y,
            sprite.width,
            sprite.height,
            0 - 60,
            0 - 45,
            sprite.width / 4,
            sprite.height / 4
        );
        ctx.restore();
    }
}

const player = new Player();

// bubbles
const bubbles = [];

const bubblePop1 = document.createElement('audio');
bubblePop1.src = 'assets/sounds/bubbles-single1.wav';
const bubblePop2 = document.createElement('audio');
bubblePop2.src = 'assets/sounds/bubbles-single2.wav';

class Bubble {
    constructor() {
        this.radius = 50;
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + this.radius * 2;
        this.speed = Math.random() * 5 + 1;
        this.distance;
        this.scored = false;
        this.popping = false;
        this.sound = Math.random() < 0.5 ? bubblePop1 : bubblePop2;
        this.floatSprite = 'bubble-float';
        this.popSprite = 'bubble-pop';
        this.frame = 0;
        this.frameRate = 5;
    }

    update() {
        this.y -= this.speed;
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        // use pythogorean therom to get distance (a^2 + b^2 = c^2)
        this.distance = Math.sqrt(dx * dx + dy * dy);
    }

    draw() {
        const sprite = this.popping ? sprites[this.popSprite] : sprites[this.floatSprite];
        this.frame++;
        let position = Math.floor(this.frame / this.frameRate) % sprite.frameCount;
        
        if(this.popping && position === sprite.frameCount - 1) {
            this.popping = false;
        }

        ctx.drawImage(
            sprite.image,
            sprite.frames[position].x,
            sprite.frames[position].y,
            sprite.width,
            sprite.height,
            this.x - 52,
            this.y - 82,
            sprite.width / 3.8,
            sprite.height / 3.8
        );
    }
}


function handleBubbles() {
    const bubbleRate = 50;
    const maxBubbles = 50;
    if (gameFrame % bubbleRate === 0 && bubbles.length < maxBubbles) {
        bubbles.push(new Bubble());
    }

    for (let i = 0; i < bubbles.length; i++) {
        // if the bubble has been scored or is off screen
        const isOffScreen = bubbles[i].y < -1 * (bubbles[i].radius * 2);
        const isPopped = bubbles[i].scored && !bubbles[i].popping; 
        if (isPopped || isOffScreen) {
            bubbles.splice(i, 1);
        }
    }

    for (let i = 0; i < bubbles.length; i++) {
        bubbles[i].update();
        bubbles[i].draw();

        // if the bubble hasn't been scored and collides with player
        if (!bubbles[i].scored && bubbles[i].distance < bubbles[i].radius + player.radius) {
            bubbles[i].sound.play();
            bubbles[i].scored = true;
            bubbles[i].popping = true;
            bubbles[i].frame = 0;
            score++;
        }
    }


}

//animation loop

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'green';
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
    ctx.stroke();

    player.update();
    player.draw();
    handleBubbles();
    ctx.fillStyle = 'black';
    ctx.fillText(`score: ${score}`, 10, 50);
    gameFrame++;
    requestAnimationFrame(animate);
}

animate();