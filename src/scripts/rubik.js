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
    this.TEXTURE_SIZE = 128; // GIẢM từ 256 xuống 128
    this.ANIMATION_SPEED = 0.0008;
    this.PULSE_AMPLITUDE = 0.4;
    this.TEXT_UPDATE_INTERVAL = 800; // TĂNG từ 300 lên 800ms

    // Performance optimizations
    this.isAnimating = true;
    this.lastUpdateTime = 0;
    this.frameCount = 0;
    this.targetFPS = 60;
    this.frameTime = 1000 / this.targetFPS;
    
    // Texture caching
    this.textureCache = new Map();
    this.materialCache = new Map();
    
    // Batch updates
    this.pendingUpdates = [];
    this.updateBatchSize = 3; // Chỉ update 3 texture mỗi frame

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

    this.CODING_THEMES = {
      code: {
        symbols: ["{}","[]","()","<>","&&","||","==","!=","++","--","->","=>","??","::"],
        colors: ["gold", "emerald", "richBlue", "bronze"],
      },
      math: {
        symbols: ["∫","∑","∏","∆","∇","∞","≈","≠","±","√","∂","∀","∃","∈"],
        colors: ["deepRed", "burgundy", "bronze", "gold"],
      },
      symbols: {
        symbols: ["⚡","⚙","⚛","⚜","❋","❈","✧","◊","※","⁂","☙","❖","✦","♠"],
        colors: ["crimson", "gold", "emerald", "bronze"],
      },
      alchemy: {
        symbols: ["☿","♃","♄","♀","♂","☉","☽","🜀","🜁","🜂","🜃","🜄","△","▽"],
        colors: ["copperGreen", "burgundy", "gold", "deepRed"],
      },
      geometry: {
        symbols: ["◯","△","□","◇","⬟","⬢","⬡","⬠","⬣","⬤","⬥","⬦","⬧","⬨"],
        colors: ["darkGold", "rust", "sage", "bronze"],
      },
      manuscript: {
        symbols: ["℧","℩","℈","℞","℟","℠","℡","™","℣","ℤ","℥","Ω","℧","℩"],
        colors: ["inkBlue", "burgundy", "bronze", "deepRed"],
      },
    };

    this.currentTheme = options.theme || "code";
    this.singleCharConfig = options.singleCharConfig || this.getDefaultSingleCharConfig();

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
    
    // Performance optimizations
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Giới hạn pixel ratio
    this.renderer.powerPreference = "high-performance";
    
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

  // Cached texture creation
  getOrCreateTexture(key, createFn) {
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key);
    }
    
    const texture = createFn();
    this.textureCache.set(key, texture);
    return texture;
  }

  // Cached material creation
  getOrCreateMaterial(textureKey, texture) {
    if (this.materialCache.has(textureKey)) {
      return this.materialCache.get(textureKey);
    }
    
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    
    this.materialCache.set(textureKey, material);
    return material;
  }

  setTheme(themeName) {
    if (this.CODING_THEMES[themeName]) {
      this.currentTheme = themeName;
      this.singleCharConfig = this.getDefaultSingleCharConfig();
      this.clearCaches(); // Clear caches khi đổi theme
      this.recreateRubikCube();
    }
  }

  clearCaches() {
    // Dispose cached textures
    this.textureCache.forEach(texture => {
      if (texture.dispose) texture.dispose();
    });
    this.textureCache.clear();
    
    // Dispose cached materials
    this.materialCache.forEach(material => {
      if (material.dispose) material.dispose();
    });
    this.materialCache.clear();
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
    // Clear existing timers
    this.rubikGroup.children.forEach((cube) => {
      if (cube.userData.textureUpdateTimer) {
        clearInterval(cube.userData.textureUpdateTimer);
      }
    });
    
    // Dispose geometries and materials
    this.rubikGroup.children.forEach((cube) => {
      if (cube.geometry) cube.geometry.dispose();
      if (cube.material) {
        if (Array.isArray(cube.material)) {
          cube.material.forEach(mat => mat.dispose());
        } else {
          cube.material.dispose();
        }
      }
    });
    
    this.rubikGroup.clear();
    this.createRubikCube();
  }

  setupLighting() {
    // Giảm số lượng light để tăng hiệu xuất
    const ambientLight = new THREE.AmbientLight(0xffd700, 0.6); // Tăng ambient light
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6); // Giảm intensity
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024; // Giảm từ 2048
    directionalLight.shadow.mapSize.height = 1024;
    
    // Bỏ bớt một số light không cần thiết
    this.scene.add(ambientLight);
    this.scene.add(directionalLight);
  }

  // Optimized background drawing with reduced complexity
  drawRenaissanceBackground(ctx, size) {
    // Simplified gradient
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, this.RENAISSANCE_COLORS.ivory);
    gradient.addColorStop(0.5, this.RENAISSANCE_COLORS.parchment);
    gradient.addColorStop(1, this.RENAISSANCE_COLORS.bronze);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Reduced texture details
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = this.RENAISSANCE_COLORS.burgundy;
    for (let i = 0; i < 20; i++) { // Giảm từ 40 xuống 20
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 1, 2);
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

    // Simplified shadow
    ctx.shadowColor = this.RENAISSANCE_COLORS.burgundy;
    ctx.shadowBlur = 4; // Giảm blur
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const colorName = theme.colors[Math.floor(Math.random() * theme.colors.length)];
    ctx.fillStyle = this.RENAISSANCE_COLORS[colorName];

    const char = customChar || theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
    ctx.fillText(char, size / 2, size / 2);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Simplified border
    ctx.strokeStyle = this.RENAISSANCE_COLORS.bronze;
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, size - 16, size - 16);
  }

  drawRenaissanceGrid(ctx, size) {
    const theme = this.CODING_THEMES[this.currentTheme];

    // Simplified background
    ctx.fillStyle = this.RENAISSANCE_COLORS.parchment;
    ctx.fillRect(0, 0, size, size);

    const rows = 3;
    const cols = 3;
    const cellW = size / cols;
    const cellH = size / rows;

    let fontSize = Math.floor(cellH * 0.5); // Giảm font size
    let fontFamily = "Georgia, serif";

    switch (this.currentTheme) {
      case "code":
        fontFamily = 'Monaco, "Courier New", monospace';
        fontSize = Math.floor(cellH * 0.4);
        break;
      case "math":
        fontFamily = "Times New Roman, serif";
        fontSize = Math.floor(cellH * 0.55);
        break;
      default:
        fontSize = Math.floor(cellH * 0.45);
        break;
    }

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * cellW + cellW / 2;
      const y = row * cellH + cellH / 2;

      const char = theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
      const colorName = theme.colors[Math.floor(Math.random() * theme.colors.length)];

      ctx.fillStyle = this.RENAISSANCE_COLORS[colorName];
      ctx.fillText(char, x, y);
    }
  }

  createFaceTextures(modes = [], customChars = {}) {
    return modes.map((mode, index) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = this.TEXTURE_SIZE;
      const ctx = canvas.getContext("2d");

      // Use cached texture if possible
      const faceOrder = ["right", "left", "top", "bottom", "front", "back"];
      const faceName = faceOrder[index];
      const customChar = customChars[faceName];
      
      const textureKey = `${this.currentTheme}_${mode}_${faceName}_${customChar}`;
      
      const texture = this.getOrCreateTexture(textureKey, () => {
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
      });

      this.drawChars(ctx, this.TEXTURE_SIZE, mode, customChar);

      return { canvas, ctx, texture, mode, customChar, faceName };
    });
  }

  createTextCube(position, faceMode = {}, customChars = {}) {
    const faceOrder = ["right", "left", "top", "bottom", "front", "back"];
    const modes = faceOrder.map((face) => faceMode[face] || "grid");

    const faceTextures = this.createFaceTextures(modes, customChars);
    const materials = faceTextures.map(f => 
      this.getOrCreateMaterial(`${f.faceName}_${f.mode}`, f.texture)
    );

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const cube = new THREE.Mesh(geometry, materials);
    cube.castShadow = true;
    cube.receiveShadow = true;

    // Simplified wireframe
    const edges = new THREE.EdgesGeometry(geometry);
    const wireframe = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: 0.5,
      })
    );
    cube.add(wireframe);

    cube.userData.faceTextures = faceTextures;

    // Optimized texture updates - batch processing
    const updateInterval = this.TEXT_UPDATE_INTERVAL + Math.random() * 200;
    cube.userData.textureUpdateTimer = setInterval(() => {
      this.pendingUpdates.push({
        faceTextures: faceTextures,
        priority: Math.random()
      });
    }, updateInterval);

    return cube;
  }

  // Batch process texture updates
  processPendingUpdates() {
    if (this.pendingUpdates.length === 0) return;

    // Sort by priority and process only a few per frame
    this.pendingUpdates.sort((a, b) => b.priority - a.priority);
    
    const updateCount = Math.min(this.updateBatchSize, this.pendingUpdates.length);
    
    for (let i = 0; i < updateCount; i++) {
      const update = this.pendingUpdates.shift();
      update.faceTextures.forEach((f) => {
        this.drawChars(f.ctx, this.TEXTURE_SIZE, f.mode, f.customChar);
        f.texture.needsUpdate = true;
      });
    }
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
    if (!this.isAnimating) return;
    
    this.animationId = requestAnimationFrame(this.animate);

    // Frame rate limiting
    if (time - this.lastUpdateTime < this.frameTime) {
      return;
    }
    this.lastUpdateTime = time;

    // Process pending texture updates
    this.processPendingUpdates();

    this.updateCubePositions(time);

    // Slower rotation for better performance
    this.rubikGroup.rotation.y += 0.005;
    this.rubikGroup.rotation.x += 0.002;
    this.rubikGroup.rotation.z += 0.001;

    this.renderer.render(this.scene, this.camera);
    
    this.frameCount++;
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

  pauseAnimation() {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resumeAnimation() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animate();
    }
  }

  setAnimationSpeed(speed) {
    this.ANIMATION_SPEED = speed;
  }

  setPulseAmplitude(amplitude) {
    this.PULSE_AMPLITUDE = amplitude;
  }

  destroy() {
    this.isAnimating = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Clear all timers
    this.rubikGroup.children.forEach((cube) => {
      if (cube.userData.textureUpdateTimer) {
        clearInterval(cube.userData.textureUpdateTimer);
      }
    });

    // Clear caches
    this.clearCaches();

    // Remove event listeners
    window.removeEventListener("resize", this.handleResize);

    // Dispose of Three.js objects
    this.scene.clear();
    this.renderer.dispose();

    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// Make available globally
if (typeof window !== "undefined") {
  window.RenaissanceCodingCube = RenaissanceCodingCube;
}

// Optimized initialization
window.addEventListener("DOMContentLoaded", () => {
  const cube = new RenaissanceCodingCube("rubik-cube", { 
    theme: "code"
  });
  
  // Example usage with performance considerations
  // cube.setTheme("math");
  // cube.setFaceCharacter("front", "∫");
});