(() => {

    const MICSR = window.MICSR;

    const reqs = [
        'util',
    ];

    const setup = () => {

        MICSR.enemySpecialNames = {
            DOTInterval: {implemented: false},
            DOTMaxProcs: {implemented: false},
            activeBuffTurns: {implemented: false},
            activeBuffs: {implemented: false},
            applyDebuffTurns: {implemented: false},
            applyDebuffs: {implemented: false},
            attackCount: {implemented: false},
            attackInterval: {implemented: false},
            attackSpeedDebuff: {implemented: false},
            attackSpeedDebuffTurns: {implemented: false},
            attackSpeedSlow: {implemented: false},
            attackSpeedSlowTurns: {implemented: false},
            burnDebuff: {implemented: false},
            canSleep: {implemented: false},
            canStun: {implemented: false},
            chance: {implemented: false},
            customDamageModifier: {implemented: false},
            decreasePlayerAccuracy: {implemented: false},
            decreasePlayerAccuracyLimit: {implemented: false},
            decreasePlayerAccuracyStack: {implemented: false},
            description: {implemented: false},
            forceHit: {implemented: false},
            id: {implemented: false},
            increasedAttackSpeed: {implemented: false},
            increasedDamageReduction: {implemented: false},
            increasedMagicEvasion: {implemented: false},
            increasedMeleeEvasion: {implemented: false},
            increasedRangedEvasion: {implemented: false},
            intoTheMist: {implemented: false},
            lifesteal: {implemented: false},
            lifestealMultiplier: {implemented: false},
            magicEvasionDebuff: {implemented: false},
            markOfDeath: {implemented: false},
            meleeEvasionDebuff: {implemented: false},
            name: {implemented: false},
            rangedEvasionDebuff: {implemented: false},
            reflectMagic: {implemented: false},
            reflectMelee: {implemented: false},
            reflectRanged: {implemented: false},
            setDOTDamage: {implemented: false},
            setDOTHeal: {implemented: false},
            setDamage: {implemented: false},
            setHPDamage: {implemented: false},
            sleepDamageMultiplier: {implemented: false},
            sleepTurns: {implemented: false},
            stunDamageMultiplier: {implemented: false},
            stunTurns: {implemented: false},
        };

        // report stats that are known but not implemented
        MICSR.checkImplemented(MICSR.enemySpecialNames, "Enemy special");
    }

    MICSR.waitLoadOrder(reqs, setup, 'enemySpecialNames')

})();