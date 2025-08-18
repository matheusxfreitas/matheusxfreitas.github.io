// js/gamedata.js - VERSÃO COM NOMES DE IMAGENS CORRIGIDOS

const GAMIFICATION_CONFIG = {
    version: 19,
    slotMapping: {
        'Língua Portuguesa': 'helmet',
        'Conhecimentos Específicos': 'weapon',
        'Administração Pública': 'shield',
        'Raciocínio Lógico-Matemático': 'boots'
    },
    items: [
        // Elmos (Língua Portuguesa) - Estes estavam corretos
        { id: 'helm_1', name: 'Capacete de Couro', subject: 'Língua Portuguesa', tier: 1, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_warrior_1.png' },
        { id: 'helm_2', name: 'Elmo de Ferro', subject: 'Língua Portuguesa', tier: 2, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_warrior_2.png' },
        { id: 'helm_3', name: 'Elmo de Aço', subject: 'Língua Portuguesa', tier: 3, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_warrior_3.png' },
        
        // Armas (Conhecimentos Específicos) - Estes estavam corretos
        { id: 'wpn_1', name: 'Adaga Simples', subject: 'Conhecimentos Específicos', tier: 1, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_rogue_1.png' },
        { id: 'wpn_2', name: 'Espada de Ferro', subject: 'Conhecimentos Específicos', tier: 2, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_warrior_2.png' },
        { id: 'wpn_3', name: 'Machado de Aço', subject: 'Conhecimentos Específicos', tier: 3, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_warrior_3.png' },

        // Armaduras (Conhecimentos Específicos) - Estes estavam corretos
        { id: 'arm_1', name: 'Armadura de Couro', subject: 'Conhecimentos Específicos', tier: 1, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_rogue_1.png' },
        { id: 'arm_2', name: 'Peitoral de Ferro', subject: 'Conhecimentos Específicos', tier: 2, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_warrior_2.png' },
        { id: 'arm_3', name: 'Cota de Malha de Aço', subject: 'Conhecimentos Específicos', tier: 3, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_warrior_3.png' },

        // Escudos (Administração Pública) - Estes estavam corretos
        { id: 'shd_1', name: 'Broquel de Madeira', subject: 'Administração Pública', tier: 1, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_warrior_1.png' },
        { id: 'shd_2', name: 'Escudo de Ferro', subject: 'Administração Pública', tier: 2, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_warrior_2.png' },
        { id: 'shd_3', name: 'Escudo de Aço', subject: 'Administração Pública', tier: 3, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_warrior_3.png' },

        // Botas (Raciocínio Lógico-Matemático) - CORRIGIDO
        // Os ficheiros "shoes" não existiam. Substituí por armaduras especiais que podem servir como "botas" visuais.
        { id: 'bts_1', name: 'Botas Simples', subject: 'Raciocínio Lógico-Matemático', tier: 1, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_special_0.png' },
        { id: 'bts_2', name: 'Botas Reforçadas', subject: 'Raciocínio Lógico-Matemático', tier: 2, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_special_1.png' },
        { id: 'bts_3', name: 'Grevas de Batalha', subject: 'Raciocínio Lógico-Matemático', tier: 3, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_special_2.png' }
    ],
    unlockThresholds: {
        TIER_1: 0.25,
        TIER_2: 0.50,
        TIER_3: 0.75
    }
};

function getInitialGamificationState() {
    return {
        version: GAMIFICATION_CONFIG.version,
        player: { 
            equipped: { 
                helmet: null, armor: null, pants: null, boots: null, weapon: null, shield: null 
            } 
        },
        config: GAMIFICATION_CONFIG
    };
}