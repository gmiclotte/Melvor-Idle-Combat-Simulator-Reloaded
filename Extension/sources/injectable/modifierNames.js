(() => {

    const reqs = [
        'util',
    ];

    const setup = () => {

        const MICSR = window.MICSR;

        // equipment stats are non-passive stats that apply to combat
        MICSR.modifierNames = {
            // general modifiers
            ChanceToPreservePotionCharge: {implemented: false},
            GPFromSales: {implemented: false},
            GPGlobal: {implemented: false},
            GlobalSkillXP: {implemented: false},
            HiddenSkillLevel: {implemented: false},
            PotionChargesFlat: {implemented: false},
            SkillXP: {implemented: false},
            // modifiers that only relate to combat and are not classified in a finer group
            ChanceToDoubleLootCombat: {implemented: false},
            DamageToAllMonsters: {implemented: false},
            DamageToBosses: {implemented: false},
            DamageToCombatAreaMonsters: {implemented: false},
            DamageToDungeonMonsters: {implemented: false},
            GPFromMonsters: {implemented: false},
            GPFromMonstersFlat: {implemented: false},
            GlobalAccuracy: {implemented: false},
            MaxHitFlat: {implemented: false},
            MaxHitPercent: {implemented: false},
            MaxHitpoints: {implemented: false},
            MinHitBasedOnMaxHit: {implemented: false},
            MonsterRespawnTimer: {implemented: false},
            PlayerAttackSpeed: {implemented: false},
            PlayerAttackSpeedPercent: {implemented: false},
            // modifiers that relate to healing
            AutoEatEfficiency: {implemented: false},
            AutoEatHPLimit: {implemented: false},
            AutoEatThreshold: {implemented: false},
            FoodHealingValue: {implemented: false},
            HPRegenFlat: {implemented: false},
            HitpointRegeneration: {implemented: false},
            Lifesteal: {implemented: false},
            // modifiers that relate to defence
            DamageReduction: {implemented: false},
            MagicEvasion: {implemented: false},
            MeleeEvasion: {implemented: false},
            RangedEvasion: {implemented: false},
            ReflectDamage: {implemented: false},
            // modifiers that relate to using melee attacks
            MeleeAccuracyBonus: {implemented: false},
            MeleeStrengthBonus: {implemented: false},
            // modifiers that relate to using ranged attacks
            AmmoPreservation: {implemented: false},
            RangedAccuracyBonus: {implemented: false},
            RangedStrengthBonus: {implemented: false},
            // modifiers that relate to using magic attacks
            MagicAccuracyBonus: {implemented: false},
            MagicDamageBonus: {implemented: false},
            MinAirSpellDmg: {implemented: false},
            MinEarthSpellDmg: {implemented: false},
            MinFireSpellDmg: {implemented: false},
            MinWaterSpellDmg: {implemented: false},
            RunePreservation: {implemented: false},
            // modifiers that relate to slayer tasks, areas, or monsters
            DamageToSlayerAreaMonsters: {implemented: false},
            DamageToSlayerTasks: {implemented: false},
            SlayerAreaEffectNegationFlat: {implemented: false},
            SlayerCoins: {implemented: false},
            SlayerTaskLength: {implemented: false},
            // modifiers that relate to prayer
            ChanceToPreservePrayerPoints: {implemented: false},
            FlatPrayerCostReduction: {implemented: false},
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