import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, User, ActivityDay } from '../../services/auth.service';
import { KanbanService, KanbanTask } from '../../services/kanban.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
    user: User | null = null;
    loadingProfile = true;
    errorMessage: string | null = null;

    isEditingSocial = false;
    socialGithub = '';
    socialLinkedin = '';
    githubError = '';
    linkedinError = '';

    readonly avatarOptions: string[] = [
        'assets/images/lupito_pers/4.png',
        'assets/images/lupito_pers/7.png',
        'assets/images/lupito_pers/10.png',
        'assets/images/lupito_pers/12.png',
        'assets/images/lupito_pers/13.png',
        'assets/images/lupito_pers/14.png',
        'assets/images/lupito_pers/15.png',
        'assets/images/lupito_pers/17.png',
    ];
    readonly DEFAULT_PHOTO = this.avatarOptions[0];
    currentPhoto: string = localStorage.getItem('userPhoto') || this.DEFAULT_PHOTO;
    isChoosingPhoto = false;

    selectedProject: KanbanTask | null = null;
    completedProjects: KanbanTask[] = [];
    loadingProjects = true;

    heatmapCells: { date: string; count: number; level: number; label: string }[] = [];
    activeDaysCount = 0;
    loadingActivity = true;

    private destroy$ = new Subject<void>();

    constructor(
        private authService: AuthService,
        private router: Router,
        private kanbanService: KanbanService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.authService.getCurrentUser()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.user = data;
                    this.loadingProfile = false;
                    this.loadActivityData(data.id);
                },
                error: (err) => { this.errorMessage = err.message; this.loadingProfile = false; }
            });

        this.kanbanService.getTasks()
            .pipe(takeUntil(this.destroy$))
            .subscribe(tasks => {
                this.completedProjects = tasks.filter(t => t.status === 'done');
                this.loadingProjects = false;
            });
        this.kanbanService.loadTasks();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadActivityData(userId: number): void {
        this.authService.getActivityData(userId, 30)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (days: ActivityDay[]) => {
                    this.heatmapCells = days.map(d => ({
                        date: d.date,
                        count: d.count,
                        level: d.count === 0 ? 0 : d.count === 1 ? 1 : d.count <= 3 ? 2 : 3,
                        label: this.formatCellLabel(d.date, d.count)
                    }));
                    this.activeDaysCount = days.filter(d => d.count > 0).length;
                    this.loadingActivity = false;
                },
                error: () => { this.loadingActivity = false; }
            });
    }

    private formatCellLabel(dateStr: string, count: number): string {
        const date = new Date(dateStr + 'T12:00:00');
        const formatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        if (count === 0) return `${formatted} — sem atividade`;
        return `${formatted} — ${count} ${count === 1 ? 'lição' : 'lições'}`;
    }

    toggleEditSocial(): void {
        if (!this.isEditingSocial) {
            this.socialGithub   = this.user?.githubUrl   ?? '';
            this.socialLinkedin = this.user?.linkedinUrl ?? '';
            this.githubError   = '';
            this.linkedinError = '';
        }
        this.isEditingSocial = !this.isEditingSocial;
    }

    private isValidGithubUrl(url: string): boolean {
        if (!url) return true;
        return /^https:\/\/github\.com\/[\w.-]+(\/[\w.\/-]*)?$/.test(url);
    }

    private isValidLinkedinUrl(url: string): boolean {
        if (!url) return true;
        return /^https:\/\/([a-z]{2,}\.)?linkedin\.com\/(in|company)\/[^\s/]+(\/[^\s]*)?$/i.test(url);
    }

    saveSocial(): void {
        this.githubError   = '';
        this.linkedinError = '';

        const github   = this.socialGithub.trim();
        const linkedin = this.socialLinkedin.trim();

        if (github && !this.isValidGithubUrl(github)) {
            this.githubError = 'Use o formato: https://github.com/seu-usuario';
            return;
        }
        if (linkedin && !this.isValidLinkedinUrl(linkedin)) {
            this.linkedinError = 'Use o formato: https://linkedin.com/in/seu-perfil';
            return;
        }

        if (!this.user) return;
        const prevGithub   = this.user.githubUrl;
        const prevLinkedin = this.user.linkedinUrl;
        this.user.githubUrl   = github   || undefined;
        this.user.linkedinUrl = linkedin || undefined;
        this.authService.updateUserProfile(this.user).subscribe({
            next: (updated) => {
                this.user = updated;
                this.isEditingSocial = false;
                this.toast.success('Links atualizados!');
            },
            error: () => {
                this.user!.githubUrl   = prevGithub;
                this.user!.linkedinUrl = prevLinkedin;
                this.isEditingSocial = false;
            }
        });
    }

    openSocialUrl(url: string | undefined): void {
        if (!url) return;
        const full = url.startsWith('http') ? url : 'https://' + url;
        window.open(full, '_blank', 'noopener,noreferrer');
    }

    openPhotoChooser(): void {
        this.isChoosingPhoto = true;
    }

    closePhotoChooser(): void {
        this.isChoosingPhoto = false;
    }

    selectAvatar(path: string): void {
        this.currentPhoto = path;
        localStorage.setItem('userPhoto', path);
        this.isChoosingPhoto = false;
        this.toast.success('Avatar atualizado!');
    }

    onLogout(): void {
        this.authService.logout();
    }

    openProject(project: KanbanTask) {
        this.selectedProject = project;
    }

    closeProject() {
        this.selectedProject = null;
    }

    copyCode() {
        if (this.selectedProject?.userCode) {
            navigator.clipboard.writeText(this.selectedProject.userCode);
            alert('Código copiado!');
        }
    }

    get earnedBadgesCount(): number {
        return this.badges.filter(b => b.earned).length;
    }

    get badges(): { label: string; icon: string; description: string; earned: boolean }[] {
        const progress = this.user?.learningProgress ?? 0;
        const done = this.completedProjects.length;
        const streak = this.user?.currentStreak ?? 0;

        return [
            { label: 'Primeira Missão', icon: '🎯', description: 'Completou a primeira aula', earned: progress >= 1 },
            { label: 'Estudante Dedicado', icon: '📚', description: 'Completou 5 aulas', earned: progress >= 5 },
            { label: 'Mestre do Conhecimento', icon: '🧠', description: 'Completou 10 aulas', earned: progress >= 10 },
            { label: 'Primeiro Projeto', icon: '🚀', description: 'Concluiu o primeiro projeto', earned: done >= 1 },
            { label: 'Portfólio em Crescimento', icon: '💼', description: 'Concluiu 3 projetos', earned: done >= 3 },
            { label: 'Desenvolvedor Completo', icon: '🏅', description: 'Concluiu 5 projetos', earned: done >= 5 },
            { label: 'Em Sequência', icon: '🔥', description: '3 dias seguidos de estudo', earned: streak >= 3 },
            { label: 'Uma Semana Forte', icon: '⚡', description: '7 dias seguidos de estudo', earned: streak >= 7 },
        ];
    }
}
