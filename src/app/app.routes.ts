import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { PreferencesComponent } from './pages/preferences/preferences.component';
import { EditProfileComponent } from './pages/edit-profile/edit-profile.component';
import { KanbanComponent } from './pages/kanban/kanban.component';
import { AprendizadoComponent } from './pages/aprendizado/aprendizado.component';
import { LessonComponent } from './pages/lesson/lesson.component';
import { WorkspaceComponent } from './pages/workspace/workspace.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LandingComponent } from './pages/landing/landing.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'verify-email', component: VerifyEmailComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'preferences', component: PreferencesComponent, canActivate: [authGuard] },
    { path: 'edit-profile', component: EditProfileComponent, canActivate: [authGuard] },
    { path: 'kanban', component: KanbanComponent, canActivate: [authGuard] },
    { path: 'aprendizado', component: AprendizadoComponent, canActivate: [authGuard] },
    { path: 'lesson/:id', component: LessonComponent, canActivate: [authGuard] },
    { path: 'workspace/:taskId', component: WorkspaceComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: 'dashboard' }
];
