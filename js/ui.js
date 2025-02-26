(function(){
    window.UI = {
      updateScore: function(score, maxScore) {
        document.getElementById("score").innerText = "Score: " + score + "/" + maxScore;
      },
      updateHighScore: function(highScore) {
        document.getElementById("highscore").innerText = "High Score: " + highScore;
      },
      updatePotionEffects: function(effects) {
        let lines = [];
        if(effects.points.active) {
          lines.push("Double Points: " + effects.points.timeLeft.toFixed(1) + "s");
        }
        if(effects.slowmo.active) {
          lines.push("Slow Motion: " + effects.slowmo.timeLeft.toFixed(1) + "s");
        }
        if(effects.shield.active) {
          lines.push("Invincible: " + effects.shield.timeLeft.toFixed(1) + "s");
        }
        const timerEl = document.getElementById("potion-timer");
        if(lines.length > 0) {
          timerEl.style.display = "block";
          timerEl.innerText = lines.join(" | ");
          let blink = Object.values(effects).some(e => e.active && e.timeLeft < 3);
          timerEl.classList.toggle("blinking", blink);
        } else {
          timerEl.style.display = "none";
          timerEl.classList.remove("blinking");
        }
      }
    };
  })();
  