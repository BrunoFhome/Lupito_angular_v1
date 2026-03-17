import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { KanbanService, KanbanTask } from '../../services/kanban.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
    user: User | null = null;
    isEditingBio = false;
    errorMessage: string | null = null;
    selectedProject: KanbanTask | null = null;
    completedProjects: KanbanTask[] = [];
    loadingProjects = true;

    private tasksSub: Subscription | null = null;

    constructor(
        private authService: AuthService,
        private router: Router,
        private kanbanService: KanbanService
    ) { }

    ngOnInit(): void {
        this.authService.getCurrentUser().subscribe({
            next: (data) => {
                this.user = data;
            },
            error: (err) => {
                this.errorMessage = err.message || JSON.stringify(err);
                console.error('Failed to load user profile.', err);

                if (err.status === 401 || err.status === 403 || err.status === 404 || err.status === 500) {
                    setTimeout(() => this.authService.logout(), 3000);
                }
            }
        });

        this.tasksSub = this.kanbanService.getTasks().subscribe(tasks => {
            this.completedProjects = tasks.filter(t => t.status === 'done');
            this.loadingProjects = false;
        });
        this.kanbanService.loadTasks();
    }

    ngOnDestroy(): void {
        this.tasksSub?.unsubscribe();
    }

    toggleEditBio(): void {
        this.isEditingBio = !this.isEditingBio;
    }

    saveBio(): void {
        if (this.user) {
            this.authService.updateUserProfile(this.user).subscribe({
                next: (updatedUser) => {
                    this.user = updatedUser;
                    this.isEditingBio = false;
                },
                error: (err) => {
                    console.error('Failed to update bio.', err);
                }
            });
        }
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
