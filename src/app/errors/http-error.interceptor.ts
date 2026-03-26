import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { MensagensErroHttp, ERRO_PADRAO, ErrosAuth } from './erros-http';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast  = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/');
      let mensagem: string;

      if (isAuthEndpoint) {
        if (error.status === 401 || error.status === 400) {
          mensagem = ErrosAuth.CREDENCIAIS_INVALIDAS;
        } else if (error.status === 409) {
          mensagem = ErrosAuth.EMAIL_JA_CADASTRADO;
        } else {
          mensagem = MensagensErroHttp[error.status] ?? ERRO_PADRAO;
        }
        // Endpoints de auth: não exibe toast — o componente trata a mensagem
      } else {
        mensagem = MensagensErroHttp[error.status] ?? ERRO_PADRAO;

        if (error.status === 401) {
          localStorage.removeItem('token');
          router.navigate(['/login']);
        } else {
          toast.error(mensagem);
        }
      }

      return throwError(() => new Error(mensagem));
    })
  );
};
