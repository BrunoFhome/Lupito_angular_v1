import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private toastSubject = new Subject<Toast>();
  readonly toasts$ = this.toastSubject.asObservable();

  success(message: string) { this.emit(message, 'success'); }
  error(message: string)   { this.emit(message, 'error'); }
  info(message: string)    { this.emit(message, 'info'); }

  private emit(message: string, type: Toast['type']) {
    this.toastSubject.next({ id: ++this.counter, message, type });
  }
}
