(() => {

    const MICSR = window.MICSR;

    const reqs = [
        'util',
    ];

    const setup = () => {

        MICSR.commonSpecialNames = {
            // general
            chance: {implemented: true},
            forceHit: {implemented: true},
            // burn
            burnDebuff: {implemented: true},
            // slow
            attackSpeedDebuff: {implemented: true},
            attackSpeedDebuffTurns: {implemented: true},
            // sleep
            canSleep: {implemented: true},
            sleepDamageMultiplier: {implemented: true},
            sleepTurns: {implemented: true},
            // stun
            canStun: {implemented: true},
            stunChance: {implemented: true},
            stunDamageMultiplier: {implemented: true},
            stunTurns: {implemented: true},
            // fixed damage
            setDamage: {implemented: true},
            setHPDamage: {implemented: true},
            // multi-attack
            attackCount: {implemented: true},
            attackInterval: {implemented: true},

            // irrelevant
            description: {implemented: true},
            id: {implemented: true},
            name: {implemented: true},

        }

        MICSR.playerSpecialNames = {
            // general
            damageMultiplier: {implemented: true},
            maxHit: {implemented: true},

            // bleed
            bleedChance: {implemented: true},
            bleedCount: {implemented: true},
            bleedInterval: {implemented: true},
            canBleed: {implemented: true},
            totalBleedHP: {implemented: true},
            totalBleedHPCustom: {implemented: true},
            totalBleedHPPercent: {implemented: true},

            // debuff
            decreasedAccuracy: {implemented: true},
            decreasedMagicEvasion: {implemented: true},
            decreasedMeleeEvasion: {implemented: true},
            decreasedRangedEvasion: {implemented: true},

            // lifesteal
            healsFor: {implemented: true},

            // unique
            stormsnap: {implemented: true},
        };

        MICSR.enemySpecialNames = {
            // buff
            activeBuffs: {implemented: true},
            activeBuffTurns: {implemented: true},
            increasedAttackSpeed: {implemented: true},
            increasedDamageReduction: {implemented: true},
            increasedMeleeEvasion: {implemented: true},
            increasedRangedEvasion: {implemented: true},
            increasedMagicEvasion: {implemented: true},

            // 50% of target max hit
            customDamageModifier: {implemented: true},

            // debuff
            applyDebuffTurns: {implemented: true},
            applyDebuffs: {implemented: true},
            meleeEvasionDebuff: {implemented: true},
            rangedEvasionDebuff: {implemented: true},
            magicEvasionDebuff: {implemented: true},

            // decrease player accuracy
            decreasePlayerAccuracy: {implemented: true},
            decreasePlayerAccuracyLimit: {implemented: true},
            decreasePlayerAccuracyStack: {implemented: true},

            // lifesteal
            lifesteal: {implemented: true},
            lifestealMultiplier: {implemented: true},

            // reflect
            reflectMelee: {implemented: true},
            reflectRanged: {implemented: true},
            reflectMagic: {implemented: true},

            // unique
            markOfDeath: {implemented: true},
            intoTheMist: {implemented: true},

            // DOT
            DOTInterval: {implemented: true},
            DOTMaxProcs: {implemented: true},
            setDOTHeal: {implemented: true},
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