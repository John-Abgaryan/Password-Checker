// DotGrid Component - Vanilla JavaScript Version
const throttle = (func, limit) => {
  let lastCall = 0;
  return function (...args) {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

class DotGrid {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      dotSize: 12,
      gap: 24,
      baseColor: "#ffffff",
      activeColor: "#5227FF",
      proximity: 120,
      speedTrigger: 80,
      shockRadius: 200,
      shockStrength: 4,
      maxSpeed: 4000,
      resistance: 600,
      returnDuration: 1.2,
      ...options
    };

    this.wrapperRef = null;
    this.canvasRef = null;
    this.dots = [];
    this.pointer = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      speed: 0,
      lastTime: 0,
      lastX: 0,
      lastY: 0,
    };

    this.baseRgb = hexToRgb(this.options.baseColor);
    this.activeRgb = hexToRgb(this.options.activeColor);
    this.circlePath = null;

    this.init();
  }

  init() {
    this.createElements();
    this.createCirclePath();
    this.buildGrid();
    this.bindEvents();
    this.startRender();
  }

  createElements() {
    // Create wrapper
    this.wrapperRef = document.createElement('div');
    this.wrapperRef.className = 'dot-grid__wrap';
    
    // Create canvas
    this.canvasRef = document.createElement('canvas');
    this.canvasRef.className = 'dot-grid__canvas';
    
    // Create dot-grid container
    const dotGridDiv = document.createElement('div');
    dotGridDiv.className = 'dot-grid';
    
    // Append elements
    this.wrapperRef.appendChild(this.canvasRef);
    dotGridDiv.appendChild(this.wrapperRef);
    this.container.appendChild(dotGridDiv);
  }

  createCirclePath() {
    if (typeof window !== "undefined" && window.Path2D) {
      try {
        this.circlePath = new window.Path2D();
        this.circlePath.arc(0, 0, this.options.dotSize / 2, 0, Math.PI * 2);
      } catch (e) {
        console.warn('Path2D not supported, using fallback');
        this.circlePath = null;
      }
    } else {
      this.circlePath = null;
    }
  }

  buildGrid() {
    if (!this.wrapperRef || !this.canvasRef) return;

    const { width, height } = this.wrapperRef.getBoundingClientRect();
    if (width === 0 || height === 0) {
      // Retry after a short delay if dimensions are not available
      setTimeout(() => this.buildGrid(), 100);
      return;
    }

    const dpr = window.devicePixelRatio || 1;

    this.canvasRef.width = width * dpr;
    this.canvasRef.height = height * dpr;
    this.canvasRef.style.width = `${width}px`;
    this.canvasRef.style.height = `${height}px`;
    
    const ctx = this.canvasRef.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    const { dotSize, gap } = this.options;
    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const extraX = width - gridW;
    const extraY = height - gridH;

    const startX = extraX / 2 + dotSize / 2;
    const startY = extraY / 2 + dotSize / 2;

    this.dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = startX + x * cell;
        const cy = startY + y * cell;
        this.dots.push({ cx, cy, xOffset: 0, yOffset: 0, _inertiaApplied: false });
      }
    }

    console.log(`DotGrid: Created ${this.dots.length} dots (${cols}x${rows})`);
  }

  startRender() {
    let rafId;
    const proxSq = this.options.proximity * this.options.proximity;

    const draw = () => {
      const canvas = this.canvasRef;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: px, y: py } = this.pointer;

      for (const dot of this.dots) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        let style = this.options.baseColor;
        if (dsq <= proxSq) {
          const dist = Math.sqrt(dsq);
          const t = 1 - dist / this.options.proximity;
          const r = Math.round(this.baseRgb.r + (this.activeRgb.r - this.baseRgb.r) * t);
          const g = Math.round(this.baseRgb.g + (this.activeRgb.g - this.baseRgb.g) * t);
          const b = Math.round(this.baseRgb.b + (this.activeRgb.b - this.baseRgb.b) * t);
          style = `rgb(${r},${g},${b})`;
        }

        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = style;
        
        // Draw circle with or without Path2D
        if (this.circlePath) {
          ctx.fill(this.circlePath);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, this.options.dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    this.rafId = rafId;
  }

  bindEvents() {
    // Mouse move handler
    const onMove = (e) => {
      const now = performance.now();
      const pr = this.pointer;
      const dt = pr.lastTime ? now - pr.lastTime : 16;
      const dx = e.clientX - pr.lastX;
      const dy = e.clientY - pr.lastY;
      let vx = (dx / dt) * 1000;
      let vy = (dy / dt) * 1000;
      let speed = Math.hypot(vx, vy);
      
      if (speed > this.options.maxSpeed) {
        const scale = this.options.maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = this.options.maxSpeed;
      }
      
      pr.lastTime = now;
      pr.lastX = e.clientX;
      pr.lastY = e.clientY;
      pr.vx = vx;
      pr.vy = vy;
      pr.speed = speed;

      const rect = this.canvasRef.getBoundingClientRect();
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;

      // Apply movement effects to nearby dots
      for (const dot of this.dots) {
        const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
        if (speed > this.options.speedTrigger && dist < this.options.proximity && !dot._inertiaApplied) {
          dot._inertiaApplied = true;
          
          // Check if GSAP is available
          if (typeof gsap !== 'undefined') {
            gsap.killTweensOf(dot);
            const pushX = (dot.cx - pr.x) * 0.3 + vx * 0.003;
            const pushY = (dot.cy - pr.y) * 0.3 + vy * 0.003;
            
            gsap.to(dot, {
              xOffset: pushX,
              yOffset: pushY,
              duration: 0.8,
              ease: "power2.out",
              onComplete: () => {
                gsap.to(dot, {
                  xOffset: 0,
                  yOffset: 0,
                  duration: this.options.returnDuration,
                  ease: "elastic.out(1,0.75)",
                  onComplete: () => {
                    dot._inertiaApplied = false;
                  }
                });
              },
            });
          } else {
            // Fallback without GSAP
            setTimeout(() => {
              dot._inertiaApplied = false;
            }, 1000);
          }
        }
      }
    };

    // Click handler
    const onClick = (e) => {
      const rect = this.canvasRef.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      
      for (const dot of this.dots) {
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < this.options.shockRadius && !dot._inertiaApplied) {
          dot._inertiaApplied = true;
          
          // Check if GSAP is available
          if (typeof gsap !== 'undefined') {
            gsap.killTweensOf(dot);
            const falloff = Math.max(0, 1 - dist / this.options.shockRadius);
            const pushX = (dot.cx - cx) * this.options.shockStrength * falloff;
            const pushY = (dot.cy - cy) * this.options.shockStrength * falloff;
            
            gsap.to(dot, {
              xOffset: pushX,
              yOffset: pushY,
              duration: 0.6,
              ease: "power2.out",
              onComplete: () => {
                gsap.to(dot, {
                  xOffset: 0,
                  yOffset: 0,
                  duration: this.options.returnDuration,
                  ease: "elastic.out(1,0.75)",
                  onComplete: () => {
                    dot._inertiaApplied = false;
                  }
                });
              },
            });
          } else {
            // Fallback without GSAP
            setTimeout(() => {
              dot._inertiaApplied = false;
            }, 1000);
          }
        }
      }
    };

    // Resize handler
    const onResize = () => {
      this.buildGrid();
    };

    // Bind events
    this.throttledMove = throttle(onMove, 50);
    window.addEventListener("mousemove", this.throttledMove, { passive: true });
    window.addEventListener("click", onClick);
    
    // Handle resize
    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(onResize);
      this.resizeObserver.observe(this.wrapperRef);
    } else {
      window.addEventListener("resize", onResize);
      this.onResize = onResize;
    }
  }

  destroy() {
    // Clean up event listeners
    if (this.throttledMove) {
      window.removeEventListener("mousemove", this.throttledMove);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    } else if (this.onResize) {
      window.removeEventListener("resize", this.onResize);
    }
    
    // Cancel animation frame
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    // Kill all GSAP tweens if available
    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(this.dots);
    }
  }
}

// Initialize DotGrid when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing DotGrid...');
  const container = document.getElementById('dot-grid-container');
  if (container) {
    console.log('Container found, creating DotGrid...');
    // Create DotGrid with custom options for the password checker
    window.dotGrid = new DotGrid(container, {
      dotSize: 8,
      gap: 20,
      baseColor: "#271E37",
      activeColor: "#5227FF",
      proximity: 100,
      speedTrigger: 50,
      shockRadius: 150,
      shockStrength: 6,
      maxSpeed: 3000,
      resistance: 500,
      returnDuration: 1.5,
    });
    console.log('DotGrid created successfully!');
  } else {
    console.error('Container #dot-grid-container not found!');
  }
});
