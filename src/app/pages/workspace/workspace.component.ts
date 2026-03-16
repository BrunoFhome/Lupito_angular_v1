import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { KanbanService, KanbanTask } from '../../services/kanban.service';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, MatIconModule, NavbarComponent, FormsModule, MonacoEditorModule],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css']
})
export class WorkspaceComponent implements OnInit {
  task: KanbanTask | null = null;
  taskId: number | null = null;
  videoUrl: SafeResourceUrl | null = null;
  isCompleted: boolean = false;
  
  editorOptions = {theme: 'vs-dark', language: 'python'};
  code: string = '# Escreva seu código aqui. \n';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private kanbanService: KanbanService,
    private location: Location,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('taskId');
      if (idParam) {
        this.taskId = parseInt(idParam, 10);
        this.kanbanService.getTasks().subscribe(tasks => {
          this.task = tasks.find(t => t.id === this.taskId) || null;
          
          if (this.task) {
            this.isCompleted = this.task.status === 'done';
            
            // Temporary mapping
            if (this.task.title === 'Python Básico') {
              this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/nLRL_NcnK-4');
            } else {
              this.videoUrl = null; 
            }
          }
        });
        this.kanbanService.loadTasks();
      }
    });
  }

  completeTask() {
    if (this.taskId) {
      this.kanbanService.updateTaskStatus(this.taskId, 'done');
      this.isCompleted = true;
      alert('Tarefa concluida!');
    }
  }

  runCode() {
     console.log('Running code...');
  }
  
  submitProject() {
     console.log('Submitting project...');
     this.completeTask();
  }

  goBack() {
    this.location.back();
  }
}
