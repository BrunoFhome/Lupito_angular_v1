import { Component, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Checkpoint {
  label: string;
  image: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements AfterViewInit, OnDestroy {

  readonly checkpoints: Checkpoint[] = [
    { label: 'O que é o Lupito?', image: 'assets/images/comemorando.png' },
    { label: 'Tecnologias',       image: 'assets/images/landing/lupito_tec - Editado.png' },
    { label: 'Exercícios',        image: 'assets/images/landing/lupito_checklist.png' },
    { label: 'Kanban',            image: 'assets/images/landing/lupito_kanban.png' },
    { label: 'Projetos',          image: 'assets/images/landing/lupito_projeto_completo.png' },
    { label: 'Portfólio',         image: 'assets/images/landing/lupito_portfolio.png' },
    { label: 'Conquistas',        image: 'assets/images/landing/lupito_conquista.png' },
    { label: 'Começar!',          image: 'assets/images/bemvindo.png' },
  ];

  activeSection = 0;
  walkFrame: string = this.checkpoints[0].image;

  private readonly walkFrames: string[] = [
    'assets/images/landing/andando1.png',
    'assets/images/landing/andando2.png',
    'assets/images/landing/andando3.png',
    'assets/images/landing/andando4.png',
  ];
  private walkFrameIndex = 0;
  private walkInterval: ReturnType<typeof setInterval> | null = null;
  private observer: IntersectionObserver | null = null;
  private scrollContainer: HTMLElement | null = null;
  private isScrolling = false;

  constructor(private el: ElementRef) {}

  // Checkpoints distribuídos de 5% a 95% da altura da trilha
  checkpointTopStyle(i: number): string {
    const n = this.checkpoints.length;
    const pct = 5 + (i / (n - 1)) * 90;
    return `${pct.toFixed(2)}%`;
  }

  get trailFillHeight(): string {
    const n = this.checkpoints.length;
    const activePct = 5 + (this.activeSection / (n - 1)) * 90;
    return `calc(${activePct.toFixed(2)}% - 5%)`;
  }

  get mascotTopPercent(): string {
    const n = this.checkpoints.length;
    const pct = 5 + (this.activeSection / (n - 1)) * 90;
    return `calc(${pct.toFixed(2)}% - 60px)`;   // metade de 120px
  }

  ngAfterViewInit(): void {
    this.scrollContainer = document.querySelector('.main-content') as HTMLElement | null;
    this.initIntersectionObserver();

    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('wheel', this.handleWheel, { passive: false });
    }
    document.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy(): void {
    this.stopWalkAnimation();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('wheel', this.handleWheel);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  // ── Snap scroll via roda do mouse ──────────────────────
  private handleWheel = (e: WheelEvent): void => {
    if (this.isScrolling) {
      e.preventDefault();
      return;
    }

    const goingDown = e.deltaY > 0;
    const goingUp   = e.deltaY < 0;
    const last      = this.checkpoints.length - 1;

    if (goingDown && this.activeSection < last) {
      e.preventDefault();
      this.scrollToSection(this.activeSection + 1);
    } else if (goingUp && this.activeSection > 0) {
      e.preventDefault();
      this.scrollToSection(this.activeSection - 1);
    }
    // Se está no último e rola para baixo → scroll livre para CTA/footer
  };

  // ── Snap scroll via teclado ────────────────────────────
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.isScrolling) return;
    const last = this.checkpoints.length - 1;

    if ((e.key === 'ArrowDown' || e.key === 'PageDown') && this.activeSection < last) {
      e.preventDefault();
      this.scrollToSection(this.activeSection + 1);
    } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && this.activeSection > 0) {
      e.preventDefault();
      this.scrollToSection(this.activeSection - 1);
    }
  };

  // ── Navegar para seção específica ─────────────────────
  private scrollToSection(index: number): void {
    if (this.isScrolling) return;
    this.isScrolling = true;
    this.activeSection = index;

    this.startWalkAnimation();

    const section = document.querySelector<HTMLElement>(`[data-section="${index}"]`);
    if (section && this.scrollContainer) {
      const rect          = section.getBoundingClientRect();
      const containerRect = this.scrollContainer.getBoundingClientRect();
      const newScrollTop  = this.scrollContainer.scrollTop + rect.top - containerRect.top;

      this.scrollContainer.scrollTo({ top: newScrollTop, behavior: 'smooth' });
    }

    setTimeout(() => {
      this.stopWalkAnimation();
      this.isScrolling = false;
    }, 900);
  }

  // ── Animação de caminhada ──────────────────────────────
  private startWalkAnimation(): void {
    if (this.walkInterval !== null) return;
    this.walkInterval = setInterval(() => {
      this.walkFrameIndex = (this.walkFrameIndex + 1) % this.walkFrames.length;
      this.walkFrame = this.walkFrames[this.walkFrameIndex];
    }, 120);
  }

  private stopWalkAnimation(): void {
    if (this.walkInterval !== null) {
      clearInterval(this.walkInterval);
      this.walkInterval = null;
    }
    this.walkFrameIndex = 0;
    this.walkFrame = this.checkpoints[this.activeSection].image;
  }

  // ── IntersectionObserver (fallback para toque/teclado) ─
  private initIntersectionObserver(): void {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-section]')
    );

    this.observer = new IntersectionObserver(
      (entries) => {
        if (this.isScrolling) return; // não interfere com snap programático
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset['section']);
            if (!isNaN(idx)) {
              this.activeSection = idx;
            }
          }
        });
      },
      {
        root: this.scrollContainer,
        rootMargin: '0px',
        threshold: 0.5,
      }
    );

    sections.forEach(el => this.observer!.observe(el));
  }
}
