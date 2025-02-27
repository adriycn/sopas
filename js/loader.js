(function() {
  const assetList = {
    images: {
      menu: [
        "menu/1.png",
        "menu/2.png",
        "menu/3.png"
      ],
      backgrounds: [
        "Sprite/backgrounds/1.png",
        "Sprite/backgrounds/2.png",
        "Sprite/backgrounds/3.png",
        "Sprite/backgrounds/4.png",
        "Sprite/backgrounds/5.png",
        "Sprite/backgrounds/6.png",
        "Sprite/backgrounds/7.png",
        "Sprite/backgrounds/8.png",
        "Sprite/backgrounds/99.jpg"
      ],
      land: [
        "Sprite/backgrounds/land.png"
      ],
      character: [
        "Sprite/character/1.png",
        "Sprite/character/2.png",
        "Sprite/character/3.png",
        "Sprite/character/99.png"
      ],
      obstacles: [
        "Sprite/obstacles/cactus.png",
        "Sprite/obstacles/bird.png",
        "Sprite/obstacles/barrel.png"
      ],
      potions: [
        "Sprite/potions/points.png",
        "Sprite/potions/shield.png",
        "Sprite/potions/slowmo.png"
      ]
    },
    audio: {
      main: "Sounds/1.mp3",
      points: "Sounds/points.mp3",
      shield: "Sounds/shield.mp3",
      slowmo: "Sounds/slowmo.mp3",
      special: "Sounds/99.mp3",
      jump: "Sounds/jump.mp3",
      take: "Sounds/take.mp3"
    }
  };

  let totalAssets = 0;
  let loadedAssets = 0;
  const minLoadingTime = 2000;
  const loadingStartTime = Date.now();

  window.Assets = { images: {}, audio: {} };

  function countAssets() {
    let count = 0;
    for (let cat in assetList.images) {
      count += assetList.images[cat].length;
    }
    for (let key in assetList.audio) { count++; }
    return count;
  }
  totalAssets = countAssets();

  function updateLoadingBar() {
    const progress = loadedAssets / totalAssets;
    document.getElementById("loading-text").style.width = (progress * 100) + "%";
  }

  function assetLoaded() {
    loadedAssets++;
    updateLoadingBar();
    if (loadedAssets >= totalAssets) {
      const elapsed = Date.now() - loadingStartTime;
      const delay = Math.max(0, minLoadingTime - elapsed);
      setTimeout(() => {
        document.getElementById("loading-screen").style.display = "none";
        document.getElementById("game-container").style.display = "block";
        if (window.startGame) window.startGame();
      }, delay);
    }
  }

  for (let category in assetList.images) {
    window.Assets.images[category] = {};
    assetList.images[category].forEach(src => {
      let img = new Image();
      img.src = src;
      img.onload = assetLoaded;
      img.onerror = assetLoaded;
      let key = src.split("/").pop().split(".")[0];
      window.Assets.images[category][key] = img;
    });
  }

  for (let key in assetList.audio) {
    let audio = new Audio();
    audio.src = assetList.audio[key];
    audio.onloadeddata = assetLoaded;
    audio.onerror = assetLoaded;
    window.Assets.audio[key] = audio;
  }
})();
