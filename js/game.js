(function(){
  const GROUND_HEIGHT = 100;
  const OBSTACLE_MIN_INTERVAL = 1.0;
  const OBSTACLE_MAX_INTERVAL = 2.5;
  const birdHeights = [60, 100, 140];

  // Adjust the barrel size here:
  const BARREL_SCALE = 3.0; // Change this value to increase or decrease barrel size

  window.Game = {
    canvas: null,
    ctx: null,
    state: "MENU",
    score: 0,
    highScore: 0,
    lastTime: 0,
    backgroundOffset: 0,
    specialActive: false,
    specialTimer: 0,
    specialBackground: false,
    specialCheckTimer: 0,
    obstacles: [],
    potions: [],
    character: null,
    obstacleTimer: 0,
    nextObstacleTime: 2,
    paused: false,
    baseSpeed: 400,
    backgroundSpeed: 50,
    killMessage: "",
    killMessageBold: "",

    effects: {
      points: { active: false, timeLeft: 0 },
      shield: { active: false, timeLeft: 0 },
      slowmo: { active: false, timeLeft: 0 }
    },

    init: function() {
      this.canvas = document.getElementById("game-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      this.state = "MENU";
      this.score = 0;
      this.lastTime = performance.now();
      this.backgroundOffset = 0;
      this.specialActive = false;
      this.specialTimer = 0;
      this.specialBackground = false;
      this.specialCheckTimer = 0;
      this.obstacles = [];
      this.potions = [];
      this.obstacleTimer = 0;
      this.nextObstacleTime = 2;
      this.paused = false;
      this.killMessage = "";
      this.killMessageBold = "";

      for (let key in this.effects) {
        this.effects[key].active = false;
        this.effects[key].timeLeft = 0;
      }

      this.character = new Character(100, this.canvas.height - GROUND_HEIGHT - 70, 70, 70);

      const savedScore = localStorage.getItem("highScore");
      this.highScore = savedScore ? parseInt(savedScore, 10) : 0;
      UI.updateHighScore(this.highScore);
    },
    
    start: function() {
      this.state = "PLAYING";
      this.score = 0;
      this.killMessage = "";
      this.killMessageBold = "";
      this.lastTime = performance.now();

      const mainSound = Assets.audio.main;
      mainSound.loop = true;
      mainSound.currentTime = 0;
      mainSound.play().catch(() => {});
      requestAnimationFrame(this.gameLoop.bind(this));
    },
    
    gameLoop: function(timestamp) {
      requestAnimationFrame(this.gameLoop.bind(this));
      if(this.paused) return;
      let dt = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;
      if(dt < 0) dt = 0;
      if(this.state === "PLAYING") {
        this.update(dt);
      }
      this.render();
    },
    
    update: function(dt) {
      let scoreRate = this.effects.points.active ? 10 : 5;
      this.score += dt * scoreRate;
      if(this.score > 7000) this.score = 7000;
      if(this.score > this.highScore) {
        this.highScore = Math.floor(this.score);
        UI.updateHighScore(this.highScore);
        localStorage.setItem("highScore", this.highScore);
      }
      UI.updateScore(Math.floor(this.score), 7000);
      
      this.updateEffects(dt);
      
      const speedBonus = Math.floor(this.score / 10);
      let currentSpeed = this.baseSpeed + speedBonus;
      let currentBgSpeed = this.backgroundSpeed + speedBonus * 0.2;
      if(this.effects.slowmo.active) {
        currentSpeed *= 0.5;
        currentBgSpeed *= 0.5;
      }
      this.backgroundOffset += dt * currentBgSpeed;
      
      this.specialCheckTimer += dt;
      if(this.specialCheckTimer >= 10) {
        if(!this.specialActive && Math.random() < 0.1) {
          this.specialActive = true;
          this.specialTimer = 3;
          this.specialBackground = true;
          const specSound = Assets.audio.special;
          specSound.currentTime = 0;
          specSound.play().catch(() => {});
        }
        this.specialCheckTimer = 0;
      }
      if(this.specialActive) {
        this.specialTimer -= dt;
        if(this.specialTimer <= 0) {
          this.specialActive = false;
          this.specialBackground = false;
        }
      }
      
      this.character.update(dt);
      
      this.obstacles.forEach(ob => ob.update(dt, currentSpeed));
      this.obstacles = this.obstacles.filter(ob => ob.x + ob.getHitbox().width > 0);
      
      this.obstacleTimer += dt;
      if(this.obstacleTimer > this.nextObstacleTime) {
        let rand = Math.random();
        if(rand < 0.8) {
          if(Math.random() < 0.5) {
            this.obstacles.push(new Obstacle("cactusGroup", this.canvas.width + 50, this.canvas.height - GROUND_HEIGHT, 1));
          } else {
            this.obstacles.push(new Obstacle("cactus", this.canvas.width + 50, this.canvas.height - GROUND_HEIGHT, 1));
          }
        } else if(rand < 0.9) {
          // Spawn a barrel group; allow 1 or 2 barrels.
          let groupCount = 1 + Math.floor(Math.random() * 2);
          this.obstacles.push(new Obstacle("barrel", this.canvas.width + 50, this.canvas.height - GROUND_HEIGHT, 1, false, groupCount));
        } else {
          let bOffset = birdHeights[Math.floor(Math.random() * birdHeights.length)];
          let floatEffect = Math.random() < 0.5;
          this.obstacles.push(new Obstacle("bird", this.canvas.width + 50, this.canvas.height - GROUND_HEIGHT - bOffset, 1, floatEffect));
        }
        this.obstacleTimer = 0;
        this.nextObstacleTime = OBSTACLE_MIN_INTERVAL + Math.random() * (OBSTACLE_MAX_INTERVAL - OBSTACLE_MIN_INTERVAL);
      }
      
      if(Math.floor(this.score) >= 100 && Math.random() < 0.0005) {
        const potionTypes = ["points", "shield", "slowmo"];
        const type = potionTypes[Math.floor(Math.random() * potionTypes.length)];
        const px = this.canvas.width + 50;
        const py = this.canvas.height - GROUND_HEIGHT - 70;
        let tooClose = this.potions.some(pt => Math.abs(pt.x - px) < 100);
        if(!tooClose) {
          this.potions.push(new Potion(type, px, py));
        }
      }
      
      this.potions.forEach(pt => pt.update(dt, currentSpeed));
      this.potions = this.potions.filter(pt => pt.x + pt.getHitbox().width > 0);
      
      for(let ob of this.obstacles) {
        if(collides(this.character.getHitbox(), ob.getHitbox())) {
          if(!this.effects.shield.active) {
            if(ob.type === "cactus" || ob.type === "cactusGroup") {
              this.killMessage = "Killed by ";
              this.killMessageBold = "Cactus";
            } else if(ob.type === "barrel") {
              this.killMessage = "Killed by ";
              this.killMessageBold = "Barrel";
            } else if(ob.type === "bird") {
              this.killMessage = "Killed by a ";
              this.killMessageBold = ob.floatEffect ? "oscillating Bird" : "Bird";
            }
            this.gameOver();
            break;
          }
        }
      }
      
      for(let i = 0; i < this.potions.length; i++) {
        let pt = this.potions[i];
        if(collides(this.character.getHitbox(), pt.getHitbox())) {
          this.takePotion(pt.type);
          Assets.audio.take.currentTime = 0;
          Assets.audio.take.play().catch(() => {});
          this.potions.splice(i, 1);
          i--;
          showNotification(
            pt.type === "points" ? "Double Points Obtained!" :
            pt.type === "slowmo" ? "Slow Motion Obtained!" :
            pt.type === "shield" ? "Invincible Obtained!" : ""
          );
        }
      }
    },
    
    render: function() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      const fullW = this.canvas.width;
      let offsetX = this.backgroundOffset % fullW;
      let currIndex = (Math.floor(this.backgroundOffset / fullW) % 8) + 1;
      let nextIndex = ((Math.floor(this.backgroundOffset / fullW) + 1) % 8) + 1;
      let currBg = Assets.images.backgrounds[currIndex.toString()];
      let nextBg = Assets.images.backgrounds[nextIndex.toString()];
      if(this.specialActive && this.specialBackground) {
        currBg = Assets.images.backgrounds["99"];
        nextBg = Assets.images.backgrounds["99"];
      }
      this.ctx.drawImage(currBg, -offsetX, 0, fullW, this.canvas.height);
      this.ctx.drawImage(nextBg, fullW - offsetX, 0, fullW, this.canvas.height);
      
      let landY = this.canvas.height - GROUND_HEIGHT;
      this.ctx.fillStyle = "#443322";
      this.ctx.fillRect(0, landY, this.canvas.width, GROUND_HEIGHT);
      
      this.obstacles.forEach(ob => ob.render(this.ctx));
      this.potions.forEach(pt => {
        let floatOffset = 5 * Math.sin(performance.now()/500);
        this.ctx.save();
        this.ctx.globalAlpha = 0.9;
        pt.render(this.ctx);
        this.ctx.beginPath();
        this.ctx.arc(pt.x + 20, pt.y + 20 + floatOffset, 10, 0, 2 * Math.PI);
        this.ctx.fillStyle = "rgba(255,255,255,0.6)";
        this.ctx.fill();
        this.ctx.restore();
      });
      
      this.character.render(this.ctx);
      
      if(this.state === "GAMEOVER") {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "40px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Game Over", this.canvas.width/2, this.canvas.height/2 - 60);
        this.ctx.font = "24px sans-serif";
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText("Killed by", this.canvas.width/2, this.canvas.height/2 - 20);
        this.ctx.fillStyle = "red";
        this.ctx.font = "bold 24px sans-serif";
        this.ctx.fillText(this.killMessageBold, this.canvas.width/2, this.canvas.height/2 + 10);
        this.ctx.font = "20px sans-serif";
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText("Press SPACE / UP / DOWN or CLICK to restart",
                          this.canvas.width/2,
                          this.canvas.height/2 + 60);
      }
    },
    
    gameOver: function() {
      this.state = "GAMEOVER";
      this.character.state = "dead";
      Assets.audio.main.pause();
      this.render();
      const restartHandler = (e) => {
        let allowRestart = false;
        if(e.type === "keydown") {
          if(e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown") {
            allowRestart = true;
          }
        }
        if(e.type === "mousedown" || e.type === "touchstart") {
          allowRestart = true;
        }
        if(allowRestart) {
          window.removeEventListener("keydown", restartHandler);
          window.removeEventListener("mousedown", restartHandler);
          window.removeEventListener("touchstart", restartHandler);
          this.init();
          this.start();
        }
      };
      window.addEventListener("keydown", restartHandler);
      window.addEventListener("mousedown", restartHandler);
      window.addEventListener("touchstart", restartHandler);
    },
    
    updateEffects: function(dt) {
      for(let key in this.effects) {
        let ef = this.effects[key];
        if(ef.active) {
          ef.timeLeft -= dt;
          if(ef.timeLeft <= 0) {
            ef.active = false;
            ef.timeLeft = 0;
          }
        }
      }
      UI.updatePotionEffects(this.effects);
    },
    
    takePotion: function(type) {
      if(type === "points") {
        this.effects.points.active = true;
        this.effects.points.timeLeft = 10;
      } else if(type === "shield") {
        this.effects.shield.active = true;
        this.effects.shield.timeLeft = 7;
        Assets.audio.shield.currentTime = 0;
        Assets.audio.shield.play().catch(() => {});
      } else if(type === "slowmo") {
        this.effects.slowmo.active = true;
        this.effects.slowmo.timeLeft = 10;
        Assets.audio.slowmo.currentTime = 0;
        Assets.audio.slowmo.play().catch(() => {});
      }
    }
  };

  document.addEventListener("visibilitychange", () => {
    if(document.hidden) {
      Game.paused = true;
      Assets.audio.main.pause();
    } else {
      Game.paused = false;
      if(Game.state === "PLAYING") {
        Game.lastTime = performance.now();
        Assets.audio.main.play().catch(() => {});
      }
    }
  });

  function collides(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  class Character {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.velocityY = 0;
      this.gravity = 1700;
      this.jumpStrength = -800;
      this.onGround = true;
      this.state = "run";
      this.rotation = 0;
      this.spinSpeed = 360;
    }
    update(dt) {
      if(this.state === "dead") return;
      
      // Normal jump initiation (if jump key is pressed and on ground)
      if(window.Input.up && this.onGround) {
        this.velocityY = this.jumpStrength;
        this.onGround = false;
        this.state = "jump";
        Assets.audio.jump.currentTime = 0;
        Assets.audio.jump.play().catch(() => {});
      }
      
      // Apply gravity scaled by slowmo effect.
      let slowFactor = Game.effects.slowmo.active ? 0.5 : 1;
      if(!this.onGround) {
        this.velocityY += this.gravity * dt * slowFactor;
        this.y += this.velocityY * dt * slowFactor;
      }
      
      // Ducking: if down pressed while on ground.
      if(window.Input.down && this.onGround && !window.Input.up) {
        this.state = "duck";
      } else if(this.onGround) {
        this.state = "run";
      }
      
      // Clamp to ground.
      let groundY = Game.canvas.height - 100 - this.height;
      if(this.y >= groundY) {
        this.y = groundY;
        this.velocityY = 0;
        this.onGround = true;
        this.state = "run";
      }
      this.rotation += this.spinSpeed * dt;
    }
    render(ctx) {
      ctx.save();
      ctx.translate(this.x + this.width/2, this.y + this.height/2);
      ctx.rotate(this.rotation * Math.PI/180);
      let img;
      if(this.state === "jump") {
        img = Assets.images.character["2"];
      } else if(this.state === "dead") {
        img = Assets.images.character["3"];
      } else if(this.state === "duck") {
        img = Assets.images.character["1"];
      } else {
        img = Assets.images.character["1"];
      }
      let scaleFactor = 0.8;  // Always use 0.8
      let drawW = this.width * scaleFactor;
      let drawH = this.height * scaleFactor;
      ctx.drawImage(img, -drawW/2, -drawH/2, drawW, drawH);
      ctx.restore();
    }
    getHitbox() {
      let scaleFactor = 0.8;  // Always 0.8
      let hitW = this.width * scaleFactor;
      let hitH = this.height * scaleFactor;
      return {
        x: this.x + (this.width - hitW) / 2,
        y: this.y + (this.height - hitH) / 2,
        width: hitW,
        height: hitH
      };
    }
  }

  class Obstacle {
    constructor(type, x, y, scale = 1, floatEffect = false, groupCount) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.scale = scale;
      this.floatEffect = floatEffect || false;
      this.floatTimer = 0;
      // For barrels, use BARREL_SCALE and allow grouping (default groupCount = 1)
      if(this.type === "barrel") {
        this.fixedScale = BARREL_SCALE;
        this.groupCount = groupCount || 1;
      }
      if(this.type === "bird") {
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 0.1;
        this.frameCount = 6;
        if(this.floatEffect) {
          this.oscAmp = 10 + Math.random() * 10; // amplitude between 10 and 20
          this.oscFreq = 2 + Math.random() * 2;    // frequency between 2 and 4
        }
      } else if(this.type === "cactusGroup") {
        this.groupSize = 2 + Math.floor(Math.random() * 2);
        this.cactiScale = 0.1 + Math.random() * 0.1;
      } else if(this.type === "cactus") {
        this.singleScale = 0.1 + Math.random() * 0.1;
      }
    }
    update(dt, speed) {
      this.x -= speed * dt;
      if(this.type === "bird") {
        this.frameTimer += dt;
        if(this.frameTimer > this.frameInterval) {
          this.frame = (this.frame + 1) % this.frameCount;
          this.frameTimer = 0;
        }
        if(this.floatEffect) {
          this.floatTimer += dt;
          let delta = this.oscAmp * Math.sin(this.floatTimer * this.oscFreq);
          this.y += delta;
          // Occasionally move slightly backward horizontally.
          if(Math.random() < 0.1) {
            this.x -= 2 * dt;
          }
          let groundLimit = Game.canvas.height - GROUND_HEIGHT - 20;
          if(this.y > groundLimit) {
            this.y = groundLimit;
          }
        }
      }
    }
    render(ctx) {
      if(this.type === "bird") {
        let img = Assets.images.obstacles["bird"];
        let frameWidth = img.width / 6;
        ctx.drawImage(
          img,
          this.frame * frameWidth, 0, frameWidth, img.height,
          this.x, this.y, frameWidth * this.scale, img.height * this.scale
        );
        if(this.floatEffect) {
          ctx.save();
          ctx.strokeStyle = "yellow";
          ctx.lineWidth = 2;
          ctx.strokeRect(this.x, this.y, frameWidth * this.scale, img.height * this.scale);
          ctx.restore();
        }
      } else if(this.type === "cactusGroup") {
        let img = Assets.images.obstacles["cactus"];
        for(let i = 0; i < this.groupSize; i++){
          let offsetX = this.x + i * (img.width * this.cactiScale);
          let actualY = this.y - (img.height * this.cactiScale);
          ctx.drawImage(img, offsetX, actualY, img.width * this.cactiScale, img.height * this.cactiScale);
        }
      } else if(this.type === "cactus") {
        let img = Assets.images.obstacles["cactus"];
        let actualY = this.y - (img.height * this.singleScale);
        ctx.drawImage(img, this.x, actualY, img.width * this.singleScale, img.height * this.singleScale);
      } else if(this.type === "barrel") {
        let img = Assets.images.obstacles["barrel"];
        if(this.groupCount > 1) {
          for(let i = 0; i < this.groupCount; i++){
            let offsetX = this.x + i * (img.width * this.fixedScale + 10);
            ctx.drawImage(img, offsetX, this.y - (img.height * this.fixedScale), img.width * this.fixedScale, img.height * this.fixedScale);
          }
        } else {
          ctx.drawImage(img, this.x, this.y - (img.height * this.fixedScale), img.width * this.fixedScale, img.height * this.fixedScale);
        }
      }
    }
    getHitbox() {
      if(this.type === "bird") {
        let img = Assets.images.obstacles["bird"];
        let frameWidth = img.width/6;
        let w = frameWidth * this.scale;
        let h = img.height * this.scale;
        return { x: this.x, y: this.y, width: w * 0.8, height: h * 0.8 };
      } else if(this.type === "cactusGroup") {
        let img = Assets.images.obstacles["cactus"];
        let totalWidth = this.groupSize * (img.width * this.cactiScale);
        let cactusHeight = img.height * this.cactiScale;
        return { x: this.x, y: this.y - cactusHeight, width: totalWidth * 0.8, height: cactusHeight * 0.8 };
      } else if(this.type === "cactus") {
        let img = Assets.images.obstacles["cactus"];
        let w = img.width * this.singleScale;
        let h = img.height * this.singleScale;
        return { x: this.x, y: this.y - h, width: w * 0.8, height: h * 0.8 };
      } else if(this.type === "barrel") {
        let img = Assets.images.obstacles["barrel"];
        return { x: this.x, y: this.y - (img.height * this.fixedScale), width: img.width * this.fixedScale, height: img.height * this.fixedScale };
      }
    }
  }

  class Potion {
    constructor(type, x, y) {
      this.type = type;
      this.x = x;
      this.y = y;
    }
    update(dt, speed) {
      this.x -= speed * dt;
    }
    render(ctx) {
      let img = Assets.images.potions[this.type];
      let floatOffset = 5 * Math.sin(performance.now() / 500);
      ctx.drawImage(img, this.x, this.y + floatOffset);
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(this.x + img.width / 2, this.y + img.height / 2 + floatOffset, 10, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fill();
      ctx.restore();
    }
    getHitbox() {
      let img = Assets.images.potions[this.type];
      return { x: this.x, y: this.y, width: img.width * 0.8, height: img.height * 0.8 };
    }
  }
})();
