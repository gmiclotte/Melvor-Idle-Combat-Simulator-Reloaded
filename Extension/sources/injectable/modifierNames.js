(() => {

    const reqs = [
        'util',
    ];

    const setup = () => {

        const MICSR = window.MICSR;

        // equipment stats are non-passive stats that apply to combat
        // commented modifiers are not relevant yet or not implemented in the game
        MICSR.modifierNames = {
            // general modifiers
            ChanceToPreservePotionCharge: {implemented: true},
            // GPFromSales: {implemented: false},
            GPGlobal: {implemented: true},
            GlobalSkillXP: {implemented: true},
            HiddenSkillLevel: {implemented: true},
            PotionChargesFlat: {implemented: true},
            SkillXP: {implemented: true},
            // modifiers that only relate to combat and are not classified in a finer group
            ChanceToDoubleLootCombat: {implemented: true},
            DamageToAllMonsters: {implemented: true},
            DamageToBosses: {implemented: true},
            DamageToCombatAreaMonsters: {implemented: true},
            DamageToDungeonMonsters: {implemented: true},
            GPFromMonsters: {implemented: true},
            GPFromMonstersFlat: {implemented: true},
            GlobalAccuracy: {implemented: true},
            MaxHitFlat: {implemented: true},
            MaxHitPercent: {implemented: true},
            MaxHitpoints: {implemented: true},
            MinHitBasedOnMaxHit: {implemented: true},
            MonsterRespawnTimer: {implemented: true},
            PlayerAttackSpeed: {implemented: true},
            PlayerAttackSpeedPercent: {implemented: true},
            // modifiers that relate to healing
            AutoEatEfficiency: {implemented: true},
            AutoEatHPLimit: {implemented: true},
            AutoEatThreshold: {implemented: true},
            FoodHealingValue: {implemented: true},
            HPRegenFlat: {implemented: true},
            HitpointRegeneration: {implemented: true},
            // Lifesteal: {implemented: false},
            // modifiers that relate to defence
            DamageReduction: {implemented: true},
            MagicEvasion: {implemented: true},
            MeleeEvasion: {implemented: true},
            RangedEvasion: {implemented: true},
            // ReflectDamage: {implemented: false},
            // modifiers that relate to using melee attacks
            MeleeAccuracyBonus: {implemented: true},
            MeleeStrengthBonus: {implemented: true},
            // modifiers that relate to using ranged attacks
            AmmoPreservation: {implemented: true},
            RangedAccuracyBonus: {implemented: true},
            RangedStrengthBonus: {implemented: true},
            // modifiers that relate to using magic attacks
            MagicAccuracyBonus: {implemented: true},
            MagicDamageBonus: {implemented: true},
            MinAirSpellDmg: {implemented: true},
            MinEarthSpellDmg: {implemented: true},
            MinFireSpellDmg: {implemented: true},
            MinWaterSpellDmg: {implemented: true},
            RunePreservation: {implemented: true},
            // modifiers that relate to slayer tasks, areas, or monsters
            DamageToSlayerAreaMonsters: {implemented: true},
            DamageToSlayerTasks: {implemented: true},
            SlayerAreaEffectNegationFlat: {implemented: true},
            // SlayerCoins: {implemented: false},
            // SlayerTaskLength: {implemented: false},
            // modifiers that relate to prayer
            ChanceToPreservePrayerPoints: {implemented: true},
            FlatPrayerCostReduction: {implemented: true},
        }

        // report unknown stats
        // const known = [MICSR.modifierNames];
        // MICSR.checkUnknown([playerModifiers], 'modifier', 'modifiers', known, {});

        // report stats that are known but not implemented
        MICSR.checkImplemented(MICSR.modifierNames, 'Player modifiers');
    }

    let loadCounter = 0;
    const waitLoadOrder = (reqs, setup, id) => {
        loadCounter++;
        if (loadCounter > 100) {
            console.log('Failed to load ' + id);
            return;
        }
        // check requirements
        let reqMet = true;
        if (window.MICSR === undefined) {
            reqMet = false;
            console.log(id + ' is waiting for the MICSR object');
        } else {
            for (const req of reqs) {
                if (window.MICSR.loadedFiles[req]) {
                    continue;
                }
                reqMet = false;
                // not defined yet: try again later
                if (loadCounter === 1) {
                    window.MICSR.log(id + ' is waiting for ' + req)
                }
            }
        }
        if (!reqMet) {
            setTimeout(() => waitLoadOrder(reqs, setup, id), 50);
            return;
        }
        // requirements met
        window.MICSR.log('setting up ' + id)
        setup();
        // mark as loaded
        window.MICSR.loadedFiles[id] = true;
    }
    waitLoadOrder(reqs, setup, 'modifierNames')

})();