// js/gamification.js - Versão Refatorada e Otimizada

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
let studyPlan = {}; // Guarda o estado atual do plano de estudos vindo do Firebase.

// =================== FUNÇÕES DE CÁLCULO DE PROGRESSO ===================

/**
 * DOCUMENTAÇÃO: calculateProgress(allTasks)
 * Calcula o progresso percentual para cada matéria.
 * @param {Array} allTasks - Uma lista de todas as tarefas do plano.
 * @returns {Object} Um objeto onde as chaves são as matérias e os valores são as suas percentagens de progresso.
 */
function calculateProgress(allTasks) {
    const progress = {};
    const tasksBySubject = allTasks.reduce((acc, task) => {
        if (!acc[task.subject]) acc[task.subject] = [];
        acc[task.subject].push(task);
        return acc;
    }, {});

    for (const subject in tasksBySubject) {
        const total = tasksBySubject[subject].length;
        const completed = tasksBySubject[subject].filter(t => t.completed).length;
        progress[subject] = total > 0 ? completed / total : 0;
    }
    return progress;
}

/**
 * DOCUMENTAÇÃO: getBestItemForProgress(subject, progressPercentage)
 * Encontra o melhor item que o jogador desbloqueou para uma matéria com base no progresso.
 * @param {string} subject - A matéria a ser verificada.
 * @param {number} progressPercentage - O progresso (entre 0 e 1).
 * @returns {Object|null} O objeto do item a ser equipado ou null se nenhum for desbloqueado.
 */
function getBestItemForProgress(subject, progressPercentage) {
    const { items, unlockThresholds } = GAMIFICATION_CONFIG;
    let bestUnlockedTier = 0;
    
    // Verifica qual o maior tier que o progresso atual desbloqueia
    if (progressPercentage >= unlockThresholds.TIER_1) bestUnlockedTier = 1;
    if (progressPercentage >= unlockThresholds.TIER_2) bestUnlockedTier = 2;
    if (progressPercentage >= unlockThresholds.TIER_3) bestUnlockedTier = 3;
    // Adicione mais tiers aqui se necessário (ex: TIER_4)

    if (bestUnlockedTier === 0) return null;

    // Encontra o item exato correspondente à matéria e ao melhor tier desbloqueado
    return items.find(item => item.subject === subject && item.tier === bestUnlockedTier) || null;
}

// =================== FUNÇÕES DE RENDERIZAÇÃO (DESENHAR NA TELA) ===================

/**
 * DOCUMENTAÇÃO: renderAvatar(equippedItems)
 * Atualiza a imagem dos itens equipados no avatar.
 * @param {Object} equippedItems - O objeto `player.equipped` do Firebase.
 */
function renderAvatar(equippedItems) {
    const allSlots = ['helmet', 'armor', 'weapon', 'shield', 'pants', 'boots'];
    
    allSlots.forEach(slotName => {
        const slotElement = document.getElementById(`slot-${slotName}`);
        if (!slotElement) return;

        const itemId = equippedItems[slotName];
        slotElement.innerHTML = `<span class="slot-name">${slotName.charAt(0).toUpperCase() + slotName.slice(1)}</span>`; // Limpa e restaura o nome
        slotElement.title = '';

        if (itemId) {
            const item = GAMIFICATION_CONFIG.items.find(i => i.id === itemId);
            if (item && item.imageUrl) {
                const itemImg = document.createElement('img');
                itemImg.className = 'item-sprite';
                itemImg.src = item.imageUrl;
                itemImg.alt = item.name;
                // Insere a imagem antes do texto do nome do slot
                slotElement.insertBefore(itemImg, slotElement.firstChild);
                slotElement.title = item.name;
            }
        }
    });
}

/**
 * DOCUMENTAÇÃO: renderInventory(data, simulatedProgress = null)
 * Desenha todo o inventário, mostrando o progresso e o estado (bloqueado/desbloqueado/equipado) dos itens.
 * @param {Object} data - O objeto `studyPlan` completo.
 * @param {Object|null} simulatedProgress - (Opcional) Um objeto de progresso para o modo de simulação.
 */
function renderInventory(data, simulatedProgress = null) {
    const { slotMapping, items } = GAMIFICATION_CONFIG;
    const inventoryContainer = document.getElementById('inventory-container');
    inventoryContainer.innerHTML = '';

    const allTasks = Object.values(data.tasks || {}).flat();
    const progress = simulatedProgress || calculateProgress(allTasks);
    
    // Usa o mapeamento para obter a lista de matérias que dão itens
    const subjectsWithSlots = Object.keys(slotMapping);

    subjectsWithSlots.forEach(subject => {
        const progressPercentage = progress[subject] || 0;
        const itemsForSubject = items.filter(item => item.subject === subject).sort((a, b) => a.tier - b.tier);
        if (itemsForSubject.length === 0) return;

        const bestItem = getBestItemForProgress(subject, progressPercentage);
        const equippedId = bestItem ? bestItem.id : null;

        // Monta o HTML da seção
        let sectionHTML = `
            <div>
                <h3 class="text-xl font-bold mb-2">${subject}</h3>
                <div class="w-full progress-bar-bg rounded-full h-2.5 mb-4">
                    <div class="progress-bar-fill h-2.5 rounded-full" style="width: ${progressPercentage * 100}%"></div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        `;

        itemsForSubject.forEach(item => {
            const isEquipped = item.id === equippedId;
            const isUnlocked = progressPercentage >= (GAMIFICATION_CONFIG.unlockThresholds[`TIER_${item.tier}`] || 999);
            
            let cardClass = 'item-card card rounded-lg p-3 text-center';
            if (isEquipped) cardClass += ' equipped';
            if (isUnlocked) cardClass += ' unlocked';

            sectionHTML += `
                <div class="${cardClass}">
                    <div class="h-24 w-full flex items-center justify-center">
                        <img src="${item.imageUrl}" alt="${item.name}" class="item-sprite">
                    </div>
                    <p class="font-semibold mt-2 text-sm">${item.name}</p>
                    <p class="text-xs text-gray-500">Nível ${item.tier}</p>
                </div>
            `;
        });

        sectionHTML += `</div></div>`;
        inventoryContainer.innerHTML += sectionHTML;
    });
}

/**
 * DOCUMENTAÇÃO: updateEquippedItems(data)
 * Verifica o progresso e atualiza quais itens devem ser equipados no Firebase.
 * @param {Object} data - O objeto `studyPlan` completo.
 */
async function updateEquippedItems(data) {
    const { slotMapping } = GAMIFICATION_CONFIG;
    const allTasks = Object.values(data.tasks || {}).flat();
    const progress = calculateProgress(allTasks);
    let needsUpdate = false;

    // Garante que a estrutura de gamificação existe
    if (!data.gamification || !data.gamification.player) {
        data.gamification = getInitialGamificationState();
    }
    const { equipped } = data.gamification.player;

    for (const subject in progress) {
        const slot = slotMapping[subject];
        if (!slot) continue;

        const bestItem = getBestItemForProgress(subject, progress[subject]);
        const currentEquippedId = equipped[slot];
        const newEquippedId = bestItem ? bestItem.id : null;

        if (currentEquippedId !== newEquippedId) {
            equipped[slot] = newEquippedId;
            needsUpdate = true;
            // Caso especial: Armas também equipam armaduras do mesmo tier
            if (slot === 'weapon') {
                const armorTier = bestItem ? bestItem.tier : 0;
                const armorToEquip = GAMIFICATION_CONFIG.items.find(i => i.id.startsWith('arm_') && i.tier === armorTier);
                equipped['armor'] = armorToEquip ? armorToEquip.id : null;
            }
        }
    }

    if (needsUpdate) {
        console.log("Progresso alterado! Atualizando equipamentos no Firebase...");
        const docRef = db.collection("progresso").doc("meuPlano");
        await docRef.set({ gamification: data.gamification }, { merge: true });
    }
}

// =================== LÓGICA DE INICIALIZAÇÃO E EVENTOS ===================
document.addEventListener('DOMContentLoaded', () => {
    const docRef = db.collection("progresso").doc("meuPlano");

    // Listener em tempo real para o Firebase
    docRef.onSnapshot((doc) => {
        if (doc.exists) {
            studyPlan = doc.data();
            // Verifica se a estrutura de gamificação precisa ser criada ou atualizada
            if (!studyPlan.gamification || !studyPlan.gamification.version || studyPlan.gamification.version < GAMIFICATION_CONFIG.version) {
                console.log(`Inicializando ou atualizando gamificação para v${GAMIFICATION_CONFIG.version}...`);
                studyPlan.gamification = getInitialGamificationState(); // Usa a função do gamedata.js
                updateEquippedItems(studyPlan); // Salva a nova estrutura no Firebase
            } else {
                // Se a estrutura está ok, apenas atualiza e renderiza
                updateEquippedItems(studyPlan);
                renderAvatar(studyPlan.gamification.player.equipped);
                renderInventory(studyPlan);
            }
        } else {
            console.error("Documento do plano de estudos não encontrado.");
        }
    }, (error) => {
        console.error("Erro ao ouvir o documento:", error);
    });

    // Lógica do Modal de Simulação
    const devModal = document.getElementById('dev-modal');
    document.getElementById('dev-button').addEventListener('click', () => {
        const controlsContainer = document.getElementById('dev-controls-container');
        controlsContainer.innerHTML = '';
        const allTasks = Object.values(studyPlan.tasks || {}).flat();
        const subjects = Object.keys(GAMIFICATION_CONFIG.slotMapping);

        subjects.forEach(subject => {
            const totalTasks = allTasks.filter(t => t.subject === subject).length;
            const completedTasks = allTasks.filter(t => t.subject === subject && t.completed).length;
            controlsContainer.innerHTML += `
                <div>
                    <label class="block text-sm font-medium">${subject}</label>
                    <div class="flex items-center gap-2 mt-1">
                        <input type="range" id="dev-slider-${subject}" value="${completedTasks}" min="0" max="${totalTasks}" class="w-full">
                        <span id="dev-label-${subject}" class="text-sm w-24 text-right">${completedTasks}/${totalTasks}</span>
                    </div>
                </div>`;
        });
        
        subjects.forEach(subject => {
            const slider = document.getElementById(`dev-slider-${subject}`);
            const label = document.getElementById(`dev-label-${subject}`);
            slider.addEventListener('input', () => {
                label.textContent = `${slider.value}/${slider.max}`;
            });
        });

        devModal.classList.remove('hidden');
    });
    
    document.getElementById('dev-close-btn').addEventListener('click', () => devModal.classList.add('hidden'));
    document.getElementById('dev-reset-btn').addEventListener('click', () => {
        renderAvatar(studyPlan.gamification.player.equipped);
        renderInventory(studyPlan);
    });

    document.getElementById('dev-simulate-btn').addEventListener('click', () => {
        const simulatedProgress = {};
        const allTasks = Object.values(studyPlan.tasks || {}).flat();
        const subjects = Object.keys(GAMIFICATION_CONFIG.slotMapping);

        subjects.forEach(subject => {
            const slider = document.getElementById(`dev-slider-${subject}`);
            const completed = parseInt(slider.value, 10);
            const total = parseInt(slider.max, 10);
            simulatedProgress[subject] = total > 0 ? completed / total : 0;
        });

        const simulatedEquipped = { helmet: null, armor: null, weapon: null, shield: null, pants: null, boots: null };
        for(const subject in simulatedProgress) {
            const slot = GAMIFICATION_CONFIG.slotMapping[subject];
            const bestItem = getBestItemForProgress(subject, simulatedProgress[subject]);
            if(bestItem) {
                simulatedEquipped[slot] = bestItem.id;
                if(slot === 'weapon') {
                    const armor = GAMIFICATION_CONFIG.items.find(i => i.id.startsWith('arm_') && i.tier === bestItem.tier);
                    if(armor) simulatedEquipped['armor'] = armor.id;
                }
            }
        }

        renderAvatar(simulatedEquipped);
        renderInventory(studyPlan, simulatedProgress);
        devModal.classList.add('hidden');
    });
});