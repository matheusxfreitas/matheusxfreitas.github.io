// js/config.js - Versão Refatorada

// --- INICIALIZAÇÃO DO FIREBASE ---
// Mantemos a configuração para poder salvar os itens na base de dados.
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
// Esta variável irá guardar todos os itens vindos do nosso ficheiro gamedata.js
let allGameItems = [];

/**
 * DOCUMENTAÇÃO: renderGallery(filter)
 * Esta função desenha a galeria de sprites na tela.
 * @param {string} filter - O tipo de equipamento a ser exibido (ex: 'head', 'weapon', 'all').
 */
function renderGallery(filter = 'all') {
    const gallery = document.getElementById('sprite-gallery');
    gallery.innerHTML = ''; // Limpa a galeria antes de redesenhar

    // Filtra a nossa lista de itens central (allGameItems)
    const filteredItems = allGameItems.filter(item => {
        if (filter === 'all') return true;
        // O filtro agora é mais inteligente, ele verifica o tipo de item baseado no ID
        if (item.id.startsWith(filter)) return true; // ex: 'helm_1' começa com 'helm' (se o filtro for 'head')
        if (filter === 'armoire' && item.imageUrl.includes('/armoire/')) return true;
        // Casos especiais para mapear o select para os IDs
        if (filter === 'head' && item.id.startsWith('helm')) return true;
        return false;
    });

    // Cria um card para cada item filtrado
    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'sprite-card p-2 border rounded-md flex items-center justify-center';
        // Guardamos o ID do item para referência futura
        card.dataset.itemId = item.id;
        
        const img = document.createElement('img');
        img.src = item.imageUrl; // Usa o caminho correto vindo do gamedata.js
        img.className = 'item-sprite';
        
        card.appendChild(img);
        gallery.appendChild(card);
    });
}

/**
 * DOCUMENTAÇÃO: openCreateModal(itemId)
 * Abre o modal de criação de item, pré-preenchendo com a imagem selecionada.
 * @param {string} itemId - O ID do item que foi clicado.
 */
function openCreateModal(itemId) {
    // Encontra o objeto completo do item na nossa lista central
    const item = allGameItems.find(i => i.id === itemId);
    if (!item) return; // Se não encontrar o item, não faz nada

    document.getElementById('modal-sprite-preview').src = item.imageUrl;
    document.getElementById('item-image-url').value = item.imageUrl;
    
    // Sugere um nome e tier baseado no item clicado
    document.getElementById('item-name').value = item.name || '';
    document.getElementById('item-tier').value = item.tier || 1;
    document.getElementById('item-subject').value = item.subject || '';

    document.getElementById('create-item-modal').classList.remove('hidden');
}

// --- LÓGICA PRINCIPAL ---
// Espera o HTML carregar completamente antes de executar o código.
document.addEventListener('DOMContentLoaded', async () => {
    // A MÁGICA ACONTECE AQUI!
    // Em vez de usar a "fileList", nós lemos a lista de itens diretamente
    // da nossa configuração central que foi carregada pelo gamedata.js
    allGameItems = GAMIFICATION_CONFIG.items;

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

    // Renderiza a galeria inicial com todos os itens
    renderGallery();

    // --- EVENT LISTENERS (INTERAÇÕES DO UTILIZADOR) ---

    // Filtro de tipo de equipamento
    document.getElementById('filter-type').addEventListener('change', (e) => {
        renderGallery(e.target.value);
    });

    // Clique num sprite na galeria
    document.getElementById('sprite-gallery').addEventListener('click', (e) => {
        const card = e.target.closest('.sprite-card');
        if (card && card.dataset.itemId) {
            openCreateModal(card.dataset.itemId);
        }
    });

    // Botão de fechar o modal
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('create-item-modal').classList.add('hidden');
    });

    // Submissão do formulário para criar um novo item
    document.getElementById('create-item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newItem = {
            id: `item_${new Date().getTime()}`, // Gera um ID único
            name: document.getElementById('item-name').value,
            subject: document.getElementById('item-subject').value,
            tier: parseInt(document.getElementById('item-tier').value, 10),
            imageUrl: document.getElementById('item-image-url').value
        };

        try {
            // Este código para salvar no Firebase continua igual e funcional
            const doc = await docRef.get();
            if (doc.exists) {
                const currentData = doc.data();
                // O caminho para salvar é diretamente nos itens da configuração
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