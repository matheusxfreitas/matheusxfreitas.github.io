// js/gamedata.js - VERSÃO COM ARSENAL COMPLETO

const GAMIFICATION_CONFIG = {
    version: 20, // Aumentamos a versão para refletir a grande mudança
    slotMapping: {
        'Língua Portuguesa': 'helmet',
        'Conhecimentos Específicos': 'weapon',
        'Administração Pública': 'shield',
        'Raciocínio Lógico-Matemático': 'boots'
    },
    // Lista completa com todos os itens de equipamento disponíveis
    items: [
        // --- ELMOS (Língua Portuguesa) ---
        { id: 'head_warrior_1', name: 'Elmo de Guerreiro 1', subject: 'Língua Portuguesa', tier: 1, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_warrior_1.png' },
        { id: 'head_warrior_2', name: 'Elmo de Guerreiro 2', subject: 'Língua Portuguesa', tier: 2, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_warrior_2.png' },
        { id: 'head_warrior_3', name: 'Elmo de Guerreiro 3', subject: 'Língua Portuguesa', tier: 3, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_warrior_3.png' },
        { id: 'head_warrior_4', name: 'Elmo de Guerreiro 4', subject: 'Língua Portuguesa', tier: 4, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_warrior_4.png' },
        { id: 'head_warrior_5', name: 'Elmo de Guerreiro 5', subject: 'Língua Portuguesa', tier: 5, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_warrior_5.png' },
        { id: 'head_rogue_1', name: 'Capuz de Ladino 1', subject: 'Língua Portuguesa', tier: 1, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_rogue_1.png' },
        { id: 'head_rogue_2', name: 'Capuz de Ladino 2', subject: 'Língua Portuguesa', tier: 2, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_rogue_2.png' },
        { id: 'head_rogue_3', name: 'Capuz de Ladino 3', subject: 'Língua Portuguesa', tier: 3, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_rogue_3.png' },
        { id: 'head_rogue_4', name: 'Capuz de Ladino 4', subject: 'Língua Portuguesa', tier: 4, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_rogue_4.png' },
        { id: 'head_rogue_5', name: 'Capuz de Ladino 5', subject: 'Língua Portuguesa', tier: 5, imageUrl: 'assets/habitica-images-main/gear/head/shop/shop_head_rogue_5.png' },
        { id: 'head_armoire_admiralsbicorne', name: 'Bicorne de Almirante', subject: 'Língua Portuguesa', tier: 6, imageUrl: 'assets/habitica-images-main/gear/armoire/shop/shop_head_armoire_admiralsBicorne.png' },

        // --- ARMAS (Conhecimentos Específicos) ---
        { id: 'weapon_warrior_1', name: 'Arma de Guerreiro 1', subject: 'Conhecimentos Específicos', tier: 1, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_warrior_1.png' },
        { id: 'weapon_warrior_2', name: 'Arma de Guerreiro 2', subject: 'Conhecimentos Específicos', tier: 2, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_warrior_2.png' },
        { id: 'weapon_warrior_3', name: 'Arma de Guerreiro 3', subject: 'Conhecimentos Específicos', tier: 3, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_warrior_3.png' },
        { id: 'weapon_warrior_4', name: 'Arma de Guerreiro 4', subject: 'Conhecimentos Específicos', tier: 4, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_warrior_4.png' },
        { id: 'weapon_warrior_5', name: 'Arma de Guerreiro 5', subject: 'Conhecimentos Específicos', tier: 5, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_warrior_5.png' },
        { id: 'weapon_rogue_1', name: 'Arma de Ladino 1', subject: 'Conhecimentos Específicos', tier: 1, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_rogue_1.png' },
        { id: 'weapon_rogue_2', name: 'Arma de Ladino 2', subject: 'Conhecimentos Específicos', tier: 2, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_rogue_2.png' },
        { id: 'weapon_rogue_3', name: 'Arma de Ladino 3', subject: 'Conhecimentos Específicos', tier: 3, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_rogue_3.png' },
        { id: 'weapon_rogue_4', name: 'Arma de Ladino 4', subject: 'Conhecimentos Específicos', tier: 4, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_rogue_4.png' },
        { id: 'weapon_rogue_5', name: 'Arma de Ladino 5', subject: 'Conhecimentos Específicos', tier: 5, imageUrl: 'assets/habitica-images-main/gear/weapon/shop/shop_weapon_rogue_5.png' },
        { id: 'weapon_armoire_astronomerstelescope', name: 'Telescópio de Astrónomo', subject: 'Conhecimentos Específicos', tier: 6, imageUrl: 'assets/habitica-images-main/gear/armoire/shop/shop_weapon_armoire_astronomersTelescope.png' },

        // --- ARMADURAS (Conhecimentos Específicos) ---
        { id: 'armor_warrior_1', name: 'Armadura de Guerreiro 1', subject: 'Conhecimentos Específicos', tier: 1, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_warrior_1.png' },
        { id: 'armor_warrior_2', name: 'Armadura de Guerreiro 2', subject: 'Conhecimentos Específicos', tier: 2, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_warrior_2.png' },
        { id: 'armor_warrior_3', name: 'Armadura de Guerreiro 3', subject: 'Conhecimentos Específicos', tier: 3, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_warrior_3.png' },
        { id: 'armor_warrior_4', name: 'Armadura de Guerreiro 4', subject: 'Conhecimentos Específicos', tier: 4, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_warrior_4.png' },
        { id: 'armor_warrior_5', name: 'Armadura de Guerreiro 5', subject: 'Conhecimentos Específicos', tier: 5, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_warrior_5.png' },
        { id: 'armor_rogue_1', name: 'Armadura de Ladino 1', subject: 'Conhecimentos Específicos', tier: 1, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_rogue_1.png' },
        { id: 'armor_rogue_2', name: 'Armadura de Ladino 2', subject: 'Conhecimentos Específicos', tier: 2, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_rogue_2.png' },
        { id: 'armor_rogue_3', name: 'Armadura de Ladino 3', subject: 'Conhecimentos Específicos', tier: 3, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_rogue_3.png' },
        { id: 'armor_rogue_4', name: 'Armadura de Ladino 4', subject: 'Conhecimentos Específicos', tier: 4, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_rogue_4.png' },
        { id: 'armor_rogue_5', name: 'Armadura de Ladino 5', subject: 'Conhecimentos Específicos', tier: 5, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_rogue_5.png' },
        { id: 'armor_armoire_admiralsuniform', name: 'Uniforme de Almirante', subject: 'Conhecimentos Específicos', tier: 6, imageUrl: 'assets/habitica-images-main/gear/armoire/shop/shop_armor_armoire_admiralsUniform.png' },

        // --- ESCUDOS (Administração Pública) ---
        { id: 'shield_warrior_1', name: 'Escudo de Guerreiro 1', subject: 'Administração Pública', tier: 1, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_warrior_1.png' },
        { id: 'shield_warrior_2', name: 'Escudo de Guerreiro 2', subject: 'Administração Pública', tier: 2, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_warrior_2.png' },
        { id: 'shield_warrior_3', name: 'Escudo de Guerreiro 3', subject: 'Administração Pública', tier: 3, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_warrior_3.png' },
        { id: 'shield_warrior_4', name: 'Escudo de Guerreiro 4', subject: 'Administração Pública', tier: 4, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_warrior_4.png' },
        { id: 'shield_warrior_5', name: 'Escudo de Guerreiro 5', subject: 'Administração Pública', tier: 5, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_warrior_5.png' },
        { id: 'shield_rogue_1', name: 'Escudo de Ladino 1', subject: 'Administração Pública', tier: 1, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_rogue_1.png' },
        { id: 'shield_rogue_2', name: 'Escudo de Ladino 2', subject: 'Administração Pública', tier: 2, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_rogue_2.png' },
        { id: 'shield_rogue_3', name: 'Escudo de Ladino 3', subject: 'Administração Pública', tier: 3, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_rogue_3.png' },
        { id: 'shield_rogue_4', name: 'Escudo de Ladino 4', subject: 'Administração Pública', tier: 4, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_rogue_4.png' },
        { id: 'shield_rogue_5', name: 'Escudo de Ladino 5', subject: 'Administração Pública', tier: 5, imageUrl: 'assets/habitica-images-main/gear/shield/shop/shop_shield_rogue_5.png' },

        // --- BOTAS (Raciocínio Lógico-Matemático) ---
        { id: 'boots_1', name: 'Botas Simples', subject: 'Raciocínio Lógico-Matemático', tier: 1, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_special_0.png' },
        { id: 'boots_2', name: 'Botas Reforçadas', subject: 'Raciocínio Lógico-Matemático', tier: 2, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_special_1.png' },
        { id: 'boots_3', name: 'Grevas de Batalha', subject: 'Raciocínio Lógico-Matemático', tier: 3, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_special_2.png' },
        { id: 'boots_4', name: 'Botas de Dândi', subject: 'Raciocínio Lógico-Matemático', tier: 4, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_special_dandySuit.png' },
        { id: 'boots_5', name: 'Botas de Bardo', subject: 'Raciocínio Lógico-Matemático', tier: 5, imageUrl: 'assets/habitica-images-main/gear/armor/shop/shop_armor_special_bardRobes.png' }
    ],
    unlockThresholds: {
        TIER_1: 0.10, // Desbloqueia com 10%
        TIER_2: 0.25, // Desbloqueia com 25%
        TIER_3: 0.50, // Desbloqueia com 50%
        TIER_4: 0.75, // Desbloqueia com 75%
        TIER_5: 0.90, // Desbloqueia com 90%
        TIER_6: 1.00  // Desbloqueia com 100%
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