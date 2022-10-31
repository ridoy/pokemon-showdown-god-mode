// Damage calculation object. This is embedded as a <script> into the page so we can access local variables like
// `app` which contains the game state. `app` cannot be accessed otherwise: Chrome extensions work in a separate
// scope from the page.
function DamageCalculator() {
    let $this = this;

    // Calculate damage ranges of each move of an attacker on a defender
    // @param {Generation} gen - Generation of current battle
    // @param {Move[]} moves - List of attacker's 4 moves
    // @param {Pokemon} attacker - Attacking Pokémon
    // @param {Pokemon} defender - Defending Pokémon
    // @return {Array[Object]} Damage ranges of each of attacker's moves
    function calculateDamages(gen, moves, attacker, defender) {
        return moves.map((move) => {
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
    function initPokemon(gen, pkmn) {
        return new calc.Pokemon(gen, pkmn.speciesForme, {
            item: pkmn.item,
            ability: pkmn.ability,
            boosts: pkmn.boosts,
            level: pkmn.level,
            // TODO The following are constants in randbats, EXCEPT for trick room sets. Fix
            nature: "Hardy",
            evs: { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 },
            ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }
        })            
    };
 
    // Get generation of current battle.
    function getGeneration() { // TODO add support for other generations
        return calc.Generations.get(7);
    };

    // Append damage ranges to an HTML element.
    // @param {Object[Object]} pkmnToDamages - mapping of Pokémon to damages either received or dealt
    // @param {String} className - Class name of individual damage display elements
    // @param {Node} parentElement - HTML element to which the string created by this function is appended
    // @param {Boolean} isEnemy - Don't show move in UI if isEnemy is true (in current design)
    function appendRangesToDamageDisplay(pkmnToDamages, className, parentElement, isEnemy) {
        // isEnemy param to have slightly different UIs is kind of sloppy
        for (let pkmnName of Object.keys(pkmnToDamages)) {
            let moves = pkmnToDamages[pkmnName];
            let maxDamage = Math.max.apply(null, moves.map(move => move.maxDamage));               
            let thisPkmnDamagesString = `<b>${pkmnName}</b>`;
            for (let move of moves) {
                let isMaxDamage = move.maxDamage === maxDamage;
                thisPkmnDamagesString += `<br/>
                    ${(isMaxDamage) ? '<b>' : ''}
                    ${(isEnemy) ? '' : move.moveName + '<br/>'}
                    <span class='damage-amount'>${move.minDamage} - ${move.maxDamage}%</span>
                    ${(isMaxDamage) ? '</b>' : ''}`
            }
            let damageDisplayItem = $("<div/>", {
                "class": `${className} damage-display-item`
            }).html(thisPkmnDamagesString).appendTo(parentElement);
        }
    }

    // Display damage info of this turn in page.
    // @param {Object[Object]} yourDamages - Damages your Pokémon can inflict on the enemy's active Pokémon.
    // @param {Object[Object]} theirDamages - Damages their active Pokémon can inflict on your Pokémon.
    // @return {boolean} True if execution completes successfully.
    function displayDamages(yourDamages, theirDamages) {
        // TODO constants in constants.js
        try {
            $('#damage-display-container').remove(); // Clear canvas for new data
            let damageDisplayContainer = $('<div />').attr("id", "damage-display-container");

            let myDamageDisplay = $('<div />').attr("class", "damage-display");
            let myDamageLabel = $('<span/>').html("Your moves and damages (strongest moves are bolded):")
                .appendTo(damageDisplayContainer);
            appendRangesToDamageDisplay(yourDamages, "my-damage-display-item", myDamageDisplay, false);
            $(myDamageDisplay).appendTo(damageDisplayContainer);

            // With the current UI, your opponent's damages table has their active pokemon's moves in the
            // first column, so we generate that first
            let theirDamageDisplay = $('<div />').attr("class", "damage-display");
            let theirMoves = theirDamages[Object.keys(theirDamages)[0]];
            let theirMoveNamesColumn = theirMoves.reduce((prev,curr) => `${prev}<br/><b>${curr.moveName}</b>`, '');
            let theirMovesDisplay = $("<div/>")
                .attr("class", "their-damage-display-item damage-display-item")
                .html(theirMoveNamesColumn)
                .appendTo(theirDamageDisplay);
            appendRangesToDamageDisplay(theirDamages, "their-damage-display-item", theirDamageDisplay, true);
            let theirDamageLabel = $('<span/>')
                .html("<br/>Their (potential) moves and damages (actual damages may be higher/lower depending on enemy's held item):")
                .appendTo(damageDisplayContainer);
            $(theirDamageDisplay).appendTo(damageDisplayContainer);

            damageDisplayContainer.appendTo("#damage-display-slideout")
            return true;
        } catch (e) {
            console.log(e);
        }
    };

    // Generic failure retry function
    // @param {Function} func - Function to be attempted
    // @param {Number} interval - milliseconds between attempts
    // @param {Number} attempt - Current attempt number 
    function retryIfFail(func, interval, attempt) {
       if (!attempt) attempt = 0;
       if (attempt > 5) {
           return;
       }
       setTimeout(function() {
           var success = func();
           if (!success) retryIfFail(func, interval, attempt + 1);
       }, interval);
    }

    // Entry point of DamageCalculator 
    function run() {
        let gen = getGeneration();
        if (!app || !app.curRoom || !app.curRoom.battle || !app.curRoom.battle.myPokemon) {
            setTimeout(run, 1000);
            return;
        }
        let battle = app.curRoom.battle;
        let myPkmnName = battle.mySide.active[0].speciesForme;
        let myTeam = battle.myPokemon;
        let myPkmn = myTeam.filter((pkmn) => pkmn.speciesForme === myPkmnName)[0];
        let myOtherPkmn = myTeam.filter((pkmn) => pkmn.speciesForme !== myPkmnName);
        myPkmn.boosts = battle.mySide.active[0].boosts;
        let theirPkmn = battle.farSide.active[0];
        let theirPkmnSpeciesFormeId = battle.dex.species.get(theirPkmn.speciesForme).id;
        let theirPkmnBaseFormeId = battle.dex.species.get(theirPkmn.name).id;
        let theirMoves = gen7FormatsData[theirPkmnSpeciesFormeId]["randomBattleMoves"] || gen7FormatsData[theirPkmnBaseFormeId]["randomBattleMoves"];
        let myPkmnObj = initPokemon(gen, myPkmn);
        theirPkmn.speciesForme = theirPkmnSpeciesFormeId;
        let theirPkmnObj = initPokemon(gen, theirPkmn);
        let yourDamages = {};
        let theirDamages = {};
        yourDamages[myPkmnName] = calculateDamages(gen, myPkmn.moves, myPkmnObj, theirPkmnObj);
        theirDamages[myPkmnName] = calculateDamages(gen, theirMoves, theirPkmnObj, myPkmnObj);
        for (let i = 0; i < myOtherPkmn.length; i++) {
            let pkmn = initPokemon(gen,myOtherPkmn[i]);
            yourDamages[pkmn.name] = calculateDamages(gen, myOtherPkmn[i].moves, pkmn, theirPkmnObj);
            theirDamages[pkmn.name] = calculateDamages(gen, theirMoves, theirPkmnObj, pkmn);
        }
        retryIfFail(displayDamages.bind($this, yourDamages, theirDamages), 1000);
    }

    return {
        run: run
    };
}