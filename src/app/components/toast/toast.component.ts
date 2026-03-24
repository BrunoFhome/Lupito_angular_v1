import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: (Toast & { visible: boolean })[] = [];
  private sub!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.sub = this.toastService.toasts$.subscribe(toast => {
      const entry = { ...toast, visible: true };
      this.toasts.push(entry);
      setTimeout(() => { entry.visible = false; }, 3000);
      setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== toast.id); }, 3400);
    });
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  dismiss(id: number) {
    const t = this.toasts.find(t => t.id === id);
    if (t) t.visible = false;
    setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); }, 400);
  }
}
