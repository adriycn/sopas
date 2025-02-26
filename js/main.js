(function(){
    // Global mouse position for menu hover effects
    let mouseX = 0, mouseY = 0;
    const canvas = document.getElementById("game-canvas");
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    
    // Notification function for potion pickups
    function showNotification(text) {
      const notif = document.getElementById("notification");
      notif.innerText = text;
      notif.style.opacity = 1;
      setTimeout(() => {
        notif.style.opacity = 0;
      }, 5000);
    }
    window.showNotification = showNotification;
    
    window.startGame = function() {
      Game.init();
      Game.state = "MENU";
      
      // For mobile: show mobile controls only on small screens
      if("ontouchstart" in window) {
        document.getElementById("mobile-controls").style.display = "block";
      }
      
      function renderMenu() {
        if(Game.state !== "MENU") return;
        Game.ctx.clearRect(0, 0, Game.canvas.width, Game.canvas.height);
  
        // Background: continuous scroll without black flash
        const fullW = Game.canvas.width;
        let offsetX = Game.backgroundOffset % fullW;
        let currIndex = (Math.floor(Game.backgroundOffset / fullW) % 8) + 1;
        let nextIndex = ((Math.floor(Game.backgroundOffset / fullW) + 1) % 8) + 1;
        let currBg = Assets.images.backgrounds[currIndex.toString()];
        let nextBg = Assets.images.backgrounds[nextIndex.toString()];
        Game.ctx.drawImage(currBg, -offsetX, 0, fullW, Game.canvas.height);
        Game.ctx.drawImage(nextBg, fullW - offsetX, 0, fullW, Game.canvas.height);
  
        // Land as brown rectangle
        let landY = Game.canvas.height - 100;
        Game.ctx.fillStyle = "#443322";
        Game.ctx.fillRect(0, landY, Game.canvas.width, 100);
  
        // Animated title with outline near play button
        const timeNow = performance.now() / 1000;
        const titleScale = 1 + 0.05 * Math.sin(timeNow * 1.5);
        Game.ctx.save();
        Game.ctx.translate(Game.canvas.width/2, Game.canvas.height/2 - 150);
        Game.ctx.scale(titleScale, titleScale);
        Game.ctx.font = "60px Impact";
        Game.ctx.textAlign = "center";
        Game.ctx.fillStyle = "#fff";
        Game.ctx.lineWidth = 3;
        Game.ctx.strokeStyle = "#000";
        Game.ctx.strokeText("Sopas", 0, 0);
        Game.ctx.fillText("Sopas", 0, 0);
        Game.ctx.restore();
        
        // Watermark below title
        Game.ctx.font = "16px sans-serif";
        Game.ctx.fillStyle = "#ccc";
        Game.ctx.textAlign = "center";
        Game.ctx.fillText("© Adrian", Game.canvas.width/2, Game.canvas.height/2 - 110);
  
        // Menu buttons with hover effects
        const btnWidth = 200, btnHeight = 100;
        let playX = Game.canvas.width/2 - btnWidth/2;
        let playY = Game.canvas.height/2 - btnHeight/2;
        let storeX = Game.canvas.width/2 - btnWidth/2;
        let storeY = playY + btnHeight + 20;
        let adminX = Game.canvas.width - btnWidth - 20;
        let adminY = Game.canvas.height - btnHeight - 20;
        
        let playHover = (mouseX >= playX && mouseX <= playX+btnWidth && mouseY >= playY && mouseY <= playY+btnHeight);
        let storeHover = (mouseX >= storeX && mouseX <= storeX+btnWidth && mouseY >= storeY && mouseY <= storeY+btnHeight);
        let adminHover = (mouseX >= adminX && mouseX <= adminX+btnWidth && mouseY >= adminY && mouseY <= adminY+btnHeight);
        if(playHover || storeHover || adminHover) {
          canvas.style.cursor = "pointer";
        } else {
          canvas.style.cursor = "default";
        }
        
        if(playHover) {
          Game.ctx.save();
          Game.ctx.translate(playX+btnWidth/2, playY+btnHeight/2);
          Game.ctx.rotate(-0.05);
          Game.ctx.drawImage(Assets.images.menu["1"], -btnWidth/2, -btnHeight/2, btnWidth, btnHeight);
          Game.ctx.restore();
        } else {
          Game.ctx.drawImage(Assets.images.menu["1"], playX, playY, btnWidth, btnHeight);
        }
        
        if(storeHover) {
          Game.ctx.save();
          Game.ctx.translate(storeX+btnWidth/2, storeY+btnHeight/2);
          Game.ctx.rotate(0.05);
          Game.ctx.drawImage(Assets.images.menu["2"], -btnWidth/2, -btnHeight/2, btnWidth, btnHeight);
          Game.ctx.restore();
        } else {
          Game.ctx.drawImage(Assets.images.menu["2"], storeX, storeY, btnWidth, btnHeight);
        }
        
        if(adminHover) {
          Game.ctx.save();
          Game.ctx.translate(adminX+btnWidth/2, adminY+btnHeight/2);
          Game.ctx.rotate(0.05);
          Game.ctx.drawImage(Assets.images.menu["3"], -btnWidth/2, -btnHeight/2, btnWidth, btnHeight);
          Game.ctx.restore();
        } else {
          Game.ctx.drawImage(Assets.images.menu["3"], adminX, adminY, btnWidth, btnHeight);
        }
        
        Game.backgroundOffset += 0.5;
        requestAnimationFrame(renderMenu);
      }
      renderMenu();
  
      Game.canvas.addEventListener("click", function(e) {
        if(Game.state !== "MENU") return;
        const rect = Game.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const btnWidth = 200, btnHeight = 100;
        const playX = Game.canvas.width/2 - btnWidth/2;
        const playY = Game.canvas.height/2 - btnHeight/2;
        const storeX = Game.canvas.width/2 - btnWidth/2;
        const storeY = playY + btnHeight + 20;
        const adminX = Game.canvas.width - btnWidth - 20;
        const adminY = Game.canvas.height - btnHeight - 20;
        
        if(x > playX && x < playX+btnWidth && y > playY && y < playY+btnHeight) {
          Game.start();
        }
        else if(x > storeX && x < storeX+btnWidth && y > storeY && y < storeY+btnHeight) {
          document.getElementById("store-overlay").style.display = "flex";
        }
        else if(x > adminX && x < adminX+btnWidth && y > adminY && y < adminY+btnHeight) {
          const password = prompt("Enter admin password:");
          if(password === "yourPasswordHere") {
            alert("Admin access granted!");
          } else {
            alert("Incorrect password!");
          }
        }
      });
      
      document.getElementById("store-close").addEventListener("click", function() {
        document.getElementById("store-overlay").style.display = "none";
      });
    };
  })();
  