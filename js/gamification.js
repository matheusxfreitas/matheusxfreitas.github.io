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
        let studyPlan = {};
        const GAMIFICATION_VERSION = 19; // Versão atual da estrutura de gamificação

        // =================== DEFINIÇÕES DE FUNÇÕES ===================
        
        async function startApp() {
            const docRef = db.collection("progresso").doc("meuPlano");

            try {
                const doc = await docRef.get();

                if (doc.exists) {
                    let data = doc.data();
                    if (!data.gamification || data.gamification.version !== GAMIFICATION_VERSION) {
                        console.log(`Atualizando estrutura de gamificação para v${GAMIFICATION_VERSION}...`);
                        const newGamificationData = getInitialGamificationState();
                        await docRef.set({ gamification: newGamificationData }, { merge: true });
                    }
                } else {
                    console.log("Documento não encontrado. Crie-o na página principal.");
                }
            } catch (error) {
                console.error("Erro na inicialização:", error);
            }

            docRef.onSnapshot((doc) => {
                if (doc.exists) {
                    studyPlan = doc.data();
                    renderPage(studyPlan);
                }
            }, (error) => {
                console.error("Erro no listener em tempo real:", error);
            });
        }

        function renderPage(data) {
            renderAvatar(data);
            renderInventory(data);
        }

        function renderAvatar(data) {
            if (!data.gamification || !data.gamification.player) return;
            const { equipped } = data.gamification.player;
            const { items } = data.gamification.config;

            for (const slotName in equipped) {
                const slotElement = document.getElementById(`slot-${slotName}`);
                if (!slotElement) continue;

                const itemId = equipped[slotName];
                const slotNameSpan = slotElement.querySelector('.slot-name');
                slotElement.innerHTML = '';
                if (slotNameSpan) slotElement.appendChild(slotNameSpan);

                if (itemId) {
                    const item = items.find(i => i.id === itemId);
                    if (item && item.imageUrl) {
                        const itemImg = document.createElement('img');
                        itemImg.className = 'item-sprite';
                        itemImg.src = item.imageUrl;
                        itemImg.alt = item.name;
                        slotElement.insertBefore(itemImg, slotNameSpan);
                        slotElement.title = item.name;
                    }
                } else {
                    slotElement.title = slotName.charAt(0).toUpperCase() + slotName.slice(1);
                }
            }
        }

        function renderInventory(data) {
            if (!data.gamification || !data.gamification.config || !data.gamification.config.slotMapping) return;
            const { items, slotMapping } = data.gamification.config;
            const inventoryContainer = document.getElementById('inventory-container');
            inventoryContainer.innerHTML = '';
            
            const allTasks = Object.values(data.tasks || {}).flat();
            const subjects = [...new Set(Object.values(slotMapping || {}))].map(slot => {
                return Object.keys(slotMapping).find(key => slotMapping[key] === slot);
            }).filter(Boolean);

            subjects.forEach(subject => {
                const slot = slotMapping[subject];
                const itemsForSubject = items.filter(item => item.subject === subject).sort((a, b) => a.tier - b.tier);
                
                const totalTasksForSubject = allTasks.filter(t => t.subject === subject).length;
                const completedTasksForSubject = allTasks.filter(t => t.subject === subject && t.completed).length;
                const progressPercentage = totalTasksForSubject > 0 ? (completedTasksForSubject / totalTasksForSubject) * 100 : 0;

                let sectionHTML = `
                    <div>
                        <h3 class="text-xl font-bold mb-2">${subject}</h3>
                        <div class="w-full progress-bar-bg rounded-full h-2.5 mb-4">
                            <div class="progress-bar-fill h-2.5 rounded-full" style="width: ${progressPercentage.toFixed(2)}%"></div>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                `;

                itemsForSubject.forEach(item => {
                    const isEquipped = data.gamification.player.equipped[slot] === item.id;
                    const isUnlocked = isItemUnlocked(item, data);
                    
                    sectionHTML += `
                        <div class="item-card card rounded-lg p-3 text-center ${isEquipped ? 'equipped' : ''} ${isUnlocked ? 'unlocked' : ''}">
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
        
        function isItemUnlocked(item, data) {
            if (!data.gamification || !data.gamification.player) return false;
            const { player, config } = data.gamification;
            const allEquippedItems = Object.values(player.equipped).filter(Boolean);
            
            const hasUnlockedTier = allEquippedItems.some(equippedId => {
                const equippedItem = config.items.find(i => i.id === equippedId);
                return equippedItem && equippedItem.subject === item.subject && equippedItem.tier >= item.tier;
            });
            
            return hasUnlockedTier;
        }

        function openDevModal() {
            const devModal = document.getElementById('dev-modal');
            const devControlsContainer = document.getElementById('dev-controls-container');
            const devSimulateBtn = document.getElementById('dev-simulate-btn');

            devModal.classList.remove('hidden');

            if (!studyPlan.gamification || !studyPlan.gamification.config) {
                devControlsContainer.innerHTML = `<p class="text-center text-gray-500">Aguardando dados do Firebase... Por favor, tente novamente em um instante.</p>`;
                devSimulateBtn.disabled = true;
                return;
            }
            
            devSimulateBtn.disabled = false;
            devControlsContainer.innerHTML = '';
            const { slotMapping } = studyPlan.gamification.config;
            const allTasks = Object.values(studyPlan.tasks || {}).flat();
            
            const subjects = [...new Set(Object.values(slotMapping))].map(slot => {
                return Object.keys(slotMapping).find(key => slotMapping[key] === slot);
            }).filter(Boolean);

            subjects.forEach(subject => {
                const totalTasks = allTasks.filter(t => t.subject === subject).length;
                const completedTasks = allTasks.filter(t => t.subject === subject && t.completed).length;
                
                const controlHTML = `
                    <div>
                        <label class="block text-sm font-medium">${subject}</label>
                        <div class="flex items-center gap-2 mt-1">
                            <input type="number" id="dev-input-${subject.replace(/\s/g, '')}" value="${completedTasks}" min="0" max="${totalTasks}" class="w-24 border-gray-300 rounded-md shadow-sm text-sm">
                            <span class="text-sm text-gray-500">/ ${totalTasks} aulas</span>
                        </div>
                    </div>
                `;
                devControlsContainer.innerHTML += controlHTML;
            });
        }

        // =================== EXECUÇÃO PRINCIPAL E EVENT LISTENERS ===================
        document.addEventListener('DOMContentLoaded', () => {
            const devButton = document.getElementById('dev-button');
            const devModal = document.getElementById('dev-modal');
            const devCloseBtn = document.getElementById('dev-close-btn');
            const devSimulateBtn = document.getElementById('dev-simulate-btn');
            const devResetBtn = document.getElementById('dev-reset-btn');

            startApp();

            devButton.addEventListener('click', openDevModal);
            devCloseBtn.addEventListener('click', () => devModal.classList.add('hidden'));
            
            devResetBtn.addEventListener('click', () => {
                renderPage(studyPlan);
                devModal.classList.add('hidden');
            });

            devSimulateBtn.addEventListener('click', () => {
                const simulatedPlan = JSON.parse(JSON.stringify(studyPlan));
                const allSimulatedTasks = Object.values(simulatedPlan.tasks).flat();
                const { items, slotMapping } = simulatedPlan.gamification.config;

                allSimulatedTasks.forEach(t => t.completed = false);
                Object.keys(simulatedPlan.gamification.player.equipped).forEach(slot => {
                    simulatedPlan.gamification.player.equipped[slot] = null;
                });

                const subjects = [...new Set(Object.values(slotMapping))].map(slot => {
                    return Object.keys(slotMapping).find(key => slotMapping[key] === slot);
                }).filter(Boolean);

                subjects.forEach(subject => {
                    const input = document.getElementById(`dev-input-${subject.replace(/\s/g, '')}`);
                    const completedCount = parseInt(input.value, 10);
                    const tasksForSubject = allSimulatedTasks.filter(t => t.subject === subject);
                    for(let i = 0; i < completedCount && i < tasksForSubject.length; i++) {
                        tasksForSubject[i].completed = true;
                    }
                });

                const thresholds = { TIER_1: 0.01, TIER_2: 0.25, TIER_3: 0.50, TIER_4: 0.75 };
                
                subjects.forEach(subject => {
                    const tasksForSubject = allSimulatedTasks.filter(t => t.subject === subject);
                    const total = tasksForSubject.length;
                    const completed = tasksForSubject.filter(t => t.completed).length;
                    const progress = total > 0 ? completed / total : 0;
                    
                    let bestTierUnlocked = 0;
                    if (progress >= thresholds.TIER_1) bestTierUnlocked = 1;
                    if (progress >= thresholds.TIER_2) bestTierUnlocked = 2;
                    if (progress >= thresholds.TIER_3) bestTierUnlocked = 3;
                    if (progress >= thresholds.TIER_4) bestTierUnlocked = 4;
                    
                    if (bestTierUnlocked > 0) {
                        const itemToEquip = items.find(item => item.subject === subject && item.tier === bestTierUnlocked);
                        if (itemToEquip) {
                            const slot = slotMapping[subject];
                            simulatedPlan.gamification.player.equipped[slot] = itemToEquip.id;
                            if (slot === 'weapon') {
                               const armorToEquip = items.find(item => item.id.startsWith('arm_') && item.tier === bestTierUnlocked);
                               if(armorToEquip) simulatedPlan.gamification.player.equipped['armor'] = armorToEquip.id;
                            }
                        }
                    }
                });

                renderPage(simulatedPlan);
                devModal.classList.add('hidden');
            });
        });