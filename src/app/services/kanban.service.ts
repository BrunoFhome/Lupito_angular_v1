import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  assignee: string;
  date: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done';
}

@Injectable({
  providedIn: 'root'
})
export class KanbanService {
  // Start with some default mock tasks
  private initialTasks: KanbanTask[] = [
    {
      id: 't1',
      title: 'Redesign da Página Inicial',
      priority: 'Alta',
      description: 'Criar novo layout responsivo para a página inicial',
      assignee: 'Maria Silva',
      date: '15/02/2026',
      status: 'todo'
    },
    {
      id: 't2',
      title: 'Implementar Sistema de Login',
      priority: 'Média',
      description: 'Desenvolver autenticação com OAuth2',
      assignee: 'João Santos',
      date: '20/02/2026',
      status: 'todo'
    },
    {
      id: 't4',
      title: 'Integração com API de Pagamento',
      priority: 'Alta',
      description: 'Conectar sistema com gateway de pagamento',
      assignee: 'Pedro Oliveira',
      date: '18/02/2026',
      status: 'in-progress'
    },
    {
      id: 't6',
      title: 'Módulo de Relatórios',
      priority: 'Média',
      description: 'Sistema de geração de relatórios em PDF',
      assignee: 'Lucas Ferreira',
      date: '12/02/2026',
      status: 'in-review'
    },
    {
      id: 't7',
      title: 'Configuração do Ambiente',
      priority: 'Alta',
      description: 'Setup inicial do projeto e dependências',
      assignee: 'Ricardo Alves',
      date: '05/02/2026',
      status: 'done'
    }
  ];

  private tasksSubject = new BehaviorSubject<KanbanTask[]>(this.initialTasks);

  constructor() { }

  getTasks(): Observable<KanbanTask[]> {
    return this.tasksSubject.asObservable();
  }

  addTask(newTask: Omit<KanbanTask, 'id' | 'date'>) {
    const tasks = this.tasksSubject.value;
    const task: KanbanTask = {
      ...newTask,
      id: `task-${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR')
    };
    this.tasksSubject.next([...tasks, task]);
  }

  updateTaskStatus(taskId: string, newStatus: KanbanTask['status']) {
    const tasks = this.tasksSubject.value.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    this.tasksSubject.next(tasks);
  }
}
