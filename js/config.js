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
        let allSpritePaths = [];

        const fileList = `
            habitica-imagens-main/gear/armoire/shop/shop_armor_armoire_admiralsUniform.png
            habitica-imagens-main/gear/armoire/shop/shop_head_armoire_admiralsBicorne.png
            habitica-imagens-main/gear/armoire/shop/shop_weapon_armoire_astronomersTelescope.png
            habitica-imagens-main/gear/armor/shop/shop_armor_warrior_1.png
            habitica-imagens-main/gear/armor/shop/shop_armor_warrior_2.png
            habitica-imagens-main/gear/armor/shop/shop_armor_warrior_3.png
            habitica-imagens-main/gear/armor/shop/shop_armor_warrior_4.png
            habitica-imagens-main/gear/armor/shop/shop_armor_warrior_5.png
            habitica-imagens-main/gear/armor/shop/shop_armor_rogue_1.png
            habitica-imagens-main/gear/armor/shop/shop_armor_rogue_2.png
            habitica-imagens-main/gear/armor/shop/shop_armor_rogue_3.png
            habitica-imagens-main/gear/armor/shop/shop_armor_rogue_4.png
            habitica-imagens-main/gear/armor/shop/shop_armor_rogue_5.png
            habitica-imagens-main/gear/head/shop/shop_head_warrior_1.png
            habitica-imagens-main/gear/head/shop/shop_head_warrior_2.png
            habitica-imagens-main/gear/head/shop/shop_head_warrior_3.png
            habitica-imagens-main/gear/head/shop/shop_head_warrior_4.png
            habitica-imagens-main/gear/head/shop/shop_head_warrior_5.png
            habitica-imagens-main/gear/head/shop/shop_head_rogue_1.png
            habitica-imagens-main/gear/head/shop/shop_head_rogue_2.png
            habitica-imagens-main/gear/head/shop/shop_head_rogue_3.png
            habitica-imagens-main/gear/head/shop/shop_head_rogue_4.png
            habitica-imagens-main/gear/head/shop/shop_head_rogue_5.png
            habitica-imagens-main/gear/weapon/shop/shop_weapon_warrior_1.png
            habitica-imagens-main/gear/weapon/shop/shop_weapon_warrior_2.png
            habitica-imagens-main/gear/weapon/shop/shop_weapon_warrior_3.png
            habitica-imagens-main/gear/weapon/shop/shop_weapon_warrior_4.png
            habitica-imagens-main/gear/weapon/shop/shop_weapon_warrior_5.png
            habitica-imagens-main/gear/weapon/shop/shop_weapon_rogue_1.png
            habitica-imagens-main/gear/weapon/shop/shop_weapon_rogue_2.png
            habitica-imagens-main/gear/weapon/shop/shop_weapon_rogue_3.png
            habitica-imagens-main/gear/weapon/shop/shop_weapon_rogue_4.png
            habitica-imagens-main/gear/weapon/shop/shop_weapon_rogue_5.png
            habitica-imagens-main/gear/shield/shop/shop_shield_warrior_1.png
            habitica-imagens-main/gear/shield/shop/shop_shield_warrior_2.png
            habitica-imagens-main/gear/shield/shop/shop_shield_warrior_3.png
            habitica-imagens-main/gear/shield/shop/shop_shield_warrior_4.png
            habitica-imagens-main/gear/shield/shop/shop_shield_warrior_5.png
            habitica-imagens-main/gear/shield/shop/shop_shield_rogue_1.png
            habitica-imagens-main/gear/shield/shop/shop_shield_rogue_2.png
            habitica-imagens-main/gear/shield/shop/shop_shield_rogue_3.png
            habitica-imagens-main/gear/shield/shop/shop_shield_rogue_4.png
            habitica-imagens-main/gear/shield/shop/shop_shield_rogue_5.png
        `.trim().split('\n').map(line => line.trim());

        function renderGallery(filter = 'all') {
            const gallery = document.getElementById('sprite-gallery');
            gallery.innerHTML = '';
            
            const filteredPaths = allSpritePaths.filter(path => {
                if (filter === 'all') return true;
                return path.includes(`/${filter}/`) || path.includes(`_${filter}_`);
            });

            filteredPaths.forEach(path => {
                const card = document.createElement('div');
                card.className = 'sprite-card p-2 border rounded-md flex items-center justify-center';
                card.dataset.path = path;
                
                const img = document.createElement('img');
                img.src = `./${path}`;
                img.className = 'item-sprite';
                
                card.appendChild(img);
                gallery.appendChild(card);
            });
        }

        function openCreateModal(imagePath) {
            document.getElementById('modal-sprite-preview').src = `./${imagePath}`;
            document.getElementById('item-image-url').value = `./${imagePath}`;
            document.getElementById('create-item-modal').classList.remove('hidden');
        }

        document.addEventListener('DOMContentLoaded', async () => {
            allSpritePaths = fileList;
            const docRef = db.collection("progresso").doc("meuPlano");
            
            try {
                const doc = await docRef.get();
                if (doc.exists) {
                    studyPlan = doc.data();
                    const subjects = [...new Set(Object.values(studyPlan.tasks || {}).flat().map(t => t.subject))].sort();
                    const subjectSelect = document.getElementById('item-subject');
                    subjectSelect.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join('');
                }
            } catch (error) {
                console.error("Erro ao buscar plano de estudos:", error);
            }

            renderGallery();

            document.getElementById('filter-type').addEventListener('change', (e) => {
                renderGallery(e.target.value);
            });

            document.getElementById('sprite-gallery').addEventListener('click', (e) => {
                const card = e.target.closest('.sprite-card');
                if (card) {
                    openCreateModal(card.dataset.path);
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
                        alert('Equipamento salvo com sucesso!');
                        document.getElementById('create-item-modal').classList.add('hidden');
                        e.target.reset();
                    }
                } catch (error) {
                    console.error("Erro ao salvar o item:", error);
                    alert('Falha ao salvar o equipamento.');
                }
            });
        });