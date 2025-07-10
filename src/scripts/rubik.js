import * as THREE from "three";

class RenaissanceCodingCube {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.width = this.container.clientWidth;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.rubikGroup = new THREE.Group();
    this.animationId = null;

    // Constants
    this.CUBE_SIZE = 3;
    this.SPACING = 1.1;
    this.TEXTURE_SIZE = 256;
    this.ANIMATION_SPEED = 0.0008;
    this.PULSE_AMPLITUDE = 0.4;
    this.TEXT_UPDATE_INTERVAL = 300;

    // Renaissance coding color palette
    this.RENAISSANCE_COLORS = {
      gold: "#D4AF37",
      deepRed: "#8B0000",
      richBlue: "#191970",
      emerald: "#50C878",
      burgundy: "#800020",
      bronze: "#CD7F32",
      ivory: "#FFFFF0",
      crimson: "#DC143C",
      parchment: "#F5F5DC",
      inkBlue: "#2F4F4F",
      copperGreen: "#7CB342",
      darkGold: "#B8860B",
      rust: "#B7410E",
      sage: "#87A96B",
    };

    // Renaissance coding themes
    this.CODING_THEMES = {
      code: {
        symbols: [
          "{}",
          "[]",
          "()",
          "<>",
          "&&",
          "||",
          "==",
          "!=",
          "++",
          "--",
          "->",
          "=>",
          "??",
          "::",
        ],
        colors: ["gold", "emerald", "richBlue", "bronze"],
      },
      math: {
        symbols: [
          "∫",
          "∑",
          "∏",
          "∆",
          "∇",
          "∞",
          "≈",
          "≠",
          "±",
          "√",
          "∂",
          "∀",
          "∃",
          "∈",
        ],
        colors: ["deepRed", "burgundy", "bronze", "gold"],
      },
      symbols: {
        symbols: [
          "⚡",
          "⚙",
          "⚛",
          "⚜",
          "❋",
          "❈",
          "✧",
          "◊",
          "※",
          "⁂",
          "☙",
          "❖",
          "✦",
          "♠",
        ],
        colors: ["crimson", "gold", "emerald", "bronze"],
      },
      alchemy: {
        symbols: [
          "☿",
          "♃",
          "♄",
          "♀",
          "♂",
          "☉",
          "☽",
          "🜀",
          "🜁",
          "🜂",
          "🜃",
          "🜄",
          "△",
          "▽",
        ],
        colors: ["copperGreen", "burgundy", "gold", "deepRed"],
      },
      geometry: {
        symbols: [
          "◯",
          "△",
          "□",
          "◇",
          "⬟",
          "⬢",
          "⬡",
          "⬠",
          "⬣",
          "⬤",
          "⬥",
          "⬦",
          "⬧",
          "⬨",
        ],
        colors: ["darkGold", "rust", "sage", "bronze"],
      },
      manuscript: {
        symbols: [
          "℧",
          "℩",
          "℈",
          "℞",
          "℟",
          "℠",
          "℡",
          "™",
          "℣",
          "ℤ",
          "℥",
          "Ω",
          "℧",
          "℩",
        ],
        colors: ["inkBlue", "burgundy", "bronze", "deepRed"],
      },
    };

    this.currentTheme = options.theme || "code";
    this.singleCharConfig =
      options.singleCharConfig || this.getDefaultSingleCharConfig();

    this.init();
  }

  init() {
    this.setupCamera();
    this.setupRenderer();
    this.createRubikCube();
    this.setupLighting();
    this.setupEventListeners();
    this.animate();
  }

  setupCamera() {
    this.camera.position.z = 8;
  }

  setupRenderer() {
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(this.width, this.width);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  getDefaultSingleCharConfig() {
    const theme = this.CODING_THEMES[this.currentTheme];
    return {
      front: { position: [1, 1, 2], char: theme.symbols[0] },
      back: { position: [1, 1, 0], char: theme.symbols[1] },
      left: { position: [0, 1, 1], char: theme.symbols[2] },
      right: { position: [2, 1, 1], char: theme.symbols[3] },
      top: { position: [1, 2, 1], char: theme.symbols[4] },
      bottom: { position: [1, 0, 1], char: theme.symbols[5] },
    };
  }

  // Public methods for theme management
  setTheme(themeName) {
    if (this.CODING_THEMES[themeName]) {
      this.currentTheme = themeName;
      this.singleCharConfig = this.getDefaultSingleCharConfig();
      this.recreateRubikCube();
    }
  }

  getAvailableThemes() {
    return Object.keys(this.CODING_THEMES);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  updateSingleCharConfig(newConfig) {
    this.singleCharConfig = { ...this.singleCharConfig, ...newConfig };
    this.recreateRubikCube();
  }

  setFaceCharacter(face, char) {
    if (this.singleCharConfig[face]) {
      this.singleCharConfig[face].char = char;
      this.recreateRubikCube();
    }
  }

  setFacePosition(face, x, y, z) {
    if (this.singleCharConfig[face]) {
      this.singleCharConfig[face].position = [x, y, z];
      this.recreateRubikCube();
    }
  }

  recreateRubikCube() {
    this.rubikGroup.children.forEach((cube) => {
      if (cube.userData.textureUpdateTimer) {
        clearInterval(cube.userData.textureUpdateTimer);
      }
    });
    this.rubikGroup.clear();
    this.createRubikCube();
  }

  setupLighting() {
    // Warm Renaissance lighting
    const ambientLight = new THREE.AmbientLight(0xffd700, 0.4);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;

    // Warm rim lighting like candle light
    const rimLight = new THREE.DirectionalLight(0xcd7f32, 0.3);
    rimLight.position.set(-5, 5, -5);

    // Subtle fill light
    const fillLight = new THREE.DirectionalLight(0xffd700, 0.2);
    fillLight.position.set(0, -5, 0);

    this.scene.add(ambientLight);
    this.scene.add(directionalLight);
    this.scene.add(rimLight);
    this.scene.add(fillLight);
  }

  drawRenaissanceBackground(ctx, size) {
    // Create aged parchment background
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, this.RENAISSANCE_COLORS.ivory);
    gradient.addColorStop(0.2, this.RENAISSANCE_COLORS.parchment);
    gradient.addColorStop(0.6, "#F0E68C");
    gradient.addColorStop(0.8, this.RENAISSANCE_COLORS.bronze);
    gradient.addColorStop(1, this.RENAISSANCE_COLORS.deepRed);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add aged paper texture
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = this.RENAISSANCE_COLORS.burgundy;
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const w = Math.random() * 2 + 1;
      const h = Math.random() * 4 + 1;
      ctx.fillRect(x, y, w, h);
    }

    // Add subtle ink spots
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = this.RENAISSANCE_COLORS.inkBlue;
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  drawChars(ctx, size = this.TEXTURE_SIZE, mode = "grid", customChar = null) {
    if (mode === "single") {
      this.drawRenaissanceBackground(ctx, size);
      this.drawSingleChar(ctx, size, customChar);
    } else {
      this.drawRenaissanceGrid(ctx, size);
    }
  }

  drawSingleChar(ctx, size, customChar = null) {
    const theme = this.CODING_THEMES[this.currentTheme];

    // Choose appropriate font style for each theme
    let fontSize = Math.floor(size * 0.4);
    let fontFamily = "Georgia, serif";
    let fontWeight = "bold";

    switch (this.currentTheme) {
      case "code":
        fontFamily = 'Monaco, "Courier New", monospace';
        fontSize = Math.floor(size * 0.35);
        fontWeight = "600";
        break;
      case "math":
        fontFamily = "Times New Roman, serif";
        fontSize = Math.floor(size * 0.45);
        break;
      case "alchemy":
        fontFamily = "Palatino, serif";
        fontSize = Math.floor(size * 0.4);
        break;
      case "geometry":
        fontFamily = "Helvetica, sans-serif";
        fontSize = Math.floor(size * 0.5);
        break;
      case "manuscript":
        fontFamily = "Garamond, serif";
        fontSize = Math.floor(size * 0.38);
        break;
    }

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Illuminated manuscript style shadow
    ctx.shadowColor = this.RENAISSANCE_COLORS.burgundy;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Choose color from theme palette
    const colorName =
      theme.colors[Math.floor(Math.random() * theme.colors.length)];
    ctx.fillStyle = this.RENAISSANCE_COLORS[colorName];

    // Use custom character or random from theme
    const char =
      customChar ||
      theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
    ctx.fillText(char, size / 2, size / 2);

    // Reset shadow for decorative elements
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Add decorative Renaissance border
    ctx.strokeStyle = this.RENAISSANCE_COLORS.bronze;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, size - 16, size - 16);

    // Add inner border
    ctx.strokeStyle = this.RENAISSANCE_COLORS.gold;
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, size - 24, size - 24);

    // Add corner flourishes
    ctx.fillStyle = this.RENAISSANCE_COLORS.gold;
    ctx.font = `${Math.floor(size * 0.12)}px serif`;
    const flourish = "❋";
    ctx.fillText(flourish, 20, 20);
    ctx.fillText(flourish, size - 20, 20);
    ctx.fillText(flourish, 20, size - 20);
    ctx.fillText(flourish, size - 20, size - 20);
  }

  drawRenaissanceGrid(ctx, size) {
    const theme = this.CODING_THEMES[this.currentTheme];

    // Create manuscript-style background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, this.RENAISSANCE_COLORS.ivory);
    gradient.addColorStop(0.25, this.RENAISSANCE_COLORS.parchment);
    gradient.addColorStop(0.5, "#F5F5DC");
    gradient.addColorStop(0.75, "#F0E68C");
    gradient.addColorStop(1, this.RENAISSANCE_COLORS.bronze);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add parchment texture
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = this.RENAISSANCE_COLORS.burgundy;
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 1, Math.random() * 2 + 1);
    }
    ctx.globalAlpha = 1;

    // Grid layout
    const rows = 3;
    const cols = 3;
    const cellW = size / cols;
    const cellH = size / rows;

    // Font selection based on theme
    let fontSize = Math.floor(cellH * 0.6);
    let fontFamily = "Georgia, serif";

    switch (this.currentTheme) {
      case "code":
        fontFamily = 'Monaco, "Courier New", monospace';
        fontSize = Math.floor(cellH * 0.45);
        break;
      case "math":
        fontFamily = "Times New Roman, serif";
        fontSize = Math.floor(cellH * 0.65);
        break;
      case "alchemy":
        fontFamily = "Palatino, serif";
        fontSize = Math.floor(cellH * 0.55);
        break;
      case "geometry":
        fontFamily = "Helvetica, sans-serif";
        fontSize = Math.floor(cellH * 0.7);
        break;
      case "manuscript":
        fontFamily = "Garamond, serif";
        fontSize = Math.floor(cellH * 0.5);
        break;
    }

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw grid characters
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * cellW + cellW / 2;
      const y = row * cellH + cellH / 2;

      // Select symbol and color from theme
      const char =
        theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
      const colorName =
        theme.colors[Math.floor(Math.random() * theme.colors.length)];

      // Add subtle shadow
      ctx.shadowColor = this.RENAISSANCE_COLORS.burgundy;
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillStyle = this.RENAISSANCE_COLORS[colorName];
      ctx.fillText(char, x, y);
    }

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  createFaceTextures(modes = [], customChars = {}) {
    return modes.map((mode, index) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = this.TEXTURE_SIZE;
      const ctx = canvas.getContext("2d");

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

      const faceOrder = ["right", "left", "top", "bottom", "front", "back"];
      const faceName = faceOrder[index];
      const customChar = customChars[faceName];

      this.drawChars(ctx, this.TEXTURE_SIZE, mode, customChar);

      return { canvas, ctx, texture, mode, customChar, faceName };
    });
  }

  createTextCube(position, faceMode = {}, customChars = {}) {
    const faceOrder = ["right", "left", "top", "bottom", "front", "back"];
    const modes = faceOrder.map((face) => faceMode[face] || "grid");

    const faceTextures = this.createFaceTextures(modes, customChars);
    const materials = faceTextures.map(
      (f) =>
        new THREE.MeshLambertMaterial({
          map: f.texture,
          transparent: true,
          side: THREE.DoubleSide,
        })
    );

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const cube = new THREE.Mesh(geometry, materials);
    cube.castShadow = true;
    cube.receiveShadow = true;

    // Renaissance-style wireframe with golden edges
    const edges = new THREE.EdgesGeometry(geometry);
    const wireframe = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: 0xd4af37,
        linewidth: 2,
        transparent: true,
        opacity: 0.7,
      })
    );
    cube.add(wireframe);

    // Store face textures for animation
    cube.userData.faceTextures = faceTextures;

    // Setup animated texture updates
    const updateInterval = this.TEXT_UPDATE_INTERVAL + Math.random() * 150;
    cube.userData.textureUpdateTimer = setInterval(() => {
      faceTextures.forEach((f) => {
        this.drawChars(f.ctx, this.TEXTURE_SIZE, f.mode, f.customChar);
        f.texture.needsUpdate = true;
      });
    }, updateInterval);

    return cube;
  }

  createRubikCube() {
    for (let x = 0; x < this.CUBE_SIZE; x++) {
      for (let y = 0; y < this.CUBE_SIZE; y++) {
        for (let z = 0; z < this.CUBE_SIZE; z++) {
          const basePosition = new THREE.Vector3(x - 1, y - 1, z - 1);
          const { faceMode, customChars } = this.determineFaceMode(x, y, z);

          const cube = this.createTextCube(basePosition, faceMode, customChars);
          cube.userData.basePosition = basePosition.clone();
          cube.userData.gridPosition = { x, y, z };
          this.rubikGroup.add(cube);
        }
      }
    }

    this.scene.add(this.rubikGroup);
  }

  determineFaceMode(x, y, z) {
    const faceMode = {};
    const customChars = {};

    // Check if this position should display a single character
    Object.entries(this.singleCharConfig).forEach(([faceName, config]) => {
      const [targetX, targetY, targetZ] = config.position;

      if (x === targetX && y === targetY && z === targetZ) {
        faceMode[faceName] = "single";
        customChars[faceName] = config.char;
      }
    });

    return { faceMode, customChars };
  }

  updateCubePositions(time) {
    const t = time * this.ANIMATION_SPEED;

    this.rubikGroup.children.forEach((cube) => {
      const base = cube.userData.basePosition;
      const dist = base.length();

      let direction = new THREE.Vector3();
      if (dist < 0.01) {
        direction.set(0, 1, 0);
      } else {
        direction.copy(base).normalize();
      }

      let offset = new THREE.Vector3();

      // Gentle pulsing animation
      if (dist < 0.01) {
        const offsetAmount = Math.sin(t * 1.5) * this.PULSE_AMPLITUDE;
        offset = direction.multiplyScalar(offsetAmount);
      } else if (Math.abs(dist - Math.sqrt(3)) < 0.01) {
        const offsetAmount = Math.sin(t * 1.5 + Math.PI) * this.PULSE_AMPLITUDE;
        offset = direction.multiplyScalar(offsetAmount);
      }

      cube.position.set(
        base.x * this.SPACING + offset.x,
        base.y * this.SPACING + offset.y,
        base.z * this.SPACING + offset.z
      );
    });
  }

  animate = (time) => {
    this.animationId = requestAnimationFrame(this.animate);

    this.updateCubePositions(time);

    // Gentle rotation like a Renaissance orrery
    this.rubikGroup.rotation.y += 0.008;
    this.rubikGroup.rotation.x += 0.004;
    this.rubikGroup.rotation.z += 0.002;

    this.renderer.render(this.scene, this.camera);
  };

  handleResize = () => {
    const w = this.container.clientWidth;
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, w);
    this.width = w;
  };

  setupEventListeners() {
    window.addEventListener("resize", this.handleResize);
  }

  // Animation controls
  pauseAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resumeAnimation() {
    if (!this.animationId) {
      this.animate();
    }
  }

  // Speed controls
  setAnimationSpeed(speed) {
    this.ANIMATION_SPEED = speed;
  }

  setPulseAmplitude(amplitude) {
    this.PULSE_AMPLITUDE = amplitude;
  }

  // Cleanup method
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Clear texture update timers
    this.rubikGroup.children.forEach((cube) => {
      if (cube.userData.textureUpdateTimer) {
        clearInterval(cube.userData.textureUpdateTimer);
      }
    });

    // Remove event listeners
    window.removeEventListener("resize", this.handleResize);

    // Dispose of Three.js objects
    this.scene.clear();
    this.renderer.dispose();

    // Remove canvas from DOM
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// Export for use in other modules
// export default RenaissanceCodingCube;

// Also make it available globally if needed
if (typeof window !== "undefined") {
  window.RenaissanceCodingCube = RenaissanceCodingCube;
}

// Initialize when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  // Khởi tạo
  const cube = new RenaissanceCodingCube("rubik-cube", { theme: "code" });

  // Chuyển theme
  cube.setTheme("math");
  cube.setTheme("alchemy");

  // Tùy chỉnh ký tự
  cube.setFaceCharacter("front", "∫");
  cube.updateSingleCharConfig({
    front: { position: [1, 1, 2], char: "{}" },
    top: { position: [1, 2, 1], char: "=>" },
  });

  // Điều khiển animation
  cube.pauseAnimation();
  cube.resumeAnimation();
  cube.setAnimationSpeed(0.001);
});
