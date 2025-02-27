document.addEventListener("DOMContentLoaded", function() {
  window.Input = {
    up: false,
    down: false
  };

  function keyDownHandler(e) {
    if (e.code === "ArrowUp" || e.code === "Space") {
      window.Input.up = true;
      e.preventDefault();
    }
    if (e.code === "ArrowDown") {
      window.Input.down = true;
      e.preventDefault();
    }
  }
  function keyUpHandler(e) {
    if (e.code === "ArrowUp" || e.code === "Space") {
      window.Input.up = false;
      e.preventDefault();
    }
    if (e.code === "ArrowDown") {
      window.Input.down = false;
      e.preventDefault();
    }
  }

  window.addEventListener("keydown", keyDownHandler, false);
  window.addEventListener("keyup", keyUpHandler, false);

  const jumpBtn = document.getElementById("jump-btn");
  if(jumpBtn) {
    jumpBtn.addEventListener("touchstart", function(e) {
      window.Input.up = true;
      e.preventDefault();
    }, false);
    jumpBtn.addEventListener("touchend", function(e) {
      window.Input.up = false;
      e.preventDefault();
    }, false);
    jumpBtn.addEventListener("pointerdown", function(e) {
      window.Input.up = true;
      e.preventDefault();
    }, false);
    jumpBtn.addEventListener("pointerup", function(e) {
      window.Input.up = false;
      e.preventDefault();
    }, false);
  } else {
    console.error("Jump button not found");
  }
});
