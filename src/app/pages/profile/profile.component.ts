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
    isEditingBio = false;
    isEditingLocation = false;
    isEditingSocial = false;
    socialGithub = '';
    socialLinkedin = '';
    errorMessage: string | null = null;

    readonly DEFAULT_PHOTO = 'assets/images/loboIcon.jpg';
    currentPhoto: string = localStorage.getItem('userPhoto') || this.DEFAULT_PHOTO;

    readonly brazilianStates = [
        { sigla: 'AC', nome: 'Acre' },
        { sigla: 'AL', nome: 'Alagoas' },
        { sigla: 'AP', nome: 'Amapá' },
        { sigla: 'AM', nome: 'Amazonas' },
        { sigla: 'BA', nome: 'Bahia' },
        { sigla: 'CE', nome: 'Ceará' },
        { sigla: 'DF', nome: 'Distrito Federal' },
        { sigla: 'ES', nome: 'Espírito Santo' },
        { sigla: 'GO', nome: 'Goiás' },
        { sigla: 'MA', nome: 'Maranhão' },
        { sigla: 'MT', nome: 'Mato Grosso' },
        { sigla: 'MS', nome: 'Mato Grosso do Sul' },
        { sigla: 'MG', nome: 'Minas Gerais' },
        { sigla: 'PA', nome: 'Pará' },
        { sigla: 'PB', nome: 'Paraíba' },
        { sigla: 'PR', nome: 'Paraná' },
        { sigla: 'PE', nome: 'Pernambuco' },
        { sigla: 'PI', nome: 'Piauí' },
        { sigla: 'RJ', nome: 'Rio de Janeiro' },
        { sigla: 'RN', nome: 'Rio Grande do Norte' },
        { sigla: 'RS', nome: 'Rio Grande do Sul' },
        { sigla: 'RO', nome: 'Rondônia' },
        { sigla: 'RR', nome: 'Roraima' },
        { sigla: 'SC', nome: 'Santa Catarina' },
        { sigla: 'SP', nome: 'São Paulo' },
        { sigla: 'SE', nome: 'Sergipe' },
        { sigla: 'TO', nome: 'Tocantins' },
    ];
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
        return `${formatted} — ${count} lição${count > 1 ? 'ões' : ''}`;
    }

    toggleEditBio(): void {
        this.isEditingBio = !this.isEditingBio;
    }

    toggleEditLocation(): void {
        this.isEditingLocation = !this.isEditingLocation;
    }

    toggleEditSocial(): void {
        if (!this.isEditingSocial) {
            this.socialGithub   = this.user?.githubUrl   ?? '';
            this.socialLinkedin = this.user?.linkedinUrl ?? '';
        }
        this.isEditingSocial = !this.isEditingSocial;
    }

    saveSocial(): void {
        if (!this.user) return;
        this.user.githubUrl   = this.socialGithub.trim()   || undefined;
        this.user.linkedinUrl = this.socialLinkedin.trim() || undefined;
        this.authService.updateUserProfile(this.user).subscribe({
            next: (updated) => {
                this.user = updated;
                this.isEditingSocial = false;
                this.toast.success('Links atualizados!');
            },
            error: () => { this.isEditingSocial = false; }
        });
    }

    openSocialUrl(url: string | undefined): void {
        if (!url) return;
        const full = url.startsWith('http') ? url : 'https://' + url;
        window.open(full, '_blank', 'noopener,noreferrer');
    }

    saveLocation(): void {
        if (this.user) {
            this.authService.updateUserProfile(this.user).subscribe({
                next: (updatedUser) => {
                    this.user = updatedUser;
                    this.isEditingLocation = false;
                    this.toast.success('Localização atualizada!');
                },
                error: () => {
                    this.isEditingLocation = false;
                }
            });
        }
    }

    saveBio(): void {
        if (this.user) {
            this.authService.updateUserProfile(this.user).subscribe({
                next: (updatedUser) => {
                    this.user = updatedUser;
                    this.isEditingBio = false;
                    this.toast.success('Bio atualizada!');
                },
                error: () => {
                    this.isEditingBio = false;
                }
            });
        }
    }

    onPhotoChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/png', 'image/jpeg'];
        if (!allowedTypes.includes(file.type)) {
            alert('Apenas arquivos PNG, JPG ou JPEG são permitidos.');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            this.currentPhoto = reader.result as string;
            localStorage.setItem('userPhoto', this.currentPhoto);
        };
        reader.readAsDataURL(file);
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
