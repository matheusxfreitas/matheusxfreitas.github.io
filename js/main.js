    // =================== CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ===================
        const firebaseConfig = {
        apiKey: "AIzaSyA050ckDIuD1ujjyRee81r0Vv_jygoHs1Q",
        authDomain: "meu-painel-de-estudos-v2.firebaseapp.com",
        projectId: "meu-painel-de-estudos-v2",
        storageBucket: "meu-painel-de-estudos-v2.firebasestorage.app",
        messagingSenderId: "889152606734",
        appId: "1:889152606734:web:09457849b695f3f1d4625f"
        };

    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    let viewDate = new Date();
    viewDate.setHours(0, 0, 0, 0);
    let studyPlan = {};
    let progressChart;
    let isAuthenticated = false;

    const planContent = document.getElementById('plan-content');
    const allTasksModal = document.getElementById('allTasksModal');
    const addTaskModal = document.getElementById('addTaskModal');
    const confirmationModal = document.getElementById('confirmationModal');

    // =================== LÓGICA DO PASSWORD WALL ===================
    const passwordWall = document.getElementById('password-wall');
    const appContainer = document.getElementById('app-container');
    const passwordForm = document.getElementById('password-form');
    const passwordInput = document.getElementById('password-input');
    const passwordError = document.getElementById('password-error');
    
    if (sessionStorage.getItem('isAuthenticated') === 'true') {
        isAuthenticated = true;
        passwordWall.classList.add('hidden');
    } else {
        appContainer.classList.add('blurred');
    }

    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (passwordInput.value === 'passei2025') {
            isAuthenticated = true;
            sessionStorage.setItem('isAuthenticated', 'true');
            passwordWall.classList.add('hidden');
            appContainer.classList.remove('blurred');
        } else {
            passwordError.textContent = 'Senha incorreta.';
            passwordInput.value = '';
            setTimeout(() => { passwordError.textContent = ''; }, 2000);
        }
    });
    
    // =================== LÓGICA DE TEMAS ===================
    const themeSelector = document.getElementById('theme-selector');
    const applyTheme = (theme) => {
        document.documentElement.className = ''; // Limpa classes antigas
        document.documentElement.classList.add(theme);
        localStorage.setItem('study-theme', theme);
        if (progressChart) {
            progressChart.destroy();
            setupChart();
            updateProgress();
        }
    };

    themeSelector.addEventListener('change', (e) => applyTheme(e.target.value));
    
    // =================== FUNÇÕES AUXILIARES DE DATA ===================
    function formatDateYMD(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDateDMY(dateString) {
        if (!dateString) return 'N/A';
        const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    // =================== FUNÇÕES AUXILIARES GERAIS ===================
    function generateUniqueId(task) {
         return `${task.subject.replace(/[^a-zA-Z0-9]/g, '')}-${task.lesson.replace(/[^a-zA-Z0-9]/g, '')}-${task.type}-${new Date().getTime()}`;
    }

    function showConfirmation(message, onConfirm) {
        const messageEl = document.getElementById('confirmation-message');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');

        messageEl.textContent = message;

        const okListener = () => {
            onConfirm();
            closeModal(confirmationModal);
            cleanup();
        };
        const cancelListener = () => {
            closeModal(confirmationModal);
            cleanup();
        };
        const cleanup = () => {
            okBtn.removeEventListener('click', okListener);
            cancelBtn.removeEventListener('click', cancelListener);
        };

        okBtn.addEventListener('click', okListener);
        cancelBtn.addEventListener('click', cancelListener);
        openModal(confirmationModal);
    }

    // =================== CONTROLE DE MODAIS E SCROLL ===================
    function openModal(modalElement) {
        modalElement.classList.remove('hidden');
        document.body.classList.add('modal-open');
    }

    function closeModal(modalElement) {
        modalElement.classList.add('hidden');
        if (document.querySelectorAll('.modal:not(.hidden)').length === 0) {
            document.body.classList.remove('modal-open');
        }
    }

    // =================== LÓGICA PRINCIPAL DA APLICAÇÃO ===================
    function initializeStudyPlan() {
    let plan = { tasks: {}, reviews: {}, history: [], dailyGoals: {}, deletedTasks: {} };

    // A linha abaixo agora busca os dados do outro ficheiro!
    let allTasks = allTasksData; 

    // A lista de legislação municipal pode continuar aqui, pois é pequena.
    const legislacaoMunicipalTasks = [
            { subject: 'Administração Pública', lesson: 'L1', topic: 'Lei Orgânica do Município de Uberlândia - Art. 1º ao 15º', type: 'legis' },
            { subject: 'Administração Pública', lesson: 'L2', topic: 'Lei Orgânica do Município de Uberlândia - Art. 16º ao 30º', type: 'legis' },
            { subject: 'Administração Pública', lesson: 'L3', topic: 'Lei Orgânica - Competências do Município', type: 'legis' },
            { subject: 'Administração Pública', lesson: 'L4', topic: 'Lei Orgânica - Servidores Públicos', type: 'legis' },
            { subject: 'Administração Pública', lesson: 'L5', topic: 'Estatuto dos Servidores (LC nº 40/1992) - Disposições Preliminares', type: 'legis' },
            { subject: 'Administração Pública', lesson: 'L6', topic: 'Estatuto dos Servidores - Direitos e Vantagens', type: 'legis' },
            { subject: 'Administração Pública', lesson: 'L7', topic: 'Estatuto dos Servidores - Regime Disciplinar', type: 'legis' },
            { subject: 'Administração Pública', lesson: 'L8', topic: 'Estatuto dos Servidores - Responsabilidades', type: 'legis' },
            { subject: 'Administração Pública', lesson: 'L9', topic: 'Plano de Cargos e Carreiras (LC nº 671/2018) - Estrutura Geral', type: 'legis' },
            { subject: 'Administração Pública', lesson: 'L10', topic: 'Revisão Geral - Legislação Municipal', type: 'legis' },
        ];
        
        allTasks.forEach(task => {
            const id = generateUniqueId(task);
            const dateStr = formatDateYMD(new Date(task.date + 'T03:00:00Z'));
            if (!plan.tasks[dateStr]) plan.tasks[dateStr] = [];
            if (!plan.tasks[dateStr].some(t => t.id === id)) {
                plan.tasks[dateStr].push({ id, ...task, date: dateStr, completed: task.completed || false, notebookLink: task.notebookLink || '', notes: task.notes || '' });
            }
        });
        return plan;
    }

    const saveState = () => {
        db.collection("progresso").doc("meuPlano").set(studyPlan)
            .catch((error) => console.error("Erro ao salvar progresso: ", error));
    };

    const loadState = async () => {
        const docRef = db.collection("progresso").doc("meuPlano");
        try {
            const doc = await docRef.get();
            if (doc.exists && doc.data().tasks) { 
                studyPlan = doc.data();
                if (!studyPlan.dailyGoals) studyPlan.dailyGoals = {};
                if (!studyPlan.deletedTasks) studyPlan.deletedTasks = {};
                if (!studyPlan.history) studyPlan.history = [];
            } else {
                console.log("Nenhum plano encontrado no Firestore, inicializando um novo.");
                studyPlan = initializeStudyPlan();
                saveState(); 
            }
        } catch (error) {
            console.error("Erro ao carregar progresso: ", error);
            studyPlan = initializeStudyPlan();
        }
    };

    function populateInitialHistory() {
        if (!studyPlan.history) studyPlan.history = [];
        const historyTaskIds = new Set(studyPlan.history.map(h => h.taskId));
        const allTasks = Object.values(studyPlan.tasks).flat();
        
        allTasks.forEach(task => {
            if (task.completed && !historyTaskIds.has(task.id)) {
                studyPlan.history.push({
                    taskId: task.id,
                    subject: task.subject,
                    topic: task.topic,
                    completionDate: new Date(task.date + 'T12:00:00Z').toISOString() 
                });
            }
        });
        saveState();
    }

    function createTaskCard(task, isOverdue = false) {
        const card = document.createElement('div');
        let cardClasses = 'task-card p-4 rounded-lg bg-white';
        if (task.type.startsWith('review')) cardClasses += ` ${task.type}`;
        if (task.type === 'legis') cardClasses += ' legis';
        if (isOverdue) cardClasses += ' overdue';
        card.className = cardClasses;
        const title = task.type.startsWith('review') ? `${task.reviewType}: ${task.subject} - Aula ${task.lesson}` : `${task.subject} - Aula ${task.lesson}`;
        
        const typeIcon = task.type === 'video' 
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-gray-500"><path d="m22 8-6 4 6 4V8Z"></path><rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect></svg>` 
            : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-gray-500"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;

        const notebookLinkIcon = task.notebookLink ? `
            <a href="${task.notebookLink}" target="_blank" class="action-btn" title="Abrir caderno no NotebookLM">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </a>` : '';

        const actionsMenu = !task.type.startsWith('review') ? `
            <div class="actions-menu">
                ${notebookLinkIcon}
                <button class="action-btn task-postpone-btn" data-id="${task.id}" data-date="${task.date}" title="Adiar em 1 dia"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="m14 14-4 4m0-4 4 4"></path></svg></button>
                <button class="action-btn task-edit-btn" data-id="${task.id}" data-date="${task.date}" title="Editar Aula"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg></button>
                <button class="action-btn task-delete-btn" data-id="${task.id}" data-date="${task.date}" data-type="${task.type}" title="Excluir Aula"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>` : '';

        card.innerHTML = `
            <div class="flex items-start space-x-4">
                <div class="flex-shrink-0 pt-1"><input type="checkbox" id="${task.id}" data-id="${task.id}" data-date="${task.date}" data-type="${task.type}" class="task-checkbox h-5 w-5 rounded border-gray-300 text-[#D5A021] focus:ring-[#D5A021]" ${task.completed ? 'checked' : ''}></div>
                <div class="flex-1">
                    <label for="${task.id}" class="cursor-pointer">
                        <p class="font-semibold text-gray-800 flex items-center">${!task.type.startsWith('review') ? typeIcon : ''} ${title}</p>
                        <p class="text-sm text-gray-600">${task.topic}</p>
                        ${isOverdue ? `<p class="text-xs text-red-600 font-semibold">Atrasada desde: ${formatDateDMY(task.date)}</p>` : ''}
                    </label>
                </div>
            </div>
            ${actionsMenu}`;
        return card;
    }

    // =================== LÓGICA DE REVISÕES E HISTÓRICO ===================
    function scheduleReviews(completedTask) {
        const completionDate = new Date(completedTask.date + 'T03:00:00Z');
        const reviewDays = { 'review-r1': 1, 'review-r3': 7, 'review-r5': 30 };
        for (const [reviewType, daysToAdd] of Object.entries(reviewDays)) {
            const reviewDate = addDays(completionDate, daysToAdd);
            const reviewDateStr = formatDateYMD(reviewDate);
            if (!studyPlan.reviews) studyPlan.reviews = {};
            if (!studyPlan.reviews[reviewDateStr]) studyPlan.reviews[reviewDateStr] = [];
            const reviewId = `${completedTask.id}-${reviewType}`;
            if (studyPlan.reviews[reviewDateStr].some(r => r.id === reviewId)) continue;
            studyPlan.reviews[reviewDateStr].push({ id: reviewId, date: reviewDateStr, subject: completedTask.subject, lesson: completedTask.lesson, topic: completedTask.topic, type: reviewType, reviewType: reviewType.replace('review-', '').toUpperCase(), completed: false });
        }
    }
    
    function unscheduleReviews(deselectedTask) {
        const completionDate = new Date(deselectedTask.date + 'T03:00:00Z');
        const reviewDays = { 'review-r1': 1, 'review-r3': 7, 'review-r5': 30 };
        for (const [reviewType, daysToAdd] of Object.entries(reviewDays)) {
            const reviewDate = addDays(completionDate, daysToAdd);
            const reviewDateStr = formatDateYMD(reviewDate);
            const reviewId = `${deselectedTask.id}-${reviewType}`;
            if (studyPlan.reviews && studyPlan.reviews[reviewDateStr]) {
                studyPlan.reviews[reviewDateStr] = studyPlan.reviews[reviewDateStr].filter(r => r.id !== reviewId);
                if (studyPlan.reviews[reviewDateStr].length === 0) delete studyPlan.reviews[reviewDateStr];
            }
        }
    }

    function addToHistory(task) {
        if (!studyPlan.history) studyPlan.history = [];
        if (studyPlan.history.some(h => h.taskId === task.id)) return;
        const historyEntry = {
            taskId: task.id,
            subject: task.subject,
            topic: task.topic,
            completionDate: new Date().toISOString()
        };
        studyPlan.history.push(historyEntry);
    }

    function removeFromHistory(taskId) {
        if (!studyPlan.history) return;
        studyPlan.history = studyPlan.history.filter(entry => entry.taskId !== taskId);
    }
    
    // =================== RENDERIZAÇÃO DA UI ===================
    function renderCalendar(date) {
        const calendarContainer = document.getElementById('calendar-container');
        const month = date.getMonth();
        const year = date.getFullYear();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

        let html = `<div class="flex justify-between items-center mb-4"><button id="prev-month" class="control-button p-2 rounded-full">&#x276E;</button><h2 class="text-xl font-bold">${monthNames[month]} ${year}</h2><button id="next-month" class="control-button p-2 rounded-full">&#x276F;</button></div><div class="grid grid-cols-7 gap-1 text-center font-semibold mb-2">`;
        dayNames.forEach(day => { html += `<div class="text-gray-500">${day}</div>`; });
        html += `</div><div class="calendar-grid gap-1">`;
        for (let i = 0; i < startDayOfWeek; i++) { html += `<div></div>`; }
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const dateStr = formatDateYMD(currentDate);
            let classes = 'calendar-day cursor-pointer p-2 rounded-lg flex justify-center items-center h-12';
            if (studyPlan.tasks[dateStr]?.length > 0 || studyPlan.reviews[dateStr]?.length > 0) classes += ' has-task';
            if (isSameDay(currentDate, viewDate)) classes += ' selected';
            html += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
        }
        html += `</div>`;
        calendarContainer.innerHTML = html;
    }

    const renderPlan = (date) => {
        document.getElementById('calendar-container').style.display = 'block';
        renderCalendar(date);
        const dateStr = formatDateYMD(date);
        planContent.innerHTML = '';
        const todayStr = formatDateYMD(new Date());
        const tasksForDay = studyPlan.tasks[dateStr] || [];
        const reviewsForDay = studyPlan.reviews[dateStr] || [];

        if (tasksForDay.length === 0 && reviewsForDay.length === 0) {
            planContent.innerHTML = `<div class="text-center p-4 bg-gray-50 rounded-lg"><p class="text-gray-500">Nenhuma tarefa agendada para hoje. Dia de descanso!</p></div>`;
            return;
        }

        const createSection = (title, tasks, colorClass) => {
            if (tasks.length > 0) {
                let sectionHTML = `<h3 class="text-lg font-bold mt-4 border-b-2 ${colorClass} pb-2">${title}</h3>`;
                tasks.forEach(task => { sectionHTML += createTaskCard(task, !task.completed && task.date < todayStr && !task.type.startsWith('review')).outerHTML; });
                return sectionHTML;
            }
            return '';
        };

        planContent.innerHTML += createSection('☕ Bloco 1: Conteúdo Principal (Vídeo)', tasksForDay.filter(t => t.type === 'video'), 'border-amber-500');
        planContent.innerHTML += createSection('📖 Bloco 2: Leitura e Lógica (PDF)', tasksForDay.filter(t => t.type === 'pdf'), 'border-sky-500');
        
        let bloco3Content = createSection('', tasksForDay.filter(t => t.type === 'legis'), '');
        const dailyGoal = studyPlan.dailyGoals[dateStr] || { exercisesCompleted: false };
        bloco3Content += `<div class="task-card p-4 rounded-lg bg-white border-l-4 border-gray-400"><div class="flex items-start space-x-4"><div class="flex-shrink-0 pt-1"><input type="checkbox" id="exercises-checkbox-${dateStr}" data-date="${dateStr}" class="daily-goal-checkbox h-5 w-5 rounded border-gray-300 text-[#D5A021] focus:ring-[#D5A021]" ${dailyGoal.exercisesCompleted ? 'checked' : ''}></div><div class="flex-1"><label for="exercises-checkbox-${dateStr}" class="cursor-pointer"><p class="font-semibold text-gray-800">🎯 Meta de Exercícios do Dia</p><p class="text-sm text-gray-600">Focar em 2 matérias conforme o plano de rotação semanal.</p></label></div></div></div>`;
        planContent.innerHTML += `<h3 class="text-lg font-bold mt-6 border-b-2 border-emerald-500 pb-2">🎯 Bloco 3: Estudo Ativo e Fixação</h3>` + bloco3Content;

        if (reviewsForDay.length > 0) {
            planContent.innerHTML += createSection('🔁 Revisões Agendadas', reviewsForDay, 'border-red-400');
        }
    };
    
    // =================== LÓGICA DE PROGRESSO E GRÁFICOS ===================
    const updateProgress = () => {
        const allStudyTasks = Object.values(studyPlan.tasks || {}).flat();
        const completedStudyTasks = allStudyTasks.filter(task => task.completed).length;
        const totalStudyTasks = allStudyTasks.length;
        const percentage = totalStudyTasks > 0 ? Math.round((completedStudyTasks / totalStudyTasks) * 100) : 0;
        document.getElementById('progressText').textContent = `${percentage}%`;
        
        if (progressChart) {
            const allTasksAndReviews = allStudyTasks.concat(Object.values(studyPlan.reviews || {}).flat());
            const totalCompleted = allTasksAndReviews.filter(t => t.completed).length;
            const totalItems = allTasksAndReviews.length;
            progressChart.data.datasets[0].data = [totalCompleted, totalItems - totalCompleted];
            progressChart.update();
        }
        renderSubjectProgress();
        renderFreeSectionsStat();
    };

    const renderSubjectProgress = () => {
        const container = document.getElementById('subject-progress-bars');
        if (!container) return;
        const allStudyTasks = Object.values(studyPlan.tasks || {}).flat();
        if (allStudyTasks.length === 0) { container.innerHTML = ''; return; }
        const subjects = [...new Set(allStudyTasks.map(task => task.subject))];
        container.innerHTML = subjects.sort().map(subject => {
            const tasksForSubject = allStudyTasks.filter(task => task.subject === subject);
            const completedTasks = tasksForSubject.filter(task => task.completed).length;
            const totalTasks = tasksForSubject.length;
            const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            return `<div><div class="flex justify-between mb-1"><span class="text-sm font-semibold">${subject}</span><span class="text-sm font-semibold text-gray-600">${completedTasks}/${totalTasks} (${percentage}%)</span></div><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-[#D5A021] h-2.5 rounded-full" style="width: ${percentage}%"></div></div></div>`;
        }).join('');
    };

    function renderFreeSectionsStat() {
        const container = document.getElementById('free-sections-container');
        if (!container) return;
        const allTaskDates = Object.keys(studyPlan.tasks || {});
        if (allTaskDates.length === 0) { container.innerHTML = ''; return; }

        const lastScheduledDateStr = allTaskDates.reduce((max, current) => current > max ? current : max);
        const lastScheduledDate = new Date(lastScheduledDateStr + 'T03:00:00Z');
        const examEve = new Date('2025-10-25T03:00:00Z');

        let content = '';
        if (lastScheduledDate >= examEve) {
            content = `<p class="text-2xl font-bold">0 dias</p><p class="text-sm text-gray-600">Seu cronograma está preenchido até a véspera da prova.</p>`;
        } else {
            let freeDays = 0;
            let currentDate = new Date(lastScheduledDate);
            currentDate.setDate(currentDate.getDate() + 1);
            while(currentDate <= examEve) {
                freeDays++;
                currentDate.setDate(currentDate.getDate() + 1);
            }
            const freeHours = freeDays * 6;
            const totalDays = Math.floor((examEve - lastScheduledDate) / (1000 * 60 * 60 * 24));
            content = `<p class="text-2xl font-bold">${freeHours} horas</p><p class="text-sm text-gray-600">(${totalDays} dias corridos) para remanejar aulas.</p>`;
        }
        
        container.innerHTML = `<div class="p-4 rounded-lg bg-gray-100 border text-center"><h3 class="font-bold text-lg mb-2">"Gordura" no Cronograma</h3>${content}</div>`;
    }

    const setupChart = () => {
        const ctx = document.getElementById('progressChart').getContext('2d');
        const theme = localStorage.getItem('study-theme') || 'theme-light';
        let bgColor = '#EAEAEA';
        let borderColor = '#FFFFFF';
        if (theme === 'theme-dark') {
            bgColor = '#374151';
            borderColor = '#1f2937';
        } else if (theme === 'theme-sepia') {
            bgColor = '#eee8d5';
            borderColor = '#fdf6e3';
        }

        progressChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Concluído', 'Pendente'], datasets: [{ data: [0, 1], backgroundColor: ['#D5A021', bgColor], borderColor: [borderColor], borderWidth: 2, hoverOffset: 4 }] },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                cutout: '75%', 
                plugins: { 
                    legend: { display: false }, 
                    tooltip: { 
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const value = context.raw;
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${value} (${percentage}%)`;
                            }
                        }
                    } 
                } 
            }
        });
    };

    // =================== LÓGICA DOS MODAIS ===================
    function renderAllTasksTable() {
        const tableBody = document.getElementById('all-tasks-table-body');
        const resultsContainer = document.getElementById('results-count-container');
        
        const allTasks = Object.values(studyPlan.tasks || {}).flat();
        const allReviews = Object.values(studyPlan.reviews || {}).flat();
        let itemsToShow;
        
        const reviewsOnlyFilter = document.getElementById('filter-reviews').checked;
        if (reviewsOnlyFilter) {
            itemsToShow = allReviews;
        } else {
            itemsToShow = [...allTasks, ...allReviews];
        }
        
        const totalItemsCount = itemsToShow.length;

        const subjectFilter = document.getElementById('filter-subject').value;
        if (subjectFilter) itemsToShow = itemsToShow.filter(task => task.subject === subjectFilter);
        
        const notCompletedFilter = document.getElementById('filter-not-completed').checked;
        if (notCompletedFilter) itemsToShow = itemsToShow.filter(task => !task.completed);
        
        const completedFilter = document.getElementById('filter-completed').checked;
        if (completedFilter) itemsToShow = itemsToShow.filter(task => task.completed);
        
        const overdueFilter = document.getElementById('filter-overdue').checked;
        if (overdueFilter) {
            const todayStr = formatDateYMD(new Date());
            itemsToShow = itemsToShow.filter(task => !task.completed && task.date < todayStr);
        }

        const searchText = document.getElementById('all-tasks-search').value.toLowerCase();
        if (searchText) itemsToShow = itemsToShow.filter(task => task.subject.toLowerCase().includes(searchText) || task.topic.toLowerCase().includes(searchText));
        
        resultsContainer.textContent = `Mostrando ${itemsToShow.length} de ${totalItemsCount} itens.`;

        const sortBy = document.getElementById('sort-by').value;
        itemsToShow.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc': return new Date(b.date) - new Date(a.date);
                case 'subject-asc': return a.subject.localeCompare(b.subject);
                case 'subject-desc': return b.subject.localeCompare(a.subject);
                default: return new Date(a.date) - new Date(b.date);
            }
        });
        tableBody.innerHTML = itemsToShow.map(task => `<tr><td class="px-6 py-4"><input type="checkbox" class="task-select-checkbox h-4 w-4" data-id="${task.id}" data-date="${task.date}"></td><td class="px-6 py-4">${formatDateDMY(task.date)}</td><td class="px-6 py-4">${task.subject}</td><td class="px-6 py-4">${task.lesson}</td><td class="px-6 py-4">${task.topic}</td><td class="px-6 py-4 flex items-center gap-2"><button class="action-btn task-edit-btn-table" data-id="${task.id}" data-date="${task.date}" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg></button><button class="action-btn task-delete-btn-table" data-id="${task.id}" data-date="${task.date}" title="Excluir"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></td></tr>`).join('');
    }

    function renderHistoryTable() {
        const tableBody = document.getElementById('history-table-body');
        const history = [...(studyPlan.history || [])];
        if (history.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-8">Nenhuma aula concluída ainda.</td></tr>';
            return;
        }

        const sortBy = document.getElementById('history-sort-by').value;
        history.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc': return new Date(a.completionDate) - new Date(b.completionDate);
                case 'subject-asc': return a.subject.localeCompare(b.subject);
                default: return new Date(b.completionDate) - new Date(a.completionDate);
            }
        });

        tableBody.innerHTML = history.map(entry => `<tr>
            <td class="px-6 py-4">${formatDateDMY(entry.completionDate)}</td>
            <td class="px-6 py-4">${entry.subject}</td>
            <td class="px-6 py-4">${entry.topic}</td>
            <td class="px-6 py-4">
                <button class="history-delete-btn text-red-500 hover:text-red-700" data-task-id="${entry.taskId}" title="Excluir do Histórico">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        </tr>`).join('');
    }

    function renderTrashTable() {
        const tableBody = document.getElementById('trash-table-body');
        const deletedTasks = Object.values(studyPlan.deletedTasks || {});
        if (deletedTasks.length === 0) { tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8">A lixeira está vazia.</td></tr>'; return; }
        tableBody.innerHTML = deletedTasks.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)).map(task => `<tr><td class="px-6 py-4"><input type="checkbox" class="trash-select-checkbox h-4 w-4" data-id="${task.id}"></td><td class="px-6 py-4">${formatDateDMY(task.date)}</td><td class="px-6 py-4">${task.subject}</td><td class="px-6 py-4">${task.topic}</td><td class="px-6 py-4 space-x-2"><button class="restore-btn text-green-600" data-id="${task.id}">Restaurar</button><button class="perm-delete-btn text-red-600" data-id="${task.id}">Excluir</button></td></tr>`).join('');
    }

    function renderAllTasksStatistics() {
        const statsContainer = document.getElementById('all-tasks-stats');
        const allTasks = Object.values(studyPlan.tasks || {}).flat();
        const totalTasks = allTasks.length;
        const subjectCounts = allTasks.reduce((acc, task) => { acc[task.subject] = (acc[task.subject] || 0) + 1; return acc; }, {});
        
        let statsHtml = `<div class="p-2 bg-[#D5A021] text-white rounded-lg shadow stat-card" data-subject="all"><p class="font-bold text-lg">${totalTasks}</p><p class="text-sm">Total de Aulas</p></div>`;
        
        Object.entries(subjectCounts).sort().forEach(([subject, count]) => { 
            statsHtml += `<div class="p-2 bg-white rounded-lg stat-card shadow"><p class="font-bold text-lg">${count}</p><p class="text-sm text-gray-600">${subject}</p></div>`; 
        });
        statsContainer.innerHTML = statsHtml;
    }

    function renderOverdueTasks() {
        document.getElementById('calendar-container').style.display = 'none';
        planContent.innerHTML = '';
        const todayStr = formatDateYMD(new Date());
        const allTasks = Object.values(studyPlan.tasks || {}).flat();
        const overdueTasks = allTasks.filter(task => !task.completed && task.date < todayStr);
        
        let overdueHours = 0;
        overdueTasks.forEach(task => {
            if (task.type === 'pdf') {
                overdueHours += 2.5;
            } else {
                overdueHours += 0.75; // 45 min
            }
        });

        let headerHTML = `<div class="flex justify-between items-center mb-4">
                            <h2 class="text-2xl font-bold">Aulas Atrasadas</h2>
                          </div>`;

        if (overdueTasks.length === 0) { 
            planContent.innerHTML = headerHTML + `<div class="text-center p-4 bg-green-50 rounded-lg border border-green-200"><p class="text-green-700 font-semibold">Parabéns! Nenhuma tarefa atrasada.</p></div>`; 
            return; 
        }

        const totalTasks = Object.values(studyPlan.tasks || {}).flat().length;
        const overduePercentage = totalTasks > 0 ? ((overdueTasks.length / totalTasks) * 100).toFixed(1) : 0;
        
        planContent.innerHTML = headerHTML + `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><div class="bg-red-50 p-4 rounded-lg text-center"><p class="text-2xl font-bold text-red-700">${overdueTasks.length}</p><p class="text-sm font-semibold text-red-600">Total de Aulas Atrasadas</p></div><div class="bg-yellow-50 p-4 rounded-lg text-center"><p class="text-2xl font-bold text-yellow-700">${overduePercentage}%</p><p class="text-sm font-semibold text-yellow-600">do Total de Aulas</p></div><div class="bg-blue-50 p-4 rounded-lg text-center md:col-span-2"><p class="text-2xl font-bold text-blue-700">${overdueHours.toFixed(1)} horas</p><p class="text-sm font-semibold text-blue-600">de Estudo Acumulado (aprox.)</p></div></div>
        <div class="text-center mb-6">
             <button id="reschedule-overdue-btn" class="control-button text-sm font-semibold py-2 px-4 rounded-lg text-green-600 border-green-300">Encaixar Aulas Atrasadas</button>
        </div>`;
        
        const groupedByDate = overdueTasks.reduce((acc, task) => { (acc[task.date] = acc[task.date] || []).push(task); return acc; }, {});
        Object.keys(groupedByDate).sort().forEach(dateStr => {
            const dateTitle = document.createElement('h3');
            dateTitle.className = "text-lg font-bold mt-6 border-b-2 border-red-400 pb-2";
            dateTitle.textContent = `Atrasadas de: ${formatDateDMY(dateStr)}`;
            planContent.appendChild(dateTitle);
            groupedByDate[dateStr].forEach(task => planContent.appendChild(createTaskCard(task, true)));
        });
    }
    
    const startCountdown = () => {
        const countdownEl = document.getElementById('countdown');
        const examDate = new Date('2025-10-26T11:00:00Z').getTime();
        const update = () => {
            const distance = examDate - new Date().getTime();
            if (distance < 0) { countdownEl.innerHTML = "PROVA REALIZADA!"; clearInterval(interval); return; }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            countdownEl.innerHTML = `${days}d ${hours}h`;
        };
        const interval = setInterval(update, 1000 * 60 * 60);
        update();
    };

    function openEditModalFromList(taskId, taskDate) {
        const task = studyPlan.tasks[taskDate]?.find(t => t.id === taskId);
        if (task) {
            populateSubjectSelect(document.getElementById('task-subject'));
            document.getElementById('modal-title').textContent = 'Editar Aula';
            document.getElementById('task-id').value = task.id;
            document.getElementById('original-task-date').value = task.date;
            document.getElementById('task-date').value = task.date;
            document.getElementById('task-subject').value = task.subject;
            document.getElementById('task-lesson').value = task.lesson;
            document.getElementById('task-topic').value = task.topic;
            document.getElementById('task-type').value = task.type;
            document.getElementById('task-notebook-link').value = task.notebookLink || '';
            document.getElementById('task-notes').value = task.notes || '';
            
            const completedContainer = document.getElementById('completed-checkbox-container');
            const completedCheckbox = document.getElementById('task-completed-checkbox');
            completedContainer.classList.remove('hidden');
            completedContainer.classList.add('flex');
            completedCheckbox.checked = task.completed;

            openModal(addTaskModal);
        }
    }

    function populateSubjectSelect(selectElement) {
        const allTasks = Object.values(studyPlan.tasks || {}).flat();
        const subjects = [...new Set(allTasks.map(task => task.subject))].sort();
        selectElement.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join('') + '<option value="new">Adicionar nova...</option>';
    }

    function shiftAllTasks(days) {
        const newTasks = {};
        const allTasks = Object.values(studyPlan.tasks).flat();
        
        allTasks.forEach(task => {
            if (!task.completed) {
                const currentDate = new Date(task.date + 'T03:00:00Z');
                const newDate = addDays(currentDate, days);
                const newDateStr = formatDateYMD(newDate);
                task.date = newDateStr;
            }
            const dateStr = task.date;
            if (!newTasks[dateStr]) newTasks[dateStr] = [];
            newTasks[dateStr].push(task);
        });
        studyPlan.tasks = newTasks;
        saveState();
        renderAllTasksTable();
        updateProgress();
        renderPlan(viewDate);
    }

    function shiftSelectedTasks(days) {
        const selected = Array.from(document.querySelectorAll('#all-tasks-table-body .task-select-checkbox:checked')).map(cb => ({ id: cb.dataset.id, date: cb.dataset.date }));
        if (selected.length === 0) return;

        selected.forEach(item => {
            const taskIndex = studyPlan.tasks[item.date]?.findIndex(t => t.id === item.id);
            if (taskIndex > -1) {
                const [task] = studyPlan.tasks[item.date].splice(taskIndex, 1);
                if (studyPlan.tasks[item.date].length === 0) delete studyPlan.tasks[item.date];

                const newDate = addDays(new Date(task.date + 'T03:00:00Z'), days);
                const newDateStr = formatDateYMD(newDate);
                task.date = newDateStr;
                if (!studyPlan.tasks[newDateStr]) studyPlan.tasks[newDateStr] = [];
                studyPlan.tasks[newDateStr].push(task);
            }
        });
        saveState();
        renderAllTasksTable();
        updateProgress();
        renderPlan(viewDate);
        updateSelectedActionsVisibility();
    }

    function updateSelectedActionsVisibility() {
        const selectedCount = document.querySelectorAll('#all-tasks-table-body .task-select-checkbox:checked').length;
        const container = document.getElementById('selected-actions-container');
        const countSpan = document.getElementById('selection-count');

        if (selectedCount > 1) {
            countSpan.textContent = `${selectedCount} aulas selecionadas:`;
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }

    function updateTrashActionsVisibility() {
        const anySelected = document.querySelectorAll('#trash-table-body .trash-select-checkbox:checked').length > 0;
        document.getElementById('trash-actions-container').classList.toggle('hidden', !anySelected);
    }

    // =================== LÓGICA DE CSV ===================
    function exportToCSV() {
        const allTasks = Object.values(studyPlan.tasks || {}).flat();
        if (allTasks.length === 0) {
            alert("Nenhuma aula para exportar.");
            return;
        }
        const headers = ['date', 'subject', 'lesson', 'topic', 'type', 'completed', 'notebookLink', 'notes'];
        const csvRows = [headers.join(',')];
        
        allTasks.forEach(task => {
            const row = headers.map(header => `"${(task[header] || '').replace(/"/g, '""')}"`);
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "plano_de_estudos.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function importFromCSV(file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const csv = event.target.result;
            const lines = csv.split('\n').filter(line => line);
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            const requiredHeaders = ['date', 'subject', 'lesson', 'topic', 'type'];
            if (!requiredHeaders.every(h => headers.includes(h))) {
                showConfirmation("O arquivo CSV é inválido ou não contém os cabeçalhos necessários (date, subject, lesson, topic, type).", () => {});
                return;
            }

            let newTasksCount = 0;
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const taskData = {};
                headers.forEach((header, index) => {
                    taskData[header] = values[index];
                });

                if (taskData.date && taskData.subject && taskData.lesson && taskData.topic && taskData.type) {
                    const dateStr = formatDateYMD(new Date(taskData.date + 'T03:00:00Z'));
                    const newTask = {
                        id: generateUniqueId(taskData),
                        date: dateStr,
                        subject: taskData.subject,
                        lesson: taskData.lesson,
                        topic: taskData.topic,
                        type: taskData.type,
                        completed: taskData.completed === 'true' || false,
                        notebookLink: taskData.notebookLink || '',
                        notes: taskData.notes || ''
                    };
                    if (!studyPlan.tasks[dateStr]) studyPlan.tasks[dateStr] = [];
                    studyPlan.tasks[dateStr].push(newTask);
                    newTasksCount++;
                }
            }
            if (newTasksCount > 0) {
                saveState();
                populateInitialHistory();
                updateProgress();
                renderAllTasksTable();
                renderAllTasksStatistics();
                showConfirmation(`${newTasksCount} aulas importadas com sucesso!`, () => {});
            }
        };
        reader.readAsText(file);
    }


    // =================== EVENT LISTENERS (PONTO DE IGNIÇÃO) ===================
    document.addEventListener('DOMContentLoaded', async () => {
        
        const savedTheme = localStorage.getItem('study-theme') || 'theme-light';
        themeSelector.value = savedTheme;
        applyTheme(savedTheme);

        if (isAuthenticated) {
            await loadState(); 
            populateInitialHistory();
            setupChart();
            renderPlan(viewDate);
            updateProgress();
            startCountdown();
        }

        passwordForm.addEventListener('submit', async () => {
            if (isAuthenticated) {
                await loadState();
                populateInitialHistory();
                setupChart();
                renderPlan(viewDate);
                updateProgress();
                startCountdown();
            }
        });

        const settingsButton = document.getElementById('settings-button');
        const settingsMenu = document.getElementById('settings-menu');

        settingsButton.addEventListener('click', (event) => {
            event.stopPropagation(); 
            settingsMenu.classList.toggle('hidden');
        });

        window.addEventListener('click', (event) => {
            if (!settingsMenu.classList.contains('hidden') && !settingsMenu.contains(event.target) && event.target !== settingsButton) {
                settingsMenu.classList.add('hidden');
            }
        });
        
        document.getElementById('home-btn').addEventListener('click', () => {
             document.getElementById('calendar-container').style.display = 'block';
             viewDate = new Date();
             renderPlan(viewDate);
        });
        
        document.getElementById('add-task-btn-modal').addEventListener('click', () => {
             document.getElementById('add-task-form').reset();
             populateSubjectSelect(document.getElementById('task-subject'));
             document.getElementById('modal-title').textContent = 'Incluir Nova Aula';
             document.getElementById('task-id').value = '';
             document.getElementById('original-task-date').value = '';
             document.getElementById('completed-checkbox-container').classList.add('hidden');
             openModal(addTaskModal);
        });

        document.getElementById('manage-tasks-btn').addEventListener('click', () => {
            const allTasks = Object.values(studyPlan.tasks || {}).flat();
            const subjects = [...new Set(allTasks.map(task => task.subject))].sort();
            const filterSelect = document.getElementById('filter-subject');
            filterSelect.innerHTML = '<option value="">Todas</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
            renderAllTasksTable();
            renderAllTasksStatistics();
            updateSelectedActionsVisibility();
            openModal(allTasksModal);
        });
        
        document.getElementById('add-task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('task-id').value;
            const originalDate = document.getElementById('original-task-date').value;
            const date = document.getElementById('task-date').value;
            const subject = document.getElementById('task-subject').value;
            const lesson = document.getElementById('task-lesson').value;
            const topic = document.getElementById('task-topic').value;
            const type = document.getElementById('task-type').value;
            const notebookLink = document.getElementById('task-notebook-link').value;
            const notes = document.getElementById('task-notes').value;
            const isCompleted = document.getElementById('task-completed-checkbox').checked;

            let taskData;

            if (id && originalDate && studyPlan.tasks[originalDate]) {
                const taskIndex = studyPlan.tasks[originalDate].findIndex(t => t.id === id);
                if (taskIndex > -1) {
                    taskData = studyPlan.tasks[originalDate][taskIndex];
                    // Update existing task data
                    taskData.date = date;
                    taskData.subject = subject;
                    taskData.lesson = lesson;
                    taskData.topic = topic;
                    taskData.type = type;
                    taskData.notebookLink = notebookLink;
                    taskData.notes = notes;
                    
                    // Handle completion status change
                    if (taskData.completed !== isCompleted) {
                        taskData.completed = isCompleted;
                        if (isCompleted) {
                            addToHistory(taskData);
                            if (!taskData.type.startsWith('review')) scheduleReviews(taskData);
                        } else {
                            removeFromHistory(taskData.id);
                            if (!taskData.type.startsWith('review')) unscheduleReviews(taskData);
                        }
                    }

                    // Move task if date changed
                    if (originalDate !== date) {
                        studyPlan.tasks[originalDate].splice(taskIndex, 1);
                        if (studyPlan.tasks[originalDate].length === 0) delete studyPlan.tasks[originalDate];
                        if (!studyPlan.tasks[date]) studyPlan.tasks[date] = [];
                        studyPlan.tasks[date].push(taskData);
                    }
                }
            } else {
                // Create new task
                taskData = { id: generateUniqueId({ subject, lesson, type }), date, subject, lesson, topic, type, notebookLink, notes, completed: false };
                if (!studyPlan.tasks[date]) studyPlan.tasks[date] = [];
                studyPlan.tasks[date].push(taskData);
            }

            saveState();
            renderPlan(viewDate);
            updateProgress();
            closeModal(addTaskModal);
        });

        planContent.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.task-edit-btn');
            const deleteBtn = e.target.closest('.task-delete-btn');
            const postponeBtn = e.target.closest('.task-postpone-btn');
            if (editBtn) openEditModalFromList(editBtn.dataset.id, editBtn.dataset.date);
            if (deleteBtn) {
                const { id, date } = deleteBtn.dataset;
                showConfirmation('Mover esta aula para a lixeira?', () => {
                    if (studyPlan.tasks[date]) {
                        const taskIndex = studyPlan.tasks[date].findIndex(t => t.id === id);
                        if (taskIndex > -1) {
                            const [taskToDelete] = studyPlan.tasks[date].splice(taskIndex, 1);
                            if (studyPlan.tasks[date].length === 0) delete studyPlan.tasks[date];
                            if (!studyPlan.deletedTasks) studyPlan.deletedTasks = {};
                            taskToDelete.deletedAt = new Date().toISOString();
                            studyPlan.deletedTasks[taskToDelete.id] = taskToDelete;
                            saveState();
                            renderPlan(viewDate);
                            updateProgress();
                        }
                    }
                });
            }
            if (postponeBtn) {
                const { id, date } = postponeBtn.dataset;
                const taskIndex = studyPlan.tasks[date]?.findIndex(t => t.id === id);
                if (taskIndex > -1) {
                    const task = studyPlan.tasks[date][taskIndex];
                    const nextDay = addDays(new Date(date + 'T03:00:00Z'), 1);
                    const nextDayStr = formatDateYMD(nextDay);
                    task.date = nextDayStr;
                    if (!studyPlan.tasks[nextDayStr]) studyPlan.tasks[nextDayStr] = [];
                    studyPlan.tasks[nextDayStr].push(task);
                    studyPlan.tasks[date].splice(taskIndex, 1);
                    if (studyPlan.tasks[date].length === 0) delete studyPlan.tasks[date];
                    saveState();
                    renderPlan(viewDate);
                }
            }
        });

        planContent.addEventListener('change', (e) => {
            if (e.target.matches('.task-checkbox')) {
                const { id, date, type } = e.target.dataset;
                let taskList = type.startsWith('review') ? studyPlan.reviews[date] : studyPlan.tasks[date];
                const task = taskList?.find(t => t.id === id);
                if (task) {
                    task.completed = e.target.checked;
                    if (task.completed) {
                        addToHistory(task);
                        if (!type.startsWith('review')) scheduleReviews(task);
                    } else {
                        removeFromHistory(task.id);
                        if (!type.startsWith('review')) unscheduleReviews(task);
                    }
                    updateProgress();
                    saveState();
                    renderPlan(viewDate);
                }
            }
            if (e.target.matches('.daily-goal-checkbox')) {
                const { date } = e.target.dataset;
                if (!studyPlan.dailyGoals[date]) studyPlan.dailyGoals[date] = {};
                studyPlan.dailyGoals[date].exercisesCompleted = e.target.checked;
                saveState();
            }
        });

        document.getElementById('calendar-container').addEventListener('click', (e) => {
            const dayElement = e.target.closest('.calendar-day');
            if (dayElement) { viewDate = new Date(dayElement.dataset.date + 'T03:00:00Z'); renderPlan(viewDate); }
            if (e.target.id === 'prev-month') { viewDate.setMonth(viewDate.getMonth() - 1); renderPlan(viewDate); }
            if (e.target.id === 'next-month') { viewDate.setMonth(viewDate.getMonth() + 1); renderPlan(viewDate); }
        });

        document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal'))));
        
        document.getElementById('export-backup-btn').addEventListener('click', (e) => {
            e.preventDefault();
            const dataStr = JSON.stringify(studyPlan, null, 2);
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr));
            linkElement.setAttribute('download', 'backup_plano_estudos.json');
            linkElement.click();
            settingsMenu.classList.add('hidden');
        });
        document.getElementById('import-backup-btn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('import-backup-file').click()
            settingsMenu.classList.add('hidden');
        });
        document.getElementById('import-backup-file').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (importedData.tasks) { studyPlan = importedData; saveState(); renderPlan(viewDate); updateProgress(); } 
                    else { showConfirmation('Arquivo de backup inválido.', ()=>{}); }
                } catch (err) { showConfirmation('Erro ao ler o arquivo.', ()=>{}); }
            };
            reader.readAsText(file);
            event.target.value = '';
        });
        document.getElementById('reset-btn').addEventListener('click', (e) => {
            e.preventDefault();
            settingsMenu.classList.add('hidden');
            showConfirmation('Tem certeza que deseja apagar todo o progresso?', () => {
                studyPlan = initializeStudyPlan();
                saveState();
                renderPlan(viewDate);
                updateProgress();
            });
        });

        document.getElementById('view-overdue-tasks-btn').addEventListener('click', renderOverdueTasks);
        
        ['all-tasks-search', 'filter-subject', 'sort-by', 'filter-not-completed', 'filter-completed', 'filter-overdue', 'filter-reviews'].forEach(id => {
            document.getElementById(id).addEventListener('input', renderAllTasksTable);
        });
        
         document.getElementById('all-tasks-stats').addEventListener('click', (e) => {
            const card = e.target.closest('.stat-card');
            if (card) {
                const subject = card.dataset.subject;
                document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                document.getElementById('filter-subject').value = (subject === 'all') ? '' : subject;
                renderAllTasksTable();
            }
        });

        document.getElementById('all-tasks-table-body').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.task-edit-btn-table');
            const deleteBtn = e.target.closest('.task-delete-btn-table');
            if (editBtn) {
                const { id, date } = editBtn.dataset;
                const task = (studyPlan.tasks[date] || []).find(t => t.id === id) || (studyPlan.reviews[date] || []).find(t => t.id === id);
                if(task && !task.type.startsWith('review')) {
                    openEditModalFromList(id, date);
                }
            }
            if (deleteBtn) {
                const { id, date } = deleteBtn.dataset;
                showConfirmation('Mover este item para a lixeira?', () => {
                    let taskList = studyPlan.tasks[date] || [];
                    let reviewList = studyPlan.reviews[date] || [];
                    let taskIndex = taskList.findIndex(t => t.id === id);
                    let reviewIndex = reviewList.findIndex(r => r.id === id);

                    if (taskIndex > -1) {
                        const [taskToDelete] = taskList.splice(taskIndex, 1);
                        if (taskList.length === 0) delete studyPlan.tasks[date];
                        if (!studyPlan.deletedTasks) studyPlan.deletedTasks = {};
                        taskToDelete.deletedAt = new Date().toISOString();
                        studyPlan.deletedTasks[taskToDelete.id] = taskToDelete;
                    } else if (reviewIndex > -1) {
                         const [reviewToDelete] = reviewList.splice(reviewIndex, 1);
                        if (reviewList.length === 0) delete studyPlan.reviews[date];
                        if (!studyPlan.deletedTasks) studyPlan.deletedTasks = {};
                        reviewToDelete.deletedAt = new Date().toISOString();
                        studyPlan.deletedTasks[reviewToDelete.id] = reviewToDelete;
                    }
                    saveState();
                    renderAllTasksTable();
                    updateProgress();
                });
            }
            if (e.target.classList.contains('task-select-checkbox')) {
                updateSelectedActionsVisibility();
            }
        });

        document.getElementById('select-all-tasks-checkbox').addEventListener('change', (e) => {
            document.querySelectorAll('#all-tasks-table-body .task-select-checkbox').forEach(checkbox => checkbox.checked = e.target.checked);
            updateSelectedActionsVisibility();
        });

        document.getElementById('delete-selected-btn').addEventListener('click', () => {
            const selected = Array.from(document.querySelectorAll('#all-tasks-table-body .task-select-checkbox:checked')).map(cb => ({ id: cb.dataset.id, date: cb.dataset.date }));
            if (selected.length === 0) return;
            showConfirmation(`Mover os ${selected.length} itens para a lixeira?`, () => {
                selected.forEach(item => {
                    let taskList = studyPlan.tasks[item.date] || [];
                    let reviewList = studyPlan.reviews[item.date] || [];
                    let taskIndex = taskList.findIndex(t => t.id === item.id);
                    let reviewIndex = reviewList.findIndex(r => r.id === item.id);

                    if (taskIndex > -1) {
                        const [taskToDelete] = taskList.splice(taskIndex, 1);
                        if (taskList.length === 0) delete studyPlan.tasks[item.date];
                         if (!studyPlan.deletedTasks) studyPlan.deletedTasks = {};
                        taskToDelete.deletedAt = new Date().toISOString();
                        studyPlan.deletedTasks[taskToDelete.id] = taskToDelete;
                    } else if (reviewIndex > -1) {
                         const [reviewToDelete] = reviewList.splice(reviewIndex, 1);
                        if (reviewList.length === 0) delete studyPlan.reviews[item.date];
                        if (!studyPlan.deletedTasks) studyPlan.deletedTasks = {};
                        reviewToDelete.deletedAt = new Date().toISOString();
                        studyPlan.deletedTasks[reviewToDelete.id] = reviewToDelete;
                    }
                });
                saveState();
                renderAllTasksTable();
                renderAllTasksStatistics();
                updateProgress();
                updateSelectedActionsVisibility();
            });
        });

        document.getElementById('shift-selected-forward-btn').addEventListener('click', () => shiftSelectedTasks(1));
        document.getElementById('shift-selected-backward-btn').addEventListener('click', () => shiftSelectedTasks(-1));
        document.getElementById('shift-all-forward-btn').addEventListener('click', () => showConfirmation('Adiar todas as aulas não-concluídas em 1 dia?', () => shiftAllTasks(1)));
        document.getElementById('shift-all-backward-btn').addEventListener('click', () => showConfirmation('Adiantar todas as aulas não-concluídas em 1 dia?', () => shiftAllTasks(-1)));

        // Lógica das Abas e Lixeira
        const tabs = ['active', 'history', 'trash'];
        tabs.forEach(tabId => {
            document.getElementById(`tab-${tabId}`).addEventListener('click', () => {
                tabs.forEach(id => {
                    document.getElementById(`tab-${id}`).classList.remove('active');
                    document.getElementById(`tab-content-${id}`).classList.add('hidden');
                });
                document.getElementById(`tab-${tabId}`).classList.add('active');
                document.getElementById(`tab-content-${tabId}`).classList.remove('hidden');

                if(tabId === 'history') renderHistoryTable();
                if(tabId === 'trash') renderTrashTable();
            });
        });

        document.getElementById('history-sort-by').addEventListener('change', renderHistoryTable);
        document.getElementById('history-table-body').addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.history-delete-btn');
            if (deleteBtn) {
                const taskId = deleteBtn.dataset.taskId;
                showConfirmation("Excluir este item do histórico? (Isso não marcará a aula como não-concluída)", () => {
                    removeFromHistory(taskId);
                    saveState();
                    renderHistoryTable();
                });
            }
        });

        document.getElementById('trash-table-body').addEventListener('click', (e) => {
            const { id } = e.target.dataset;
            if (e.target.classList.contains('restore-btn')) {
                const taskToRestore = studyPlan.deletedTasks[id];
                if (taskToRestore) {
                    if (taskToRestore.type.startsWith('review')) {
                        if (!studyPlan.reviews[taskToRestore.date]) studyPlan.reviews[taskToRestore.date] = [];
                        studyPlan.reviews[taskToRestore.date].push(taskToRestore);
                    } else {
                        if (!studyPlan.tasks[taskToRestore.date]) studyPlan.tasks[taskToRestore.date] = [];
                        studyPlan.tasks[taskToRestore.date].push(taskToRestore);
                    }
                    delete studyPlan.deletedTasks[id];
                    saveState();
                    renderTrashTable();
                    updateProgress();
                }
            }
            if (e.target.classList.contains('perm-delete-btn')) {
                showConfirmation('Excluir permanentemente?', () => {
                    if (studyPlan.deletedTasks[id]) {
                        delete studyPlan.deletedTasks[id];
                        saveState();
                        renderTrashTable();
                    }
                });
            }
            if(e.target.classList.contains('trash-select-checkbox')) {
                updateTrashActionsVisibility();
            }
        });
        document.getElementById('select-all-trash-checkbox').addEventListener('change', (e) => {
            document.querySelectorAll('#trash-table-body .trash-select-checkbox').forEach(checkbox => checkbox.checked = e.target.checked);
            updateTrashActionsVisibility();
        });
        document.getElementById('restore-all-btn').addEventListener('click', () => {
            const selectedIds = Array.from(document.querySelectorAll('#trash-table-body .trash-select-checkbox:checked')).map(cb => cb.dataset.id);
            if(selectedIds.length === 0) return;
            showConfirmation(`Restaurar ${selectedIds.length} itens da lixeira?`, () => {
                selectedIds.forEach(id => {
                    const taskToRestore = studyPlan.deletedTasks[id];
                    if (taskToRestore) {
                        if (taskToRestore.type.startsWith('review')) {
                            if (!studyPlan.reviews[taskToRestore.date]) studyPlan.reviews[taskToRestore.date] = [];
                            studyPlan.reviews[taskToRestore.date].push(taskToRestore);
                        } else {
                            if (!studyPlan.tasks[taskToRestore.date]) studyPlan.tasks[taskToRestore.date] = [];
                            studyPlan.tasks[taskToRestore.date].push(taskToRestore);
                        }
                        delete studyPlan.deletedTasks[id];
                    }
                });
                saveState();
                renderTrashTable();
                updateProgress();
                updateTrashActionsVisibility();
            });
        });
        document.getElementById('delete-all-perm-btn').addEventListener('click', () => {
            const selectedIds = Array.from(document.querySelectorAll('#trash-table-body .trash-select-checkbox:checked')).map(cb => cb.dataset.id);
            if(selectedIds.length === 0) return;
            showConfirmation(`Excluir permanentemente ${selectedIds.length} itens?`, () => {
                selectedIds.forEach(id => {
                    delete studyPlan.deletedTasks[id];
                });
                saveState();
                renderTrashTable();
                updateTrashActionsVisibility();
            });
        });

        // Event Listeners para CSV
        document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);
        document.getElementById('import-csv-btn').addEventListener('click', () => {
            document.getElementById('csv-file-input').click();
        });
        document.getElementById('csv-file-input').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                importFromCSV(file);
            }
            event.target.value = '';
        });

        // Adicionar nova matéria
        document.getElementById('task-subject').addEventListener('change', (e) => {
            if (e.target.value === 'new') {
                const newSubject = prompt("Digite o nome da nova matéria:");
                if (newSubject && newSubject.trim() !== '') {
                    const newOption = new Option(newSubject.trim(), newSubject.trim(), true, true);
                    e.target.add(newOption, e.target.options[e.target.options.length - 1]);
                } else {
                    e.target.value = e.target.options[0].value;
                }
            }
        });

    });