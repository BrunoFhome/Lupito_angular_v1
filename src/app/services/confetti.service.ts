import { Injectable } from '@angular/core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle';
}

@Injectable({ providedIn: 'root' })
export class ConfettiService {

  private readonly COLORS = [
    '#00dffc', '#00b4cc', '#005f6b',
    '#f59e0b', '#10b981', '#6366f1',
    '#f43f5e', '#a855f7', '#fbbf24',
    '#ffffff'
  ];

  launch(duration = 3500): void {
    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'pointer-events:none;z-index:9999;';
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    const particles = this.createParticles(canvas.width);
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > duration) {
        canvas.remove();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const fadingOut = elapsed > duration - 600;

      for (const p of particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.12;           // gravidade
        p.vx *= 0.99;           // leve resistência horizontal
        p.rotation += p.rotationSpeed;

        p.opacity = fadingOut ? (duration - elapsed) / 600 : 1;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }

        ctx.restore();
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  private createParticles(width: number): Particle[] {
    const particles: Particle[] = [];

    // Rajada central vinda do topo
    for (let i = 0; i < 80; i++) {
      particles.push(this.makeParticle(
        Math.random() * width,
        -10 - Math.random() * 60,
        (Math.random() - 0.5) * 6,
        Math.random() * 4 + 1
      ));
    }

    // Rajadas dos cantos inferiores (canhões)
    for (let i = 0; i < 50; i++) {
      // canto esquerdo
      particles.push(this.makeParticle(
        0,
        window.innerHeight,
        Math.random() * 8 + 2,
        -(Math.random() * 12 + 8)
      ));
      // canto direito
      particles.push(this.makeParticle(
        width,
        window.innerHeight,
        -(Math.random() * 8 + 2),
        -(Math.random() * 12 + 8)
      ));
    }

    return particles;
  }

  private makeParticle(x: number, y: number, vx: number, vy: number): Particle {
    return {
      x, y, vx, vy,
      color:         this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
      size:          Math.random() * 10 + 6,
      rotation:      Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      opacity:       1,
      shape:         Math.random() > 0.45 ? 'rect' : 'circle'
    };
  }
}
