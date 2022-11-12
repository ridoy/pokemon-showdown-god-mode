// Damage calculation object. This is embedded as a <script> into the page so we can access local variables like
// `app` which contains the game state. `app` cannot be accessed otherwise: Chrome extensions work in a separate
// scope from the page.

function DamageCalculator() {
    let $this = this;

    // Calculate damage ranges of each move of an attacker on a defender
    // @param {Generation} gen - Generation of current battle
    // @param {Move[]} moves - List of attacker's moves
    // @param {Pokemon} attacker - Attacking Pokémon
    // @param {Pokemon} defender - Defending Pokémon
    // @return {Array[Object]} Damage ranges of each of attacker's moves
    function calculateDamages(gen, moves, attacker, defender, dex) {
        return moves.map((move) => {
            move = dex.moves.get(move).name; // Handles return102 and hiddenpower{type}60
            let result = calc.calculate(gen, attacker, defender, new calc.Move(gen, move));
            let oppHP = result.defender.stats.hp;
            return {
                moveName: move,
                minDamage: Math.floor(result.range()[0] * 1000 / oppHP) / 10,
                maxDamage: Math.floor(result.range()[1] * 1000 / oppHP) / 10
            };
        });
    }

    // Initialize a Pokémon object given a generation and Pokémon name.
    // @param {Generation} gen - Generation of current battle
    // @param {String} pkmn - Name of Pokémon
    // @return {Pokemon} Pokemon object.
    function initPokemon(gen, dex, pkmn) {
        try {
            let name = (pkmn.speciesForme === 'Floette-Eternal') ? 'Floette' : dex.species.get(pkmn.speciesForme).id;
            return new calc.Pokemon(gen, name, {
                item: dex.items.get(pkmn.item).name,
                ability: dex.items.get(pkmn.ability).name,
                boosts: pkmn.boosts,
                level: pkmn.level,
                status: pkmn.status,
                // TODO The following are constants in randbats, EXCEPT for trick room sets. Fix
                nature: "Hardy",
                evs: { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 },
                ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }
            })       
        } catch(e) {
            console.log("Failed to init Pokemon: ", pkmn);
            console.log("Error: ", e);
        }
    };
 
    // Get Generation object for generation of current battle.
    // @param num {Number} - Generation as number (1 through 8 at time of writing)
    // @return {Generation} Generation object
    function getGeneration(num) {
        return calc.Generations.get(num);
    };

    // Get list of moves this Pokemon can have in random battles
    // @param gen {Generation} - Generation of current battle
    // @param speciesFormeId {String} - Species form of Pokemon
    // @param baseFormeId {String} - Base form of Pokemon
    // @return {Array[String]} List of moves
    function getRandomBattleMoves(gen, speciesFormeId, baseFormeId) {
        if (formatsData[gen.num][speciesFormeId]
            && formatsData[gen.num][speciesFormeId]["randomBattleMoves"]) {
            return formatsData[gen.num][speciesFormeId]["randomBattleMoves"];
        }
        return formatsData[gen.num][baseFormeId]["randomBattleMoves"];
    }

    // Entry point of DamageCalculator 
    function run() {
        if (!app || !app.curRoom || !app.curRoom.battle || !app.curRoom.battle.myPokemon) {
            return null;
        }

        let gen = getGeneration(app.curRoom.battle.gen);
        
        let battle = app.curRoom.battle;
        let myPkmnName = battle.mySide.active[0].speciesForme;
        let myTeam = battle.myPokemon;
        let myPkmn = myTeam.filter((pkmn) => pkmn.speciesForme === myPkmnName)[0];
        let faintedPkmn = myTeam.filter((pkmn) => pkmn.fainted).map((pkmn) => pkmn.name);
        let myOtherPkmn = myTeam.filter((pkmn) => pkmn.speciesForme !== myPkmnName);
        myPkmn.boosts = battle.mySide.active[0].boosts;
        let theirPkmn = battle.farSide.active[0];
        let theirPkmnSpeciesFormeId = battle.dex.species.get(theirPkmn.speciesForme).id;
        let theirPkmnBaseFormeId = battle.dex.species.get(theirPkmn.name).id;
        let theirMoves = getRandomBattleMoves(gen, theirPkmnSpeciesFormeId, theirPkmnBaseFormeId);
        let myPkmnObj = initPokemon(gen, battle.dex, myPkmn);
        theirPkmn.speciesForme = theirPkmnSpeciesFormeId;
        let theirPkmnObj = initPokemon(gen, battle.dex, theirPkmn);
        let yourDamages = {};
        let theirDamages = {};
        yourDamages[myPkmnName] = calculateDamages(gen, myPkmn.moves, myPkmnObj, theirPkmnObj, battle.dex);
        theirDamages[myPkmnName] = calculateDamages(gen, theirMoves, theirPkmnObj, myPkmnObj, battle.dex);
        for (let i = 0; i < myOtherPkmn.length; i++) {
            let pkmn = initPokemon(gen,battle.dex,myOtherPkmn[i]);
            yourDamages[pkmn.name] = calculateDamages(gen, myOtherPkmn[i].moves, pkmn, theirPkmnObj, battle.dex);
            theirDamages[pkmn.name] = calculateDamages(gen, theirMoves, theirPkmnObj, pkmn, battle.dex);
        }
        return {
            yourDamages: yourDamages,
            theirDamages: theirDamages,
            faintedPkmn: faintedPkmn
        };
    }

    return {
        run: run
    };
}