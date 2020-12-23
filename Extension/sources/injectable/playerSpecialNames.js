(() => {

    const MICSR = window.MICSR;

    const reqs = [
        'util',
    ];

    const setup = () => {

        MICSR.playerSpecialNames = {
            DOTInterval: {implemented: false},
            DOTMaxProcs: {implemented: false},
            activeBuffs: {implemented: false},
            attackCount: {implemented: false},
            attackInterval: {implemented: false},
            attackSpeedDebuff: {implemented: false},
            attackSpeedDebuffTurns: {implemented: false},
            bleedChance: {implemented: false},
            bleedCount: {implemented: false},
            bleedInterval: {implemented: false},
            burnDebuff: {implemented: false},
            canBleed: {implemented: false},
            canSleep: {implemented: false},
            canStun: {implemented: false},
            chance: {implemented: false},
            damageMultiplier: {implemented: false},
            decreasedAccuracy: {implemented: false},
            decreasedMagicEvasion: {implemented: false},
            decreasedMeleeEvasion: {implemented: false},
            decreasedRangedEvasion: {implemented: false},
            description: {implemented: false},
            forceHit: {implemented: false},
            healsFor: {implemented: false},
            id: {implemented: false},
            maxHit: {implemented: false},
            name: {implemented: false},
            setDOTDamage: {implemented: false},
            setDamage: {implemented: false},
            setHPDamage: {implemented: false},
            sleepDamageMultiplier: {implemented: false},
            sleepTurns: {implemented: false},
            stormsnap: {implemented: false},
            stunChance: {implemented: false},
            stunDamageMultiplier: {implemented: false},
            stunTurns: {implemented: false},
            totalBleedHP: {implemented: false},
            totalBleedHPCustom: {implemented: false},
            totalBleedHPPercent: {implemented: false},
        };

        // report stats that are known but not implemented
        MICSR.checkImplemented(MICSR.playerSpecialNames, "Player special");
    }

    MICSR.waitLoadOrder(reqs, setup, 'playerSpecialNames')

})();