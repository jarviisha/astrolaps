import * as THREE from "three";

/**
 * Lớp RenaissanceCodingCube - Tạo khối Rubik 3D với hiệu ứng Renaissance
 * Hiển thị các ký tự lập trình, toán học, và biểu tượng với phong cách cổ điển
 */
class RenaissanceCodingCube {
  constructor(containerId, options = {}) {
    // Khởi tạo container và kiểm tra tồn tại
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container với ID "${containerId}" không tồn tại`);
      return;
    }

    // Thiết lập kích thước và đối tượng Three.js cơ bản
    this.width = this.container.clientWidth;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.rubikGroup = new THREE.Group(); // Nhóm chứa tất cả các khối cube
    this.animationId = null;
    this._destroyed = false;

    // Hằng số cấu hình
    this.CUBE_SIZE = 3; // Kích thước khối Rubik 3x3x3
    this.SPACING = 1.1; // Khoảng cách giữa các khối nhỏ
    this.TEXTURE_SIZE = 256; // Kích thước texture cho mỗi mặt
    this.ANIMATION_SPEED = 0.0008; // Tốc độ animation chung
    this.PULSE_AMPLITUDE = 0.4; // Biên độ hiệu ứng pulse
    this.TEXT_UPDATE_INTERVAL = 300; // Thời gian cập nhật texture (ms)

    // Bảng màu phong cách Renaissance
    this.RENAISSANCE_COLORS = {
      gold: "#D4AF37",        // Vàng
      deepRed: "#8B0000",     // Đỏ đậm
      richBlue: "#191970",    // Xanh đậm
      emerald: "#50C878",     // Xanh lục bảo
      burgundy: "#800020",    // Đỏ burgundy
      bronze: "#CD7F32",      // Đồng
      ivory: "#FFFFF0",       // Ngà
      crimson: "#DC143C",     // Đỏ tươi
      parchment: "#F5F5DC",   // Màu giấy cổ
      inkBlue: "#2F4F4F",     // Xanh mực
      copperGreen: "#7CB342", // Xanh đồng
      darkGold: "#B8860B",    // Vàng đậm
      rust: "#B7410E",        // Màu rỉ sét
      sage: "#87A96B",        // Xanh sage
    };

    // Các chủ đề với ký tự và màu sắc tương ứng
    this.CODING_THEMES = {
      code: {
        symbols: ["{}", "[]", "()", "<>", "&&", "||", "==", "!=", "++", "--", "->", "=>", "??", "::", "0", "1"],
        colors: ["gold", "emerald", "richBlue", "bronze"],
      },
      math: {
        symbols: ["∫", "∑", "∏", "∆", "∇", "∞", "≈", "≠", "±", "√", "∂", "∀", "∃", "∈"],
        colors: ["deepRed", "burgundy", "bronze", "gold"],
      },
      symbols: {
        symbols: ["⚡", "⚙", "⚛", "⚜", "❋", "❈", "✧", "◊", "※", "⁂", "☙", "❖", "✦", "♠"],
        colors: ["crimson", "gold", "emerald", "bronze"],
      },
      alchemy: {
        symbols: ["☿", "♃", "♄", "♀", "♂", "☉", "☽", "🜀", "🜁", "🜂", "🜃", "🜄", "△", "▽"],
        colors: ["copperGreen", "burgundy", "gold", "deepRed"],
      },
      geometry: {
        symbols: ["◯", "△", "□", "◇", "⬟", "⬢", "⬡", "⬠", "⬣", "⬤", "⬥", "⬦", "⬧", "⬨"],
        colors: ["darkGold", "rust", "sage", "bronze"],
      },
      manuscript: {
        symbols: ["℧", "℩", "℈", "℞", "℟", "℠", "℡", "™", "℣", "ℤ", "℥", "Ω", "℧", "℩"],
        colors: ["inkBlue", "burgundy", "bronze", "deepRed"],
      },
    };

    // Thiết lập theme và cấu hình ký tự đặc biệt
    this.currentTheme = options.theme || "code";
    this.singleCharConfig = options.singleCharConfig || this.getDefaultSingleCharConfig();

    // Cache để tối ưu hóa
    this.textureCache = new Map();
    this.materialCache = new Map();

    this.init();
  }

  /**
   * Khởi tạo tất cả thành phần của cube
   */
  init() {
    this.setupCamera();
    this.setupRenderer();
    this.createRubikCube();
    this.setupLighting();
    this.setupEventListeners();
    this.animate();
  }

  /**
   * Thiết lập camera
   */
  setupCamera() {
    this.camera.position.z = 8;
  }

  /**
   * Thiết lập renderer với shadow mapping
   */
  setupRenderer() {
    this.renderer.setClearColor(0x000000, 0); // Nền trong suốt
    this.renderer.setSize(this.width, this.width);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Lấy cấu hình mặc định cho ký tự đặc biệt
   */
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

  /**
   * Đổi theme cho cube
   * @param {string} themeName - Tên theme mới
   */
  setTheme(themeName) {
    if (this.CODING_THEMES[themeName]) {
      this.currentTheme = themeName;
      this.singleCharConfig = this.getDefaultSingleCharConfig();
      this.clearCache(); // Xóa cache khi đổi theme
      this.recreateRubikCube();
    }
  }

  /**
   * Lấy danh sách các theme có sẵn
   */
  getAvailableThemes() {
    return Object.keys(this.CODING_THEMES);
  }

  /**
   * Lấy theme hiện tại
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Cập nhật cấu hình ký tự đặc biệt
   * @param {Object} newConfig - Cấu hình mới
   */
  updateSingleCharConfig(newConfig) {
    this.singleCharConfig = { ...this.singleCharConfig, ...newConfig };
    this.recreateRubikCube();
  }

  /**
   * Đặt ký tự cho một mặt cụ thể
   * @param {string} face - Tên mặt (front, back, left, right, top, bottom)
   * @param {string} char - Ký tự mới
   */
  setFaceCharacter(face, char) {
    if (this.singleCharConfig[face]) {
      this.singleCharConfig[face].char = char;
      this.recreateRubikCube();
    }
  }

  /**
   * Đặt vị trí cho một mặt cụ thể
   * @param {string} face - Tên mặt
   * @param {number} x - Tọa độ x
   * @param {number} y - Tọa độ y  
   * @param {number} z - Tọa độ z
   */
  setFacePosition(face, x, y, z) {
    if (this.singleCharConfig[face]) {
      this.singleCharConfig[face].position = [x, y, z];
      this.recreateRubikCube();
    }
  }

  /**
   * Xóa cache để tối ưu bộ nhớ
   */
  clearCache() {
    this.textureCache.clear();
    this.materialCache.clear();
  }

  /**
   * Tạo lại cube với cấu hình mới
   */
  recreateRubikCube() {
    this.disposeRubikCube();
    this.createRubikCube();
  }

  /**
   * Giải phóng bộ nhớ của cube cũ
   */
  disposeRubikCube() {
    this.rubikGroup.children.forEach((cube) => {
      // Dừng timer cập nhật texture
      if (cube.userData.textureUpdateTimer) {
        clearInterval(cube.userData.textureUpdateTimer);
      }

      // Giải phóng geometry
      if (cube.geometry) {
        cube.geometry.dispose();
      }

      // Giải phóng materials và textures
      if (cube.material instanceof Array) {
        cube.material.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      } else if (cube.material) {
        if (cube.material.map) cube.material.map.dispose();
        cube.material.dispose();
      }

      // Giải phóng wireframe
      cube.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });

    this.rubikGroup.clear();
  }

  /**
   * Thiết lập hệ thống ánh sáng Renaissance
   */
  setupLighting() {
    // Ánh sáng môi trường màu vàng
    const ambientLight = new THREE.AmbientLight(0xffd700, 0.4);

    // Ánh sáng chính với shadow
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;

    // Ánh sáng viền màu đồng
    const rimLight = new THREE.DirectionalLight(0xcd7f32, 0.3);
    rimLight.position.set(-5, 5, -5);

    // Ánh sáng bổ sung
    const fillLight = new THREE.DirectionalLight(0xffd700, 0.2);
    fillLight.position.set(0, -5, 0);

    this.scene.add(ambientLight, directionalLight, rimLight, fillLight);
  }

  /**
   * Vẽ nền giấy cổ phong cách Renaissance
   * @param {CanvasRenderingContext2D} ctx - Context canvas
   * @param {number} size - Kích thước canvas
   */
  drawRenaissanceBackground(ctx, size) {
    // Gradient xuyên tâm tạo hiệu ứng giấy cổ
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, this.RENAISSANCE_COLORS.ivory);
    gradient.addColorStop(0.2, this.RENAISSANCE_COLORS.parchment);
    gradient.addColorStop(0.6, "#F0E68C");
    gradient.addColorStop(0.8, this.RENAISSANCE_COLORS.bronze);
    gradient.addColorStop(1, this.RENAISSANCE_COLORS.deepRed);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Hiệu ứng texture giấy cũ
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = this.RENAISSANCE_COLORS.burgundy;
    for (let i = 0; i < 15; i++) { // Giảm số lượng để tối ưu
      const x = Math.random() * size;
      const y = Math.random() * size;
      const w = Math.random() * 2 + 1;
      const h = Math.random() * 4 + 1;
      ctx.fillRect(x, y, w, h);
    }

    // Các đốm mực nhỏ
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = this.RENAISSANCE_COLORS.inkBlue;
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Vẽ ký tự lên canvas
   * @param {CanvasRenderingContext2D} ctx - Context canvas
   * @param {number} size - Kích thước canvas
   * @param {string} mode - Chế độ vẽ ('grid' hoặc 'single')
   * @param {string} customChar - Ký tự tùy chỉnh
   */
  drawChars(ctx, size = this.TEXTURE_SIZE, mode = "grid", customChar = null) {
    if (mode === "single") {
      this.drawRenaissanceBackground(ctx, size);
      this.drawSingleChar(ctx, size, customChar);
    } else {
      this.drawRenaissanceGrid(ctx, size);
    }
  }

  /**
   * Vẽ một ký tự lớn ở giữa canvas
   * @param {CanvasRenderingContext2D} ctx - Context canvas
   * @param {number} size - Kích thước canvas
   * @param {string} customChar - Ký tự tùy chỉnh
   */
  drawSingleChar(ctx, size, customChar = null) {
    const theme = this.CODING_THEMES[this.currentTheme];
    const fontSize = Math.floor(size * 0.4);

    // Cấu hình font
    ctx.font = `bold ${fontSize}px "Fira Code", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Hiệu ứng shadow
    ctx.shadowColor = this.RENAISSANCE_COLORS.burgundy;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Chọn màu và ký tự ngẫu nhiên
    const colorName = theme.colors[Math.floor(Math.random() * theme.colors.length)];
    ctx.fillStyle = this.RENAISSANCE_COLORS[colorName];
    const char = customChar || theme.symbols[Math.floor(Math.random() * theme.symbols.length)];

    // Vẽ ký tự chính
    ctx.fillText(char, size / 2, size / 2);

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Vẽ khung viền
    ctx.strokeStyle = this.RENAISSANCE_COLORS.bronze;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, size - 16, size - 16);

    ctx.strokeStyle = this.RENAISSANCE_COLORS.gold;
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, size - 24, size - 24);

    // Vẽ trang trí góc
    ctx.fillStyle = this.RENAISSANCE_COLORS.gold;
    ctx.font = `${Math.floor(size * 0.12)}px serif`;
    const flourish = "❋";
    const positions = [[20, 20], [size - 20, 20], [20, size - 20], [size - 20, size - 20]];
    positions.forEach(([x, y]) => ctx.fillText(flourish, x, y));
  }

  /**
   * Vẽ lưới 3x3 ký tự
   * @param {CanvasRenderingContext2D} ctx - Context canvas
   * @param {number} size - Kích thước canvas
   */
  drawRenaissanceGrid(ctx, size) {
    const theme = this.CODING_THEMES[this.currentTheme];

    // Nền gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, this.RENAISSANCE_COLORS.ivory);
    gradient.addColorStop(0.25, this.RENAISSANCE_COLORS.parchment);
    gradient.addColorStop(0.5, "#F5F5DC");
    gradient.addColorStop(0.75, "#F0E68C");
    gradient.addColorStop(1, this.RENAISSANCE_COLORS.bronze);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Texture nhẹ
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = this.RENAISSANCE_COLORS.burgundy;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 1, Math.random() * 2 + 1);
    }
    ctx.globalAlpha = 1;

    // Vẽ lưới 3x3
    const rows = 3;
    const cols = 3;
    const cellW = size / cols;
    const cellH = size / rows;
    const fontSize = Math.floor(cellH * 0.4);

    ctx.font = `bold ${fontSize}px "Fira Code", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * cellW + cellW / 2;
      const y = row * cellH + cellH / 2;

      // Chọn ký tự và màu ngẫu nhiên
      const char = theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
      const colorName = theme.colors[Math.floor(Math.random() * theme.colors.length)];

      // Hiệu ứng shadow nhẹ
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

  /**
   * Tạo textures cho các mặt của cube
   * @param {Array} modes - Mảng chế độ cho từng mặt
   * @param {Object} customChars - Ký tự tùy chỉnh cho từng mặt
   */
  createFaceTextures(modes = [], customChars = {}) {
    const faceOrder = ["right", "left", "top", "bottom", "front", "back"];

    return modes.map((mode, index) => {
      const faceName = faceOrder[index];
      const customChar = customChars[faceName];

      // Kiểm tra cache
      const cacheKey = `${mode}_${customChar}_${this.currentTheme}`;
      if (this.textureCache.has(cacheKey)) {
        return this.textureCache.get(cacheKey);
      }

      // Tạo canvas và texture mới
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = this.TEXTURE_SIZE;
      const ctx = canvas.getContext("2d");

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

      this.drawChars(ctx, this.TEXTURE_SIZE, mode, customChar);

      const result = { canvas, ctx, texture, mode, customChar, faceName };
      this.textureCache.set(cacheKey, result);
      return result;
    });
  }

  /**
   * Tạo một cube với textures
   * @param {THREE.Vector3} position - Vị trí cube
   * @param {Object} faceMode - Chế độ cho từng mặt
   * @param {Object} customChars - Ký tự tùy chỉnh
   */
  createTextCube(position, faceMode = {}, customChars = {}) {
    const faceOrder = ["right", "left", "top", "bottom", "front", "back"];
    const modes = faceOrder.map((face) => faceMode[face] || "grid");

    const faceTextures = this.createFaceTextures(modes, customChars);

    // Tạo materials
    const materials = faceTextures.map(f => {
      const materialKey = `${f.mode}_${f.customChar}_${this.currentTheme}`;

      if (this.materialCache.has(materialKey)) {
        return this.materialCache.get(materialKey);
      }

      const material = new THREE.MeshLambertMaterial({
        map: f.texture,
        transparent: true,
        side: THREE.DoubleSide,
      });

      this.materialCache.set(materialKey, material);
      return material;
    });

    // Tạo cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const cube = new THREE.Mesh(geometry, materials);
    cube.castShadow = true;
    cube.receiveShadow = true;

    // Thêm wireframe
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

    // Lưu thông tin texture
    cube.userData.faceTextures = faceTextures;

    // Timer cập nhật texture (tối ưu hóa)
    // const updateInterval = this.TEXT_UPDATE_INTERVAL + Math.random() * 200;
    // cube.userData.textureUpdateTimer = setInterval(() => {
    //   if (this._destroyed) return;

    //   faceTextures.forEach((f) => {
    //     if (Math.random() < 0.3) { // Chỉ cập nhật 30% thời gian
    //       this.drawChars(f.ctx, this.TEXTURE_SIZE, f.mode, f.customChar);
    //       f.texture.needsUpdate = true;
    //     }
    //   });
    // }, updateInterval);

    return cube;
  }

  /**
   * Tạo toàn bộ khối Rubik 3x3x3
   */
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

  /**
   * Xác định chế độ hiển thị cho từng mặt dựa trên vị trí
   * @param {number} x - Tọa độ x
   * @param {number} y - Tọa độ y
   * @param {number} z - Tọa độ z
   */
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

  /**
   * Cập nhật vị trí các cube với hiệu ứng pulse
   * @param {number} time - Thời gian hiện tại
   */
  updateCubePositions(time) {
    const t = time * this.ANIMATION_SPEED;

    this.rubikGroup.children.forEach((cube) => {
      const base = cube.userData.basePosition;
      const dist = base.length();

      // Tính toán hướng di chuyển
      let direction = new THREE.Vector3();
      if (dist < 0.01) {
        direction.set(0, 1, 0); // Cube trung tâm
      } else {
        direction.copy(base).normalize();
      }

      // Tính toán offset pulse
      let offset = new THREE.Vector3();
      if (dist < 0.01) {
        // Cube trung tâm pulse ngược
        const offsetAmount = Math.sin(t * 1.5) * this.PULSE_AMPLITUDE;
        offset = direction.multiplyScalar(offsetAmount);
      } else if (Math.abs(dist - Math.sqrt(3)) < 0.01) {
        // Cube góc pulse cùng pha
        const offsetAmount = Math.sin(t * 1.5 + Math.PI) * this.PULSE_AMPLITUDE;
        offset = direction.multiplyScalar(offsetAmount);
      }

      // Áp dụng vị trí mới
      cube.position.set(
        base.x * this.SPACING + offset.x,
        base.y * this.SPACING + offset.y,
        base.z * this.SPACING + offset.z
      );
    });
  }

  /**
   * Vòng lặp animation chính
   */
  animate = (time) => {
    if (this._destroyed) return;

    this.animationId = requestAnimationFrame(this.animate);

    // Cập nhật vị trí cube
    this.updateCubePositions(time);

    // Xoay toàn bộ nhóm cube
    this.rubikGroup.rotation.y += 0.008;
    this.rubikGroup.rotation.x += 0.004;
    this.rubikGroup.rotation.z += 0.002;

    // Render scene
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Xử lý sự kiện resize window
   */
  handleResize = () => {
    if (!this.container) return;

    const w = this.container.clientWidth;
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, w);
    this.width = w;
  };

  /**
   * Thiết lập event listeners
   */
  setupEventListeners() {
    window.addEventListener("resize", this.handleResize);
  }

  /**
   * Tạm dừng animation
   */
  pauseAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Tiếp tục animation
   */
  resumeAnimation() {
    if (!this.animationId && !this._destroyed) {
      this.animate();
    }
  }

  /**
   * Đặt tốc độ animation
   * @param {number} speed - Tốc độ mới
   */
  setAnimationSpeed(speed) {
    this.ANIMATION_SPEED = Math.max(0.0001, Math.min(0.01, speed));
  }

  /**
   * Đặt biên độ hiệu ứng pulse
   * @param {number} amplitude - Biên độ mới
   */
  setPulseAmplitude(amplitude) {
    this.PULSE_AMPLITUDE = Math.max(0, Math.min(1, amplitude));
  }

  /**
   * Đặt tốc độ cập nhật texture
   * @param {number} interval - Khoảng thời gian cập nhật (ms)
   */
  setTextureUpdateInterval(interval) {
    this.TEXT_UPDATE_INTERVAL = Math.max(100, interval);
  }

  /**
   * Lấy thông tin hiệu suất
   */
  getPerformanceInfo() {
    return {
      cubeCount: this.rubikGroup.children.length,
      textureCache: this.textureCache.size,
      materialCache: this.materialCache.size,
      animationRunning: this.animationId !== null,
      currentTheme: this.currentTheme
    };
  }

  /**
   * Giải phóng bộ nhớ và dọn dẹp
   */
  destroy() {
    console.log("Đang dọn dẹp RenaissanceCodingCube...");

    this._destroyed = true;

    // Dừng animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Dọn dẹp các cube
    this.disposeRubikCube();

    // Xóa cache
    this.clearCache();

    // Gỡ bỏ event listeners
    window.removeEventListener("resize", this.handleResize);

    // Dọn dẹp scene và renderer
    this.scene.clear();
    this.renderer.dispose();

    // Gỡ bỏ canvas khỏi DOM
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }

    console.log("Dọn dẹp hoàn tất!");
  }
}

// Export cho sử dụng trong module khác
if (typeof module !== "undefined" && module.exports) {
  module.exports = RenaissanceCodingCube;
}

// Đăng ký global cho browser
if (typeof window !== "undefined") {
  window.RenaissanceCodingCube = RenaissanceCodingCube;
}

/**
 * Khởi tạo tự động khi DOM ready
 */
window.addEventListener("DOMContentLoaded", () => {
  // Kiểm tra xem có element với id 'rubik-cube' không
  const container = document.getElementById("rubik-cube");
  if (!container) {
    console.log("Không tìm thấy container với id 'rubik-cube'");
    return;
  }

  console.log("Khởi tạo RenaissanceCodingCube...");

  // Tạo instance cube với cấu hình tối ưu
  const cube = new RenaissanceCodingCube("rubik-cube", {
    theme: "code"
  });

  // Lưu reference global để có thể truy cập từ console
  window.cubeInstance = cube;
  cube.setAnimationSpeed(0.001);
  cube.setPulseAmplitude(0.6);

  // Cleanup khi trang được đóng
  window.addEventListener("beforeunload", () => {
    if (window.cubeInstance) {
      window.cubeInstance.destroy();
    }
  });
});

/**
 * Utility functions để tương tác với cube
 */
window.CubeUtils = {
  /**
   * Tạo cube mới với theme cụ thể
   * @param {string} containerId - ID container
   * @param {string} theme - Tên theme
   */
  createCube(containerId, theme = "code") {
    return new RenaissanceCodingCube(containerId, { theme });
  },

  /**
   * Lấy danh sách các theme có sẵn
   */
  getAvailableThemes() {
    const tempCube = new RenaissanceCodingCube("temp");
    const themes = tempCube ? tempCube.getAvailableThemes() : [];
    if (tempCube) tempCube.destroy();
    return themes;
  },

  /**
   * Tạo cấu hình ký tự ngẫu nhiên
   */
  generateRandomConfig() {
    const themes = this.getAvailableThemes();
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    return {
      theme: randomTheme,
      animationSpeed: 0.0005 + Math.random() * 0.002,
      pulseAmplitude: 0.2 + Math.random() * 0.4
    };
  }
};

console.log("RenaissanceCodingCube đã được tải thành công!");
console.log("Sử dụng window.cubeInstance để truy cập cube instance");
console.log("Sử dụng window.CubeUtils để các utility functions");