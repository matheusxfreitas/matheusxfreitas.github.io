// js/config.js - Versão com Filtros Corrigidos

// --- INICIALIZAÇÃO DO FIREBASE ---
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

// --- VARIÁVEIS GLOBAIS ---
let allGameItems = [];

/**
 * DOCUMENTAÇÃO: renderGallery(filter)
 * Esta função desenha a galeria de sprites na tela.
 * @param {string} filter - O tipo de equipamento a ser exibido (ex: 'head', 'weapon', 'all').
 */
function renderGallery(filter = 'all') {
    const gallery = document.getElementById('sprite-gallery');
    gallery.innerHTML = ''; // Limpa a galeria

    // ✨ LÓGICA DE FILTRO CORRIGIDA E SIMPLIFICADA ✨
    const filteredItems = allGameItems.filter(item => {
        if (filter === 'all') {
            return true;
        }
        if (filter === 'armoire') {
            return item.imageUrl.includes('/armoire/');
        }
        // Extrai o tipo do item pelo início do seu ID (ex: 'head' de 'head_warrior_1')
        const itemType = item.id.split('_')[0];
        
        // Compara o tipo do item com o filtro selecionado
        return itemType === filter;
    });

    // Cria um card para cada item filtrado
    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'sprite-card p-2 border rounded-md flex items-center justify-center';
        card.dataset.itemId = item.id;
        
        const img = document.createElement('img');
        img.src = item.imageUrl;
        img.className = 'item-sprite';
        
        card.appendChild(img);
        gallery.appendChild(card);
    });
}

/**
 * DOCUMENTAÇÃO: openCreateModal(itemId)
 * Abre o modal de criação de item.
 * @param {string} itemId - O ID do item que foi clicado.
 */
function openCreateModal(itemId) {
    const item = allGameItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('modal-sprite-preview').src = item.imageUrl;
    document.getElementById('item-image-url').value = item.imageUrl;
    document.getElementById('item-name').value = item.name || '';
    document.getElementById('item-tier').value = item.tier || 1;
    document.getElementById('item-subject').value = item.subject || '';

    document.getElementById('create-item-modal').classList.remove('hidden');
}

// --- LÓGICA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega os itens da nossa base de dados central
    if (typeof GAMIFICATION_CONFIG !== 'undefined' && GAMIFICATION_CONFIG.items) {
        allGameItems = GAMIFICATION_CONFIG.items;
    }

    const docRef = db.collection("progresso").doc("meuPlano");
    
    // Carrega as matérias do plano de estudos para o select
    try {
        const doc = await docRef.get();
        if (doc.exists) {
            const studyPlan = doc.data();
            const subjects = [...new Set(Object.values(studyPlan.tasks || {}).flat().map(t => t.subject))].sort();
            const subjectSelect = document.getElementById('item-subject');
            subjectSelect.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        }
    } catch (error) {
        console.error("Erro ao buscar plano de estudos:", error);
    }

    renderGallery(); // Renderiza a galeria inicial

    // --- EVENT LISTENERS ---
    document.getElementById('filter-type').addEventListener('change', (e) => {
        renderGallery(e.target.value);
    });

    document.getElementById('sprite-gallery').addEventListener('click', (e) => {
        const card = e.target.closest('.sprite-card');
        if (card && card.dataset.itemId) {
            openCreateModal(card.dataset.itemId);
        }
    });

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('create-item-modal').classList.add('hidden');
    });

    document.getElementById('create-item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newItem = {
            id: `item_${new Date().getTime()}`,
            name: document.getElementById('item-name').value,
            subject: document.getElementById('item-subject').value,
            tier: parseInt(document.getElementById('item-tier').value, 10),
            imageUrl: document.getElementById('item-image-url').value
        };

        try {
            const doc = await docRef.get();
            if (doc.exists) {
                const currentData = doc.data();
                const items = currentData.gamification.config.items || [];
                items.push(newItem);
                await docRef.set({ 
                    gamification: { 
                        ...currentData.gamification,
                        config: {
                            ...currentData.gamification.config,
                            items: items
                        }
                    } 
                }, { merge: true });
                alert('Equipamento salvo com sucesso no Firebase!');
                document.getElementById('create-item-modal').classList.add('hidden');
                e.target.reset();
            }
        } catch (error) {
            console.error("Erro ao salvar o item:", error);
            alert('Falha ao salvar o equipamento.');
        }
    });
});
