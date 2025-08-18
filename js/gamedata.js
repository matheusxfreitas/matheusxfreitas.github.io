// js/gamedata.js
// Esta é a nossa "Base de Dados" central para toda a gamificação.

const GAMIFICATION_CONFIG = {
    version: 19, // Versão da estrutura de dados para controle
    
    // Mapeia qual matéria está ligada a qual tipo de equipamento
    slotMapping: {
        'Língua Portuguesa': 'helmet',
        'Conhecimentos Específicos': 'weapon', // 'weapon' também controla 'armor'
        'Administração Pública': 'shield',
        'Raciocínio Lógico-Matemático': 'boots'
    },

    // Lista completa de todos os itens possíveis no jogo
    items: [
        // Elmos (Língua Portuguesa)
        { id: 'helm_1', name: 'Capacete de Couro', subject: 'Língua Portuguesa', tier: 1, imageUrl: 'assets/habitica-imagens-main/gear/head/shop/shop_head_warrior_1.png' },
        { id: 'helm_2', name: 'Elmo de Ferro', subject: 'Língua Portuguesa', tier: 2, imageUrl: 'assets/habitica-imagens-main/gear/head/shop/shop_head_warrior_2.png' },
        { id: 'helm_3', name: 'Elmo de Aço', subject: 'Língua Portuguesa', tier: 3, imageUrl: 'assets/habitica-imagens-main/gear/head/shop/shop_head_warrior_3.png' },
        
        // Armas (Conhecimentos Específicos)
        { id: 'wpn_1', name: 'Adaga Simples', subject: 'Conhecimentos Específicos', tier: 1, imageUrl: 'assets/habitica-imagens-main/gear/weapon/shop/shop_weapon_rogue_1.png' },
        { id: 'wpn_2', name: 'Espada de Ferro', subject: 'Conhecimentos Específicos', tier: 2, imageUrl: 'assets/habitica-imagens-main/gear/weapon/shop/shop_weapon_warrior_2.png' },
        { id: 'wpn_3', name: 'Machado de Aço', subject: 'Conhecimentos Específicos', tier: 3, imageUrl: 'assets/habitica-imagens-main/gear/weapon/shop/shop_weapon_warrior_3.png' },

        // Armaduras (Conhecimentos Específicos)
        { id: 'arm_1', name: 'Armadura de Couro', subject: 'Conhecimentos Específicos', tier: 1, imageUrl: 'assets/habitica-imagens-main/gear/armor/shop/shop_armor_rogue_1.png' },
        { id: 'arm_2', name: 'Peitoral de Ferro', subject: 'Conhecimentos Específicos', tier: 2, imageUrl: 'assets/habitica-imagens-main/gear/armor/shop/shop_armor_warrior_2.png' },
        { id: 'arm_3', name: 'Cota de Malha de Aço', subject: 'Conhecimentos Específicos', tier: 3, imageUrl: 'assets/habitica-imagens-main/gear/armor/shop/shop_armor_warrior_3.png' },

        // Escudos (Administração Pública)
        { id: 'shd_1', name: 'Broquel de Madeira', subject: 'Administração Pública', tier: 1, imageUrl: 'assets/habitica-imagens-main/gear/shield/shop/shop_shield_warrior_1.png' },
        { id: 'shd_2', name: 'Escudo de Ferro', subject: 'Administração Pública', tier: 2, imageUrl: 'assets/habitica-imagens-main/gear/shield/shop/shop_shield_warrior_2.png' },
        { id: 'shd_3', name: 'Escudo de Aço', subject: 'Administração Pública', tier: 3, imageUrl: 'assets/habitica-imagens-main/gear/shield/shop/shop_shield_warrior_3.png' },

        // Botas (Raciocínio Lógico-Matemático)
        { id: 'bts_1', name: 'Sapatos de Couro', subject: 'Raciocínio Lógico-Matemático', tier: 1, imageUrl: 'assets/habitica-imagens-main/gear/armoire/shop/shop_shoes_rogue_1.png' },
        { id: 'bts_2', name: 'Botas de Ferro', subject: 'Raciocínio Lógico-Matemático', tier: 2, imageUrl: 'assets/habitica-imagens-main/gear/armoire/shop/shop_shoes_warrior_2.png' },
        { id: 'bts_3', name: 'Grevas de Aço', subject: 'Raciocínio Lógico-Matemático', tier: 3, imageUrl: 'assets/habitica-imagens-main/gear/armoire/shop/shop_shoes_warrior_3.png' }
    ],

    // Regras para desbloquear itens
    unlockThresholds: {
        TIER_1: 0.25, // Desbloqueia com 25% da matéria completa
        TIER_2: 0.50, // Desbloqueia com 50%
        TIER_3: 0.75  // Desbloqueia com 75%
    }
};

// Dados iniciais para um novo jogador
function getInitialGamificationState() {
    return {
        version: GAMIFICATION_CONFIG.version,
        player: { 
            equipped: { 
                helmet: null, 
                armor: null, 
                pants: null, // não usado ainda
                boots: null, 
                weapon: null, 
                shield: null 
            } 
        },
        // A configuração agora é apenas uma referência
        config: GAMIFICATION_CONFIG
    };
}