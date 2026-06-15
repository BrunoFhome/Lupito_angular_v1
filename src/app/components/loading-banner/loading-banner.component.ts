import { Component, Input } from '@angular/core';

/**
 * Banner de carregamento reutilizável (spinner + título + subtítulo).
 * Mesmo visual usado na trilha de aprendizado, com textos específicos por tela.
 */
@Component({
  selector: 'app-loading-banner',
  standalone: true,
  template: `
    <div class="loading-banner">
      <div class="loading-spinner"></div>
      <div class="loading-texts">
        <span class="loading-title">{{ title }}</span>
        <span class="loading-subtitle">{{ subtitle }}</span>
      </div>
    </div>
  `,
  styles: [`
    .loading-banner {
      display: flex;
      align-items: center;
      gap: 20px;
      background-color: #ffffff;
      border: 2px solid #f0f2f4;
      border-radius: 18px;
      padding: 24px 28px;
      margin-bottom: 48px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
      font-family: 'JetBrains Mono', monospace;
    }

    .loading-spinner {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      border: 4px solid #e2e8f0;
      border-top-color: #00b4cc;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }

    .loading-texts {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .loading-title {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }

    .loading-subtitle {
      font-size: 14px;
      color: #64748b;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 700px) {
      .loading-banner {
        padding: 16px 18px;
        gap: 14px;
        margin-bottom: 28px;
      }
      .loading-title { font-size: 16px; }
      .loading-subtitle { font-size: 13px; }
    }
  `]
})
export class LoadingBannerComponent {
  @Input() title = 'Carregando…';
  @Input() subtitle = 'Aguarde um instante';
}
