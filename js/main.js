// js/main.js
// Este arquivo contém toda a lógica da aplicação.

// =================== CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ===================
let viewDate = new Date();
viewDate.setHours(0, 0, 0, 0);
let studyPlan = {};
let systemSettings = {
    examDate: '2025-10-26',
    reviewCount: 5, // Padrão de 5 revisões
    subjects: {},
    blocks: [ // Configuração padrão dos blocos
        { id: 'video', title: '☕ Bloco 1: Conteúdo Principal (Vídeo)', color: 'border-amber-500', types: ['video'] },
        { id: 'pdf', title: '📖 Bloco 2: Leitura e Lógica (PDF)', color: 'border-sky-500', types: ['pdf'] },
        { id: 'active', title: '🎯 Bloco 3: Estudo Ativo e Fixação', color: 'border-emerald-500', types: ['legis', 'goal'] }
    ]
};
let progressChart;
let isAuthenticated = false;

// Referências a elementos do DOM
const planContent = document.getElementById('plan-content');
const allTasksModal = document.getElementById('allTasksModal');
const addTaskModal = document.getElementById('addTaskModal');
const confirmationModal = document.getElementById('confirmationModal');
const systemSettingsModal = document.getElementById('systemSettingsModal');
const passwordWall = document.getElementById('password-wall');
const appContainer = document.getElementById('app-container');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const passwordError = document.getElementById('password-error');
const themeSelector = document.getElementById('theme-selector');

// =================== LÓGICA DE TEMAS ===================
const applyTheme = (theme) => {
    document.documentElement.className = '';
    document.documentElement.classList.add(theme);
    localStorage.setItem('study-theme', theme);
    if (progressChart) {
        progressChart.destroy();
        setupChart();
        updateProgress();
    }
};

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
    if (modalElement) {
        modalElement.classList.remove('hidden');
        document.body.classList.add('modal-open');
    }
}

function closeModal(modalElement) {
    if (modalElement) {
        modalElement.classList.add('hidden');
        if (document.querySelectorAll('.modal:not(.hidden)').length === 0) {
            document.body.classList.remove('modal-open');
        }
    }
}

// =================== LÓGICA PRINCIPAL DA APLICAÇÃO ===================
function initializeStudyPlan(tasks) {
    let plan = { tasks: {}, reviews: {}, history: [], dailyGoals: {}, deletedTasks: {} };
    let combinedTasks = [...tasks]; 

    combinedTasks.forEach(task => {
        const id = generateUniqueId(task);
        const dateStr = formatDateYMD(new Date(task.date + 'T03:00:00Z'));
        if (!plan.tasks[dateStr]) plan.tasks[dateStr] = [];
        
        if (!plan.tasks[dateStr].some(t => t.id === id)) {
            plan.tasks[dateStr].push({ 
                id, 
                ...task, 
                date: dateStr, 
                originalDate: task.originalDate || dateStr,
                completed: task.completed || false, 
                link: task.link || '',
                notebookLink: task.notebookLink || '',
                notes: task.notes || '',
                pagesRead: task.pagesRead || null,
                pagesTotal: task.pagesTotal || null
            });
        }
    });
    return plan;
}

const saveState = () => {
    db.collection("progresso").doc("meuPlano").set(studyPlan).catch((error) => console.error("Erro ao salvar plano: ", error));
    db.collection("progresso").doc("configuracoes").set(systemSettings).catch((error) => console.error("Erro ao salvar configurações: ", error));
};

const loadState = async () => {
    const docRef = db.collection("progresso").doc("meuPlano");
    try {
        const doc = await docRef.get();
        if (doc.exists && doc.data().tasks && Object.keys(doc.data().tasks).length > 0) { 
            studyPlan = doc.data();
            Object.values(studyPlan.tasks).flat().forEach(task => {
                if (!task.originalDate) {
                    task.originalDate = task.date;
                }
            });
        } else {
            console.log("Nenhum plano encontrado, inicializando um novo a partir de data.js.");
            studyPlan = initializeStudyPlan(allTasks);
        }
    } catch (error) {
        console.error("Erro ao carregar plano: ", error);
        studyPlan = initializeStudyPlan(allTasks);
    }

    const settingsDoc = await db.collection("progresso").doc("configuracoes").get();
    if (settingsDoc.exists) {
        systemSettings = {...systemSettings, ...settingsDoc.data()};
    }
    
    // Garante que todas as matérias existentes tenham uma entrada de configuração
    const allTasksList = Object.values(studyPlan.tasks || {}).flat();
    const subjects = [...new Set(allTasksList.map(task => task.subject))];
    subjects.forEach(subject => {
        if (!systemSettings.subjects[subject]) {
            systemSettings.subjects[subject] = { 
                countsTowardsProgress: true,
                showInProgressBar: true 
            };
        }
    });
    
    saveState();
};

function createTaskCard(task, isOverdue = false) {
    const card = document.createElement('div');
    let cardClasses = 'task-card p-4 rounded-lg bg-white';
    if (task.type.startsWith('review')) cardClasses += ` ${task.type}`;
    if (task.type === 'legis') cardClasses += ' legis';
    if (isOverdue) cardClasses += ' overdue';
    if (task.link) cardClasses += ' clickable';
    card.className = cardClasses;
    card.dataset.id = task.id;
    card.dataset.date = task.date;

    const title = task.type.startsWith('review') ? `${task.reviewType}: ${task.subject} - Aula ${task.lesson}` : `${task.subject} - Aula ${task.lesson}`;
    
    const typeIcon = task.type === 'video' 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-gray-500"><path d="m22 8-6 4 6 4V8Z"></path><rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect></svg>` 
        : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-gray-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;

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
    
    let pdfProgressHTML = '';
    if (task.type === 'pdf' && task.pagesRead > 0 && task.pagesTotal > 0) {
        const percentage = Math.round((task.pagesRead / task.pagesTotal) * 100);
        pdfProgressHTML = `
            <div class="mt-2">
                <div class="flex justify-between text-xs text-gray-500">
                    <span>Progresso PDF</span>
                    <span>${percentage}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div class="bg-sky-500 h-1.5 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>`;
    }

    card.innerHTML = `
        <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 pt-1"><input type="checkbox" id="${task.id}" data-id="${task.id}" data-date="${task.date}" data-type="${task.type}" class="task-checkbox h-5 w-5 rounded border-gray-300 text-[#D5A021] focus:ring-[#D5A021]" ${task.completed ? 'checked' : ''}></div>
            <div class="flex-1">
                <label for="${task.id}" class="cursor-pointer">
                    <p class="font-semibold text-gray-800 flex items-center">${!task.type.startsWith('review') ? typeIcon : ''} ${title}</p>
                    <p class="text-sm text-gray-600">${task.topic}</p>
                    ${isOverdue ? `<p class="text-xs text-red-600 font-semibold">Atrasada desde: ${formatDateDMY(task.date)}</p>` : ''}
                </label>
                ${pdfProgressHTML}
            </div>
        </div>
        ${actionsMenu}`;
    return card;
}

function scheduleReviews(completedTask) {
    const completionDate = new Date(completedTask.date + 'T03:00:00Z');
    const reviewMap = {
        1: { 'review-r1': 1 },
        3: { 'review-r1': 1, 'review-r3': 7 },
        5: { 'review-r1': 1, 'review-r3': 7, 'review-r5': 30 }
    };
    const reviewsToSchedule = reviewMap[systemSettings.reviewCount] || reviewMap[5];

    for (const [reviewType, daysToAdd] of Object.entries(reviewsToSchedule)) {
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
    const reviewDays = { 'review-r1': 1, 'review-r3': 7, 'review-r5': 30 };
    for (const [reviewType, daysToAdd] of Object.entries(reviewDays)) {
        const reviewDate = addDays(new Date(deselectedTask.date + 'T03:00:00Z'), daysToAdd);
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
    
    systemSettings.blocks.forEach(block => {
        const tasksForBlock = tasksForDay.filter(t => block.types.includes(t.type));
        if (tasksForBlock.length > 0) {
            let sectionHTML = `<h3 class="text-lg font-bold mt-4 border-b-2 ${block.color} pb-2">${block.title}</h3>`;
            tasksForBlock.forEach(task => { sectionHTML += createTaskCard(task, !task.completed && task.date < todayStr).outerHTML; });
            planContent.innerHTML += sectionHTML;
        }
    });

    const activeBlock = systemSettings.blocks.find(b => b.id === 'active');
    if (activeBlock && activeBlock.types.includes('goal')) {
        const dailyGoal = studyPlan.dailyGoals[dateStr] || { exercisesCompleted: false };
        const goalCard = `<div class="task-card p-4 rounded-lg bg-white border-l-4 border-gray-400"><div class="flex items-start space-x-4"><div class="flex-shrink-0 pt-1"><input type="checkbox" id="exercises-checkbox-${dateStr}" data-date="${dateStr}" class="daily-goal-checkbox h-5 w-5 rounded border-gray-300 text-[#D5A021] focus:ring-[#D5A021]" ${dailyGoal.exercisesCompleted ? 'checked' : ''}></div><div class="flex-1"><label for="exercises-checkbox-${dateStr}" class="cursor-pointer"><p class="font-semibold text-gray-800">🎯 Meta de Exercícios do Dia</p><p class="text-sm text-gray-600">Focar em 2 matérias conforme o plano de rotação semanal.</p></label></div></div></div>`;
        planContent.querySelector(`h3.${activeBlock.color}`)?.insertAdjacentHTML('afterend', goalCard);
    }

    if (reviewsForDay.length > 0) {
        let reviewHTML = `<h3 class="text-lg font-bold mt-6 border-b-2 border-red-400 pb-2">🔁 Revisões Agendadas</h3>`;
        reviewsForDay.forEach(task => { reviewHTML += createTaskCard(task, !task.completed && task.date < todayStr).outerHTML; });
        planContent.innerHTML += reviewHTML;
    }
};

const updateProgress = () => {
    const allStudyTasks = Object.values(studyPlan.tasks || {}).flat()
        .filter(t => systemSettings.subjects[t.subject]?.countsTowardsProgress);
    
    const completedStudyTasks = allStudyTasks.filter(task => task.completed).length;
    const totalStudyTasks = allStudyTasks.length;
    const percentage = totalStudyTasks > 0 ? Math.round((completedStudyTasks / totalStudyTasks) * 100) : 0;
    document.getElementById('progressText').textContent = `${percentage}%`;
    
    if (progressChart) {
        const allProgressItems = allStudyTasks.concat(Object.values(studyPlan.reviews || {}).flat());
        const totalCompleted = allProgressItems.filter(t => t.completed).length;
        const totalItems = allProgressItems.length;
        progressChart.data.datasets[0].data = [totalCompleted, totalItems - totalCompleted];
        progressChart.update();
    }
    renderSubjectProgress();
    renderRequiredPaceStats();
    renderRealTimePaceStats();
};

const renderSubjectProgress = () => {
    const container = document.getElementById('subject-progress-bars');
    if (!container) return;
    
    const allStudyTasks = Object.values(studyPlan.tasks || {}).flat()
        .filter(t => systemSettings.subjects[t.subject]?.countsTowardsProgress);
    
    const subjectsToShow = [...new Set(allStudyTasks.map(task => task.subject))]
        .filter(subject => systemSettings.subjects[subject]?.showInProgressBar);
        
    container.innerHTML = subjectsToShow.sort().map(subject => {
        const tasksForSubject = allStudyTasks.filter(task => task.subject === subject);
        const completedTasks = tasksForSubject.filter(task => task.completed).length;
        const totalTasks = tasksForSubject.length;
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return `<div><div class="flex justify-between mb-1"><span class="text-sm font-semibold">${subject}</span><span class="text-sm font-semibold text-gray-600">${completedTasks}/${totalTasks} (${percentage}%)</span></div><div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-[#D5A021] h-2.5 rounded-full" style="width: ${percentage}%"></div></div></div>`;
    }).join('');
};

function renderRequiredPaceStats() {
    const dailyStatEl = document.getElementById('daily-progress-stat');
    const weeklyStatEl = document.getElementById('weekly-progress-stat');
    const examDate = new Date(systemSettings.examDate + 'T11:00:00Z');
    const startDate = new Date();
    const totalDays = Math.ceil((examDate - startDate) / (1000 * 60 * 60 * 24));
    const totalWeeks = totalDays / 7;
    
    const remainingTasks = Object.values(studyPlan.tasks || {}).flat()
        .filter(t => systemSettings.subjects[t.subject]?.countsTowardsProgress && !t.completed).length;

    if (totalDays > 0 && remainingTasks > 0) {
        const dailyAvg = (remainingTasks / totalDays).toFixed(1);
        dailyStatEl.innerHTML = `<strong>Diário:</strong> <span class="text-gray-600">~${dailyAvg} aulas</span>`;
    } else {
        dailyStatEl.innerHTML = `<strong>Diário:</strong> <span class="text-gray-600">N/A</span>`;
    }
    if (totalWeeks > 0 && remainingTasks > 0) {
        const weeklyAvg = (remainingTasks / totalWeeks).toFixed(1);
        weeklyStatEl.innerHTML = `<strong>Semanal:</strong> <span class="text-gray-600">~${weeklyAvg} aulas</span>`;
    } else {
        weeklyStatEl.innerHTML = `<strong>Semanal:</strong> <span class="text-gray-600">N/A</span>`;
    }
}

function renderRealTimePaceStats() {
    const container = document.getElementById('real-time-stats-container');
    const history = studyPlan.history || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = addDays(weekStart, -7);

    const completedThisWeek = history.filter(h => new Date(h.completionDate) >= weekStart);
    const completedLastWeek = history.filter(h => {
        const d = new Date(h.completionDate);
        return d >= lastWeekStart && d < weekStart;
    });

    const daysPassedThisWeek = (today.getDay() === 0 ? 7 : today.getDay());
    const realDailyAvgThisWeek = (completedThisWeek.length / daysPassedThisWeek).toFixed(1);

    const examDate = new Date(systemSettings.examDate + 'T11:00:00Z');
    const totalDaysRemaining = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24));
    const remainingTasks = Object.values(studyPlan.tasks || {}).flat().filter(t => systemSettings.subjects[t.subject]?.countsTowardsProgress && !t.completed).length;
    const requiredDailyAvg = totalDaysRemaining > 0 ? (remainingTasks / totalDaysRemaining) : 0;

    let dailyComparisonHTML = '';
    if (realDailyAvgThisWeek >= requiredDailyAvg) {
        dailyComparisonHTML = `<span class="text-green-600 font-semibold ml-2">Você está no ritmo!</span>`;
    } else {
        const difference = (requiredDailyAvg - realDailyAvgThisWeek).toFixed(1);
        dailyComparisonHTML = `<span class="text-red-600 font-semibold ml-2">(-${difference} aulas/dia)</span>`;
    }

    const requiredWeeklyAvg = requiredDailyAvg * 7;
    const lastWeekPercentage = requiredWeeklyAvg > 0 ? ((completedLastWeek.length / requiredWeeklyAvg) * 100).toFixed(0) : 0;
    
    const allTasksList = Object.values(studyPlan.tasks || {}).flat();
    const rescheduledThisWeek = new Set(allTasksList.filter(task => {
        const lastModified = task.lastModified ? new Date(task.lastModified) : null;
        return task.date !== task.originalDate && lastModified && lastModified >= weekStart;
    }).map(task => task.id)).size;

    container.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-center">Seu Desempenho</h3>
        <div class="space-y-3 text-sm">
            <div>
                <p class="font-semibold">Ritmo diário nesta semana:</p>
                <p class="text-gray-600">${realDailyAvgThisWeek} aulas/dia ${dailyComparisonHTML}</p>
            </div>
            <div>
                <p class="font-semibold">Ritmo da semana anterior:</p>
                <p class="text-gray-600">${completedLastWeek.length} aulas (${lastWeekPercentage}% da meta)</p>
            </div>
            <div>
                <p class="font-semibold">Aulas remanejadas nesta semana:</p>
                <p class="text-gray-600">${rescheduledThisWeek} aulas</p>
            </div>
        </div>
    `;
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
                            if (label) { label += ': '; }
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

function renderAllTasksTable() {
    const tableBody = document.getElementById('all-tasks-table-body');
    const resultsContainer = document.getElementById('results-count-container');
    
    const allTasksList = Object.values(studyPlan.tasks || {}).flat();
    const allReviews = Object.values(studyPlan.reviews || {}).flat();
    let itemsToShow = [...allTasksList, ...allReviews];
    const totalItemsCount = itemsToShow.length;

    const subjectFilter = document.getElementById('filter-subject').value;
    if (subjectFilter) itemsToShow = itemsToShow.filter(task => task.subject === subjectFilter);
    
    const typeFilter = document.getElementById('filter-type').value;
    if (typeFilter) itemsToShow = itemsToShow.filter(task => task.type === typeFilter);

    const notCompletedFilter = document.getElementById('filter-not-completed').checked;
    if (notCompletedFilter) itemsToShow = itemsToShow.filter(task => !task.completed);
    const completedFilter = document.getElementById('filter-completed').checked;
    if (completedFilter) itemsToShow = itemsToShow.filter(task => task.completed);
    const overdueFilter = document.getElementById('filter-overdue').checked;
    if (overdueFilter) {
        const todayStr = formatDateYMD(new Date());
        itemsToShow = itemsToShow.filter(task => !task.completed && task.date < todayStr);
    }
    const reviewsOnlyFilter = document.getElementById('filter-reviews').checked;
    if (reviewsOnlyFilter) itemsToShow = itemsToShow.filter(task => task.type.startsWith('review'));
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

    tableBody.innerHTML = itemsToShow.map(task => {
        const typeIcon = task.type === 'video' 
            ? `<svg title="Videoaula" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-500"><path d="m22 8-6 4 6 4V8Z"></path><rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect></svg>` 
            : (task.type === 'pdf' 
                ? `<svg title="PDF" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`
                : (task.type === 'legis'
                    ? `<svg title="Legislação" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V2"></path><path d="M5 10.5c0-1.5 1.5-3 3-3s3 1.5 3 3-1.5 3-3 3-3-1.5-3-3z"></path><path d="M19 10.5c0-1.5-1.5-3-3-3s-3 1.5-3 3 1.5 3 3 3 3-1.5 3-3z"></path></svg>`
                    : ''));

        return `<tr>
                    <td class="px-6 py-4"><input type="checkbox" class="task-select-checkbox h-4 w-4" data-id="${task.id}" data-date="${task.date}"></td>
                    <td class="px-2 py-4">${typeIcon}</td>
                    <td class="px-6 py-4">${formatDateDMY(task.date)}</td>
                    <td class="px-6 py-4">${task.subject}</td>
                    <td class="px-6 py-4">${task.lesson}</td>
                    <td class="px-6 py-4">${task.topic}</td>
                    <td class="px-6 py-4 flex items-center gap-2">
                        <button class="action-btn task-edit-btn-table" data-id="${task.id}" data-date="${task.date}" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg></button>
                        <button class="action-btn task-delete-btn-table" data-id="${task.id}" data-date="${task.date}" title="Excluir"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </td>
                </tr>`;
    }).join('');
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
    const allTasksList = Object.values(studyPlan.tasks || {}).flat();
    const totalTasks = allTasksList.length;
    const subjectCounts = allTasksList.reduce((acc, task) => { acc[task.subject] = (acc[task.subject] || 0) + 1; return acc; }, {});
    
    let statsHtml = `<div class="p-2 rounded-lg shadow stat-card bg-amber-400 text-white selected" data-subject="all"><p class="font-bold text-lg">${totalTasks}</p><p class="text-sm">Total de Aulas</p></div>`;
    
    Object.entries(subjectCounts).sort().forEach(([subject, count]) => { 
        statsHtml += `<div class="p-2 bg-white rounded-lg stat-card shadow" data-subject="${subject}"><p class="font-bold text-lg">${count}</p><p class="text-sm text-gray-600">${subject}</p></div>`; 
    });
    statsContainer.innerHTML = statsHtml;
}

function renderOverdueTasks() {
    document.getElementById('calendar-container').style.display = 'none';
    planContent.innerHTML = '';
    const todayStr = formatDateYMD(new Date());

    const allTasksList = Object.values(studyPlan.tasks || {}).flat();
    const overdueTasks = allTasksList.filter(task => !task.completed && task.date < todayStr);
    
    const allReviewsList = Object.values(studyPlan.reviews || {}).flat();
    const overdueReviews = allReviewsList.filter(review => !review.completed && review.date < todayStr);

    let headerHTML = `<div class="flex justify-between items-center mb-4"><h2 class="text-2xl font-bold">Itens Atrasados</h2></div>`;
    planContent.innerHTML = headerHTML;

    // Abas
    planContent.innerHTML += `
        <div class="flex border-b mb-4">
            <button id="overdue-tab-tasks" class="tab-button active">Aulas (${overdueTasks.length})</button>
            <button id="overdue-tab-reviews" class="tab-button">Revisões (${overdueReviews.length})</button>
        </div>
        <div id="overdue-content-tasks" class="tab-pane"></div>
        <div id="overdue-content-reviews" class="tab-pane hidden"></div>
    `;

    const tasksContent = document.getElementById('overdue-content-tasks');
    const reviewsContent = document.getElementById('overdue-content-reviews');

    if (overdueTasks.length === 0) { 
        tasksContent.innerHTML = `<div class="text-center p-4 bg-green-50 rounded-lg border border-green-200"><p class="text-green-700 font-semibold">Parabéns! Nenhuma aula atrasada.</p></div>`; 
    } else {
        const groupedByDate = overdueTasks.reduce((acc, task) => { (acc[task.date] = acc[task.date] || []).push(task); return acc; }, {});
        Object.keys(groupedByDate).sort().forEach(dateStr => {
            const dateTitle = document.createElement('h3');
            dateTitle.className = "text-lg font-bold mt-6 border-b-2 border-red-400 pb-2";
            dateTitle.textContent = `Atrasadas de: ${formatDateDMY(dateStr)}`;
            tasksContent.appendChild(dateTitle);
            groupedByDate[dateStr].forEach(task => tasksContent.appendChild(createTaskCard(task, true)));
        });
    }
    
    if (overdueReviews.length === 0) { 
        reviewsContent.innerHTML = `<div class="text-center p-4 bg-green-50 rounded-lg border border-green-200"><p class="text-green-700 font-semibold">Nenhuma revisão atrasada.</p></div>`; 
    } else {
         overdueReviews.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(review => reviewsContent.appendChild(createTaskCard(review, true)));
    }
}

const startCountdown = () => {
    const countdownEl = document.getElementById('countdown');
    const countdownWeeksEl = document.getElementById('countdown-weeks');
    const examDate = new Date(systemSettings.examDate + 'T11:00:00Z').getTime();
    
    const update = () => {
        const distance = examDate - new Date().getTime();
        if (distance < 0) { 
            countdownEl.innerHTML = "PROVA REALIZADA!"; 
            countdownWeeksEl.innerHTML = "";
            if (interval) clearInterval(interval); 
            return; 
        }
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const weeks = Math.floor(days / 7);
        
        countdownEl.innerHTML = `${days}d ${hours}h`;
        countdownWeeksEl.innerHTML = `(Aprox. ${weeks} semanas)`;
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
        document.getElementById('original-task-date-input').value = task.date;
        document.getElementById('task-date').value = task.date;
        document.getElementById('task-subject').value = task.subject;
        document.getElementById('task-lesson').value = task.lesson;
        document.getElementById('task-topic').value = task.topic;
        document.getElementById('task-type').value = task.type;
        document.getElementById('task-link').value = task.link || '';
        document.getElementById('task-notebook-link').value = task.notebookLink || '';
        document.getElementById('task-notes').value = task.notes || '';
        
        const originalDateContainer = document.getElementById('original-date-container');
        if (task.originalDate && task.originalDate !== task.date) {
            document.getElementById('original-date-text').textContent = formatDateDMY(task.originalDate);
            originalDateContainer.classList.remove('hidden');
        } else {
            originalDateContainer.classList.add('hidden');
        }

        const pdfProgressContainer = document.getElementById('pdf-progress-container');
        if (task.type === 'pdf') {
            document.getElementById('pdf-pages-read').value = task.pagesRead || '';
            document.getElementById('pdf-pages-total').value = task.pagesTotal || '';
            pdfProgressContainer.classList.remove('hidden');
        } else {
            pdfProgressContainer.classList.add('hidden');
        }

        const completedContainer = document.getElementById('completed-checkbox-container');
        const completedCheckbox = document.getElementById('task-completed-checkbox');
        completedContainer.classList.remove('hidden');
        completedContainer.classList.add('flex');
        completedCheckbox.checked = task.completed;

        openModal(addTaskModal);
    }
}

function populateSubjectSelect(selectElement) {
    const allTasksList = Object.values(studyPlan.tasks || {}).flat();
    const subjects = [...new Set(allTasksList.map(task => task.subject))].sort();
    selectElement.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join('') + '<option value="new">Adicionar nova...</option>';
}

function shiftAllTasks(days) {
    const newTasks = {};
    const allTasksList = Object.values(studyPlan.tasks).flat();
    
    allTasksList.forEach(task => {
        if (!task.completed) {
            const currentDate = new Date(task.date + 'T03:00:00Z');
            const newDate = addDays(currentDate, days);
            const newDateStr = formatDateYMD(newDate);
            task.date = newDateStr;
            task.lastModified = new Date().toISOString();
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

// =================== EVENT LISTENERS (PONTO DE IGNIÇÃO) ===================
document.addEventListener('DOMContentLoaded', async () => {
    
    const savedTheme = localStorage.getItem('study-theme') || 'theme-light';
    themeSelector.value = savedTheme;
    applyTheme(savedTheme);

    const initializeApp = async () => {
        await loadState(); 
        document.getElementById('exam-date-display').textContent = formatDateDMY(systemSettings.examDate);
        setupChart();
        renderPlan(viewDate);
        updateProgress();
        startCountdown();
    };

    if (isAuthenticated) {
        await initializeApp();
    }

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (passwordInput.value === 'passei2025') {
            isAuthenticated = true;
            sessionStorage.setItem('isAuthenticated', 'true');
            passwordWall.classList.add('hidden');
            appContainer.classList.remove('blurred');
            await initializeApp();
        } else {
            passwordError.textContent = 'Senha incorreta.';
            passwordInput.value = '';
            setTimeout(() => { passwordError.textContent = ''; }, 2000);
        }
    });

    themeSelector.addEventListener('change', (e) => applyTheme(e.target.value));

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

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal')))
    });
    
    document.getElementById('manage-tasks-btn').addEventListener('click', () => {
        const allTasksList = Object.values(studyPlan.tasks || {}).flat();
        const subjects = [...new Set(allTasksList.map(task => task.subject))].sort();
        const filterSelect = document.getElementById('filter-subject');
        filterSelect.innerHTML = '<option value="">Todas</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        renderAllTasksTable();
        renderAllTasksStatistics();
        openModal(allTasksModal);
    });
    
    document.getElementById('view-overdue-tasks-btn').addEventListener('click', renderOverdueTasks);

    document.getElementById('calendar-container').addEventListener('click', (e) => {
        const dayElement = e.target.closest('.calendar-day');
        if (dayElement) { viewDate = new Date(dayElement.dataset.date + 'T03:00:00Z'); renderPlan(viewDate); }
        if (e.target.id === 'prev-month') { viewDate.setMonth(viewDate.getMonth() - 1); renderPlan(viewDate); }
        if (e.target.id === 'next-month') { viewDate.setMonth(viewDate.getMonth() + 1); renderPlan(viewDate); }
    });

    // Event Delegation para conteúdo dinâmico
    document.body.addEventListener('click', (e) => {
        // Ações nos cards da página principal
        const card = e.target.closest('.task-card');
        if (card) {
            if (e.target.closest('.task-edit-btn')) {
                openEditModalFromList(card.dataset.id, card.dataset.date);
            }
            if (e.target.closest('.task-delete-btn')) {
                const { id, date } = card.dataset;
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
            if (e.target.closest('.task-postpone-btn')) {
                const { id, date } = card.dataset;
                const taskIndex = studyPlan.tasks[date]?.findIndex(t => t.id === id);
                if (taskIndex > -1) {
                    const task = studyPlan.tasks[date][taskIndex];
                    const nextDay = addDays(new Date(date + 'T03:00:00Z'), 1);
                    const nextDayStr = formatDateYMD(nextDay);
                    task.date = nextDayStr;
                    task.lastModified = new Date().toISOString();
                    if (!studyPlan.tasks[nextDayStr]) studyPlan.tasks[nextDayStr] = [];
                    studyPlan.tasks[nextDayStr].push(task);
                    studyPlan.tasks[date].splice(taskIndex, 1);
                    if (studyPlan.tasks[date].length === 0) delete studyPlan.tasks[date];
                    saveState();
                    renderPlan(viewDate);
                }
            }
        }
        
        // Ações na tabela de Gerenciar Aulas
        const tableRow = e.target.closest('#all-tasks-table-body tr');
        if (tableRow) {
            if (e.target.closest('.task-edit-btn-table')) {
                const checkbox = tableRow.querySelector('.task-select-checkbox');
                openEditModalFromList(checkbox.dataset.id, checkbox.dataset.date);
            }
            if (e.target.closest('.task-delete-btn-table')) {
                 const checkbox = tableRow.querySelector('.task-select-checkbox');
                 const { id, date } = checkbox.dataset;
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
        }

        // Abas da tela de Atrasadas
        if(e.target.id === 'overdue-tab-tasks' || e.target.id === 'overdue-tab-reviews') {
            document.getElementById('overdue-tab-tasks').classList.toggle('active', e.target.id === 'overdue-tab-tasks');
            document.getElementById('overdue-content-tasks').classList.toggle('hidden', e.target.id !== 'overdue-tab-tasks');
            document.getElementById('overdue-tab-reviews').classList.toggle('active', e.target.id === 'overdue-tab-reviews');
            document.getElementById('overdue-content-reviews').classList.toggle('hidden', e.target.id !== 'overdue-tab-reviews');
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
    });
    
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

    ['all-tasks-search', 'filter-subject', 'sort-by', 'filter-type', 'filter-not-completed', 'filter-completed', 'filter-overdue', 'filter-reviews'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', renderAllTasksTable);
        }
    });

    document.getElementById('toggle-filters-btn').addEventListener('click', (e) => {
        document.getElementById('more-filters-container').classList.toggle('hidden');
        document.getElementById('filter-arrow').classList.toggle('rotate-180');
    });

    const openSystemBtn = document.getElementById('open-system-settings-btn');
    const saveSystemBtn = document.getElementById('save-system-settings-btn');
    const examDateInput = document.getElementById('exam-date-setting');

    openSystemBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const allSubjects = [...new Set(Object.values(studyPlan.tasks || {}).flat().map(t => t.subject))].sort();
        const progressContainer = document.getElementById('subject-progress-toggle-container');
        const displayContainer = document.getElementById('subject-display-toggle-container');
        const blocksContainer = document.getElementById('block-names-container');
        
        progressContainer.innerHTML = '';
        displayContainer.innerHTML = '';
        blocksContainer.innerHTML = '';

        allSubjects.forEach(subject => {
            const progChecked = systemSettings.subjects[subject]?.countsTowardsProgress ?? true;
            const dispChecked = systemSettings.subjects[subject]?.showInProgressBar ?? true;

            progressContainer.innerHTML += `<div class="flex items-center"><input id="prog-toggle-${subject}" type="checkbox" ${progChecked ? 'checked' : ''} data-subject="${subject}" class="h-4 w-4"><label for="prog-toggle-${subject}" class="ml-2">${subject}</label></div>`;
            displayContainer.innerHTML += `<div class="flex items-center"><input id="disp-toggle-${subject}" type="checkbox" ${dispChecked ? 'checked' : ''} data-subject="${subject}" class="h-4 w-4"><label for="disp-toggle-${subject}" class="ml-2">${subject}</label></div>`;
        });

        systemSettings.blocks.forEach(block => {
            blocksContainer.innerHTML += `<div class="flex items-center gap-2"><label for="block-name-${block.id}" class="text-sm">${block.id.toUpperCase()}:</label><input type="text" id="block-name-${block.id}" data-block-id="${block.id}" value="${block.title}" class="w-full border rounded-md p-1 text-sm"></div>`;
        });

        examDateInput.value = systemSettings.examDate || '2025-10-26';
        document.getElementById('review-count-setting').value = systemSettings.reviewCount || 5;

        openModal(systemSettingsModal);
        settingsMenu.classList.add('hidden');
    });

    saveSystemBtn.addEventListener('click', () => {
        document.querySelectorAll('#subject-progress-toggle-container input').forEach(cb => {
            const subject = cb.dataset.subject;
            if(!systemSettings.subjects[subject]) systemSettings.subjects[subject] = {};
            systemSettings.subjects[subject].countsTowardsProgress = cb.checked;
        });
        document.querySelectorAll('#subject-display-toggle-container input').forEach(cb => {
            const subject = cb.dataset.subject;
            if(!systemSettings.subjects[subject]) systemSettings.subjects[subject] = {};
            systemSettings.subjects[subject].showInProgressBar = cb.checked;
        });
        document.querySelectorAll('#block-names-container input').forEach(input => {
            const blockId = input.dataset.blockId;
            const block = systemSettings.blocks.find(b => b.id === blockId);
            if (block) {
                block.title = input.value;
            }
        });

        systemSettings.examDate = examDateInput.value;
        systemSettings.reviewCount = parseInt(document.getElementById('review-count-setting').value, 10);

        saveState();
        updateProgress();
        startCountdown();
        document.getElementById('exam-date-display').textContent = formatDateDMY(systemSettings.examDate);
        renderPlan(viewDate); // Re-renderiza o plano para atualizar os nomes dos blocos

        closeModal(systemSettingsModal);
    });
});
