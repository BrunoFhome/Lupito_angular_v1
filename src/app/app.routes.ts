import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { KanbanComponent } from './pages/kanban/kanban.component';
import { AprendizadoComponent } from './pages/aprendizado/aprendizado.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'kanban', component: KanbanComponent, canActivate: [authGuard] },
    { path: 'aprendizado', component: AprendizadoComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: 'login' }
];
