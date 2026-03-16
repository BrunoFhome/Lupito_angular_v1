import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
    user: User | null = null;
    isEditingBio = false;
    errorMessage: string | null = null;
    selectedProject: any = null;

    mockProjects = [
        {
            title: 'Sistema de Autenticação',
            description: 'Sistema completo de autenticação com JWT',
            tech: 'TypeScript',
            date: '15/03/2026',
            code: "import express from 'express';\nimport jwt from 'jsonwebtoken';\nimport bcrypt from 'bcrypt';\n\nconst app = express();\nconst SECRET_KEY = 'your-secret-key';\n\ninterface User {\n  id: string;\n  email: string;\n  password: string;\n}\n\nconst users: User[] = [];\n\napp.use(express.json());\n\n// Registro de usuário\napp.post('/register', async (req, res) => {\n  const { email, password } = req.body;\n\n  const hashedPassword = await bcrypt.hash(password, 10);\n  const user: User = {\n    id: Date.now().toString(),\n    email,\n    password: hashedPassword\n  };\n\n  users.push(user);\n  res.status(201).json({ message: 'User created' });\n});"
        },
        {
            title: 'Calculadora React',
            description: 'Calculadora interativa com histórico de operações',
            tech: 'JavaScript',
            date: '10/03/2026',
            code: "import React, { useState } from 'react';\n\nfunction Calculator() {\n  const [display, setDisplay] = useState('');\n\n  const calculate = () => {\n    try {\n      setDisplay(eval(display).toString());\n    } catch (e) {\n      setDisplay('Error');\n    }\n  };\n\n  return (\n    <div>{display}</div>\n  );\n}\n\nexport default Calculator;"
        },
        {
            title: 'API de To-Do List',
            description: 'REST API para gerenciamento de tarefas',
            tech: 'Python',
            date: '05/03/2026',
            code: "from flask import Flask, jsonify, request\n\napp = Flask(__name__)\ntasks = []\n\n@app.route('/tasks', methods=['GET'])\ndef get_tasks():\n    return jsonify(tasks)\n\nif __name__ == '__main__':\n    app.run(debug=True)"
        },
        {
            title: 'Validador de Formulário',
            description: 'Biblioteca de validação de formulários com TypeScript',
            tech: 'TypeScript',
            date: '01/03/2026',
            code: "export function isEmailValid(email: string): boolean {\n  const re = /^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/;\n  return re.test(email);\n}\n\nexport function isPasswordStrong(password: string): boolean {\n  return password.length >= 8;\n}"
        },
        {
            title: 'Algoritmo de Busca Binária',
            description: 'Implementação eficiente de busca binária',
            tech: 'JavaScript',
            date: '25/02/2026',
            code: "function binarySearch(arr, x) {\n  let l = 0, r = arr.length - 1;\n  while (l <= r) {\n    let m = l + Math.floor((r - l) / 2);\n    if (arr[m] == x) return m;\n    if (arr[m] < x) l = m + 1;\n    else r = m - 1;\n  }\n  return -1;\n}"
        },
        {
            title: 'Hook Customizado React',
            description: 'Hook para gerenciamento de estado assíncrono',
            tech: 'TypeScript',
            date: '20/02/2026',
            code: "import { useState, useEffect } from 'react';\n\nexport function useFetch<T>(url: string) {\n  const [data, setData] = useState<T | null>(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetch(url)\n      .then(res => res.json())\n      .then(d => { setData(d); setLoading(false); });\n  }, [url]);\n\n  return { data, loading };\n}"
        }
    ];

    constructor(private authService: AuthService, private router: Router) { }

    ngOnInit(): void {
        this.authService.getCurrentUser().subscribe({
            next: (data) => {
                this.user = data;
            },
            error: (err) => {
                this.errorMessage = err.message || JSON.stringify(err);
                console.error('Failed to load user profile.', err);

                // If it's a server error or unauthorized, force logout to clear bad state
                if (err.status === 401 || err.status === 403 || err.status === 404 || err.status === 500) {
                    // Timeout allows the user to see the error briefly
                    setTimeout(() => this.authService.logout(), 3000);
                }
            }
        });
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

    openProject(project: any) {
        this.selectedProject = project;
    }

    closeProject() {
        this.selectedProject = null;
    }

    copyCode() {
        if (this.selectedProject && this.selectedProject.code) {
            navigator.clipboard.writeText(this.selectedProject.code);
            alert('Código copiado!');
        }
    }
}
