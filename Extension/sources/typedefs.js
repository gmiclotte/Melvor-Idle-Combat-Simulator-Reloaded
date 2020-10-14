/**
 * Stats of the player
 * @typedef {Object} PlayerStats
 * @property {number} attackSpeed Attack speed in ms
 * @property {number} attackType Attack Type Melee:0, Ranged:1, Magic:2
 * @property {number} maxAttackRoll Accuracy Rating
 * @property {number} maxHit Maximum Hit of Normal Attack
 * @property {number} minHit Minimum Hit of Normal Attack, for standard spells only
 * @property {number} maxDefRoll Melee Evasion Rating
 * @property {number} maxMagDefRoll Magic Evasion Rating
 * @property {number} maxRngDefRoll Ranged Evasion Rating
 * @property {number} xpBonus Fractional bonus to combat xp gain
 * @property {number} maxHitpoints Maximum hitpoints
 * @property {number} avgHPRegen Average HP gained per regen interval
 * @property {number} damageReduction Damage Reduction in %
 * @property {boolean} diamondLuck If player has diamond luck potion active
 * @property {boolean} usingAncient If player is using ancient magick
 * @property {boolean} hasSpecialAttack If player can special attack
 * @property {Object} specialData Data of player special attack
 * @property {number} startingGP Initial GP of player
 * @property {Object} levels Levels of player
 * @property {boolean[]} prayerSelected Prayers of PRAYER that player has active
 * @property {ActiveItems} activeItems Special items the player has active
 * @property {number} prayerPointsPerAttack Prayer points consumed per player attack
 * @property {number} prayerPointsPerEnemy Prayer points consumed per enemy attack
 * @property {number} prayerPointsPerHeal Prayer points consumed per regen interval
 * @property {number} prayerXPperDamage Prayer xp gained per point of damage dealt
 * @property {boolean} isProtected Player has active protection prayer
 * @property {boolean} hardcore If player is in hardcore mode
 * @property {number} lifesteal Lifesteal from auroras
 * @property {number} attackSpeedDecrease Decreased attack interval from auroras
 * @property {boolean} canCurse If the player can apply curses
 * @property {number} curseID The index of the selected CURSES
 * @property {curse} curseData The element of the selected CURSES
 * @property {number} globalXPMult Global XP multiplier from FM cape and pet
 */

/**
 * @typedef {Object} ActiveItems
 * @property {boolean} hitpointsSkillcape
 * @property {boolean} rangedSkillcape
 * @property {boolean} magicSkillcape
 * @property {boolean} prayerSkillcape
 * @property {boolean} firemakingSkillcape
 * @property {boolean} capeOfArrowPreservation
 * @property {boolean} goldRubyRing
 * @property {boolean} goldDiamondRing
 * @property {boolean} goldEmeraldRing
 * @property {boolean} goldSapphireRing
 * @property {boolean} fighterAmulet
 * @property {boolean} warlockAmulet
 * @property {boolean} guardianAmulet
 * @property {boolean} deadeyeAmulet
 * @property {boolean} confettiCrossbow
 * @property {boolean} stormsnap
 * @property {boolean} slayerCrossbow
 * @property {boolean} bigRon
 */

/**
 * Equipment's combined stats
 * @typedef {Object} EquipmentStats
 * @property {number} attackSpeed
 * @property {number} strengthBonus
 * @property {[number, number, number]} attackBonus
 * @property {number} rangedAttackBonus
 * @property {number} rangedStrengthBonus
 * @property {number} magicAttackBonus
 * @property {number} magicDamageBonus
 * @property {number} defenceBonus
 * @property {number} damageReduction
 * @property {number} rangedDefenceBonus
 * @property {number} magicDefenceBonus
 * @property {number} attackLevelRequired
 * @property {number} defenceLevelRequired
 * @property {number} rangedLevelRequired
 * @property {number} magicLevelRequired
 * @property {number} slayerXPBonus
 * @property {number} chanceToDoubleLoot
 * @property {number} maxHitpointsBonus
 * @property {[number, number, number, number]} increasedMinSpellDmg
 */

/** @typedef {Object} EnemyStats
* @property {number} hitpoints Max Enemy HP
* @property {number} attackSpeed Enemy attack speed (ms)
* @property {number} attackType Enemy attack type
* @property {number} maxAttackRoll Accuracy Rating
* @property {number} maxHit Normal attack max hit
* @property {number} maxDefRoll Melee Evasion Rating
* @property {number} maxMagDefRoll Magic Evasion Rating
* @property {number} maxRngDefRoll Ranged Evasion Rating
* @property {boolean} hasSpecialAttack If enemy can do special attacks
* @property {number[]} specialAttackChances Chance of each special attack
* @property {number[]} specialIDs IDs of special attacks
* @property {number} specialLength Number of special attacks
*/

/** @typedef {Object} Curse Element of CURSES
 * @property {number} chance Chance for curse to apply (%)
 * @property {string} description Curse description
 * @property {number|number[]} effectValue Curse effect value(s)
 * @property {number} magicLevelRequired Magic level required to use curse
 * @property {string} media URL of curse image
 * @property {string} name Name of curse
 * @property {Object[]} runesRequired Runes needed to use curse
*/

/**
 * Simulation result for a single monster
 * @typedef {Object} MonsterSimResult
 * @property {boolean} inQueue
 * @property {boolean} simSuccess
 * @property {number} xpPerEnemy
 * @property {number} xpPerSecond
 * @property {number} xpPerHit
 * @property {number} hpxpPerEnemy
 * @property {number} hpPerEnemy
 * @property {number} hpPerSecond
 * @property {number} dmgPerSecond
 * @property {number} avgKillTime
 * @property {number} attacksMade
 * @property {number} avgHitDmg
 * @property {number} killTimeS
 * @property {number} killsPerSecond
 * @property {number} gpPerKill
 * @property {number} gpPerSecond
 * @property {number} prayerXpPerEnemy
 * @property {number} prayerXpPerSecond
 * @property {number} slayerXpPerSecond
 * @property {number} ppConsumedPerSecond
 * @property {number} herbloreXPPerSecond
 * @property {number} signetChance
 * @property {number} gpFromDamage
 * @property {number} attacksTaken
 * @property {number} attacksTakenPerSecond
 * @property {number} attacksMadePerSecond
 * @property {number} simulationTime
 * @property {number[]} petRolls
 */

/** @typedef {Object} SimulationWorker
 * @property {Worker} worker
 * @property {boolean} inUse
*/

/** @typedef {Object} SimulationJob
 * @property {number} monsterID
 */
