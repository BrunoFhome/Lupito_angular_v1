import { Component, Input, OnInit, OnDestroy } from '@angular/core';

/**
 * Overlay de carregamento com o mascote Lupito caminhando (mesma sequência da landing page).
 * Use com *ngIf no componente pai — ao montar inicia a animação, ao desmontar a limpa.
 */
@Component({
  selector: 'app-walking-lupito-loader',
  standalone: true,
  template: `
    <div class="lupito-loader-overlay">
      <div class="lupito-loader-box">
        <img class="lupito-walk" [src]="frame" alt="" aria-hidden="true" />
        <span class="lupito-loader-message">{{ message }}</span>
        <div class="lupito-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lupito-loader-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(3px);
      animation: fade-in 0.2s ease;
    }

    .lupito-loader-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      font-family: 'JetBrains Mono', monospace;
    }

    .lupito-walk {
      width: 120px;
      height: auto;
      /* leve "balanço" para reforçar a caminhada */
      animation: bob 0.48s ease-in-out infinite;
    }

    .lupito-loader-message {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }

    .lupito-dots {
      display: flex;
      gap: 6px;
    }

    .lupito-dots span {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #00b4cc;
      animation: blink 1.2s infinite ease-in-out both;
    }
    .lupito-dots span:nth-child(1) { animation-delay: -0.24s; }
    .lupito-dots span:nth-child(2) { animation-delay: -0.12s; }

    @keyframes bob {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-6px); }
    }

    @keyframes blink {
      0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
      40%           { opacity: 1;    transform: scale(1); }
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @media (max-width: 700px) {
      .lupito-walk { width: 96px; }
      .lupito-loader-message { font-size: 16px; }
    }
  `]
})
export class WalkingLupitoLoaderComponent implements OnInit, OnDestroy {
  @Input() message = 'Carregando…';

  private readonly frames: string[] = [
    'assets/images/landing/andando1.png',
    'assets/images/landing/andando2.png',
    'assets/images/landing/andando3.png',
    'assets/images/landing/andando4.png',
  ];
  private index = 0;
  frame = this.frames[0];
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.index = (this.index + 1) % this.frames.length;
      this.frame = this.frames[this.index];
    }, 120);
  }

  ngOnDestroy(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
