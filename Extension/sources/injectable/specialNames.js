(() => {

    const MICSR = window.MICSR;

    const reqs = [
        'util',
    ];

    const setup = () => {

        MICSR.commonSpecialNames = {
            // general
            chance: {implemented: false},
            forceHit: {implemented: false},
            // DOT
            DOTInterval: {implemented: false},
            DOTMaxProcs: {implemented: false},
            // burn
            burnDebuff: {implemented: false},
            // slow
            attackSpeedDebuff: {implemented: false},
            attackSpeedDebuffTurns: {implemented: false},
            attackSpeedSlow: {implemented: false},
            attackSpeedSlowTurns: {implemented: false},
            // sleep
            canSleep: {implemented: false},
            sleepDamageMultiplier: {implemented: false},
            sleepTurns: {implemented: false},
            // stun
            canStun: {implemented: false},
            stunChance: {implemented: false},
            stunDamageMultiplier: {implemented: false},
            stunTurns: {implemented: false},
            // fixed damage
            setDOTDamage: {implemented: false},
            setDamage: {implemented: false},
            setHPDamage: {implemented: false},
            // other
            activeBuffs: {implemented: false},
            attackCount: {implemented: false},
            attackInterval: {implemented: false},

            // irrelevant
            description: {implemented: true},
            id: {implemented: true},
            name: {implemented: true},

        }

        MICSR.playerSpecialNames = {
            // general
            damageMultiplier: {implemented: false},
            maxHit: {implemented: false},

            // bleed
            bleedChance: {implemented: false},
            bleedCount: {implemented: false},
            bleedInterval: {implemented: false},
            canBleed: {implemented: false},
            totalBleedHP: {implemented: false},
            totalBleedHPCustom: {implemented: false},
            totalBleedHPPercent: {implemented: false},

            // debuff
            decreasedAccuracy: {implemented: false},
            decreasedMagicEvasion: {implemented: false},
            decreasedMeleeEvasion: {implemented: false},
            decreasedRangedEvasion: {implemented: false},

            // lifesteal
            healsFor: {implemented: false},

            // unique
            stormsnap: {implemented: false},
        };

        MICSR.enemySpecialNames = {
            // buff
            activeBuffTurns: {implemented: false},
            increasedAttackSpeed: {implemented: false},
            increasedDamageReduction: {implemented: false},
            increasedMagicEvasion: {implemented: false},
            increasedMeleeEvasion: {implemented: false},
            increasedRangedEvasion: {implemented: false},

            // 50% of target max hit
            customDamageModifier: {implemented: false},

            // debuff
            applyDebuffTurns: {implemented: false},
            applyDebuffs: {implemented: false},
            decreasePlayerAccuracy: {implemented: false},
            decreasePlayerAccuracyLimit: {implemented: false},
            decreasePlayerAccuracyStack: {implemented: false},
            magicEvasionDebuff: {implemented: false},
            meleeEvasionDebuff: {implemented: false},
            rangedEvasionDebuff: {implemented: false},

            // lifesteal
            lifesteal: {implemented: false},
            lifestealMultiplier: {implemented: false},

            // reflect
            reflectMagic: {implemented: false},
            reflectMelee: {implemented: false},
            reflectRanged: {implemented: false},
            // heal overtime
            setDOTHeal: {implemented: false},
            intoTheMist: {implemented: false},
            // unique
            markOfDeath: {implemented: false},
        };

        // report unknown stats
        MICSR.checkUnknown(playerSpecialAttacks, 'Player special', 'player special attacks', [MICSR.commonSpecialNames, MICSR.playerSpecialNames], {});
        MICSR.checkUnknown(enemySpecialAttacks, 'Enemy special', 'enemy special attacks', [MICSR.commonSpecialNames, MICSR.enemySpecialNames], {});

        // report stats that are known but not implemented
        MICSR.checkImplemented(MICSR.commonSpecialNames, 'Common special');
        MICSR.checkImplemented(MICSR.playerSpecialNames, 'Player special');
        MICSR.checkImplemented(MICSR.enemySpecialNames, 'Enemy special');
    }

    MICSR.waitLoadOrder(reqs, setup, 'playerSpecialNames')

})();