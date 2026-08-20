/* VYRA - Interactive Grid Canvas Animation */
class GridCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 150 };
    
    this.init();
    this.animate();

    window.addEventListener('resize', () => this.init());
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  init() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight || 550;
    
    this.nodes = [];
    const numNodes = Math.floor((this.canvas.width * this.canvas.height) / 16000);

    for (let i = 0; i < numNodes; i++) {
      const type = Math.random() > 0.75 ? 'transformer' : (Math.random() > 0.5 ? 'ai_node' : 'sensor');
      this.nodes.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: type === 'transformer' ? 5 : (type === 'ai_node' ? 4 : 3),
        type: type,
        pulse: Math.random() * Math.PI * 2
      });
    }

    // Energy flow particles between connected nodes
    this.particles = [];
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        from: Math.floor(Math.random() * this.nodes.length),
        to: Math.floor(Math.random() * this.nodes.length),
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.01
      });
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw connections
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x;
        const dy = this.nodes[i].y - this.nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 140) {
          const alpha = (1 - dist / 140) * 0.25;
          this.ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
          this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
          this.ctx.stroke();
        }
      }
    }

    // Update & draw energy flow particles
    this.particles.forEach((p) => {
      p.progress += p.speed;
      if (p.progress >= 1) {
        p.progress = 0;
        p.from = Math.floor(Math.random() * this.nodes.length);
        p.to = Math.floor(Math.random() * this.nodes.length);
      }

      const n1 = this.nodes[p.from];
      const n2 = this.nodes[p.to];
      if (n1 && n2) {
        const px = n1.x + (n2.x - n1.x) * p.progress;
        const py = n1.y + (n2.y - n1.y) * p.progress;

        this.ctx.fillStyle = '#00ff9d';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#00ff9d';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    });

    // Update and draw nodes
    this.nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      n.pulse += 0.03;

      if (n.x < 0 || n.x > this.canvas.width) n.vx *= -1;
      if (n.y < 0 || n.y > this.canvas.height) n.vy *= -1;

      // Mouse interaction
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = this.mouse.x - n.x;
        const dy = this.mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          n.x -= (dx / dist) * force * 2;
          n.y -= (dy / dist) * force * 2;
        }
      }

      // Draw node
      this.ctx.beginPath();
      const glow = Math.sin(n.pulse) * 2;
      this.ctx.arc(n.x, n.y, n.radius + glow * 0.3, 0, Math.PI * 2);

      if (n.type === 'transformer') {
        this.ctx.fillStyle = '#10b981';
        this.ctx.shadowColor = '#00ff9d';
      } else if (n.type === 'ai_node') {
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.shadowColor = '#00f2fe';
      } else {
        this.ctx.fillStyle = '#06b6d4';
        this.ctx.shadowColor = '#06b6d4';
      }

      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GridCanvas('heroCanvas');
});
