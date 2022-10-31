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
    this.calculateDamages = function(gen, moves, attacker, defender) {
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
    this.initPokemon = function(gen, pkmn) {
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
    this.getGeneration = function() { // TODO add support for other generations
        return calc.Generations.get(7);
    };

    // Display damage info of this turn in page.
    // @param {Array[Object]} yourDamages - Damages your Pokémon can inflict on the enemy's active Pokémon.
    // @param {Array[Object]} theirDamages - Damages their active Pokémon can inflict on your Pokémon.
    // @return {boolean} True if execution completes successfully.
    this.displayDamages = function(yourDamages, theirDamages) {
        // TODO clean this mess up
        // TODO refactoring ideas. Class def in separate files (display, constants (class names), damage calc, main)
        try {
            let previouslyInjectedDisplay = document.getElementById("damage-display-container");
            if (previouslyInjectedDisplay) previouslyInjectedDisplay.remove();
        
            let damageDisplayContainer = document.createElement("div");
            damageDisplayContainer.id = "damage-display-container";
            let myDamageDisplay = document.createElement("div");
            let theirDamageDisplay = document.createElement("div");
            myDamageDisplay.className += "damage-display";
            theirDamageDisplay.className += "damage-display";
            // Display your damages on their Pokemon
            for (let pkmnName of Object.keys(yourDamages)) {
                let moves = yourDamages[pkmnName];
                maxDamage = Math.max.apply(null, moves.map(move => move.maxDamage));               
                let damageDisplayItem = document.createElement("div");
                damageDisplayItem.className += "my-damage-display-item damage-display-item";
                damageDisplayItem.innerHTML = `<b>${pkmnName}</b>`;
                for (let move of moves) {
                    if (move.maxDamage === maxDamage) {
                        damageDisplayItem.innerHTML += `<br/><b>${move.moveName}<br/><span class='damage-amount'>${move.minDamage} - ${move.maxDamage}%</span></b>`;
                    } else {
                        damageDisplayItem.innerHTML += `<br/>${move.moveName}<br/><span class='damage-amount'>${move.minDamage} - ${move.maxDamage}%</span>`;
                    }
                }
                myDamageDisplay.appendChild(damageDisplayItem);
            }
            // Display their damages on your Pokemon
            let theirMoves = theirDamages[Object.keys(theirDamages)[0]];
            let theirMovesDisplay = document.createElement("div");
            theirMovesDisplay.className += "their-damage-display-item damage-display-item";
            for (let move of theirMoves) {
                theirMovesDisplay.innerHTML += `<br/><b>${move.moveName}</b>`;
            }
            theirDamageDisplay.appendChild(theirMovesDisplay);
            for (let pkmnName of Object.keys(theirDamages)) {
                let moves = theirDamages[pkmnName];
                console.log(moves);
                maxDamage = Math.max.apply(null, moves.map(move => move.maxDamage));               
                let damageDisplayItem = document.createElement("div");
                damageDisplayItem.className += "their-damage-display-item damage-display-item";
                damageDisplayItem.innerHTML = `<b>${pkmnName}</b>`;
                for (let move of moves) {
                    if (move.maxDamage === maxDamage) {
                        damageDisplayItem.innerHTML += `<br/><b><span class='damage-amount'>${move.minDamage} - ${move.maxDamage}%</span></b>`;
                    } else {
                        damageDisplayItem.innerHTML += `<br/><span class='damage-amount'>${move.minDamage} - ${move.maxDamage}%</span>`;
                    }
                }
                theirDamageDisplay.appendChild(damageDisplayItem);  
            }

            let myDamageLabel = document.createElement("span");
            let theirDamageLabel = document.createElement("span");
            myDamageLabel.innerHTML = "Your moves and damages (strongest moves are bolded):";
            theirDamageLabel.innerHTML = "<br/>Their (potential) moves and damages:";
            damageDisplayContainer.appendChild(myDamageLabel);
            damageDisplayContainer.appendChild(myDamageDisplay);
            damageDisplayContainer.appendChild(theirDamageLabel);
            damageDisplayContainer.appendChild(theirDamageDisplay);

            document.getElementById("damage-display-slideout").appendChild(damageDisplayContainer);
            return true;
        } catch (e) {
            console.log(e);
        }
    };

    // Generic failure retry function
    // @param {Function} func - Function to be attempted
    // @param {Number} interval - milliseconds between attempts
    // @param {Number} attempt - Current attempt number 
    this.retryIfFail = function(func, interval, attempt) {
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
    this.run = function() {
        let gen = $this.getGeneration();
        if (!app || !app.curRoom || !app.curRoom.battle || !app.curRoom.battle.myPokemon) {
            setTimeout($this.run, 1000);
            return;
        }
        let myPkmnName = app.curRoom.battle.mySide.active[0].speciesForme;
        let myTeam = app.curRoom.battle.myPokemon;
        let myPkmn = myTeam.filter((pkmn) => pkmn.speciesForme === myPkmnName)[0];
        myPkmn.boosts = app.curRoom.battle.mySide.active[0].boosts;
        let myOtherPkmn = myTeam.filter((pkmn) => pkmn.speciesForme !== myPkmnName);
        let theirPkmn = app.curRoom.battle.farSide.active[0];
        let theirPkmnNameFormatted = theirPkmn
            .speciesForme
            .replaceAll("-","")
            .replaceAll(" ", "")
            .replaceAll(":", "") // Type: Null
            .replaceAll("%", "") // Zygarde-10%
            .toLowerCase();
        let theirMoves = gen7FormatsData[theirPkmnNameFormatted]["randomBattleMoves"];
        let myPkmnObj = $this.initPokemon(gen, myPkmn);
        let theirPkmnObj = $this.initPokemon(gen, theirPkmn);
        let yourDamages = {};
        let theirDamages = {};
        yourDamages[myPkmnName] = $this.calculateDamages(gen, myPkmn.moves, myPkmnObj, theirPkmnObj);
        theirDamages[myPkmnName] = $this.calculateDamages(gen, theirMoves, theirPkmnObj, myPkmnObj);
        for (let i = 0; i < myOtherPkmn.length; i++) {
            let pkmn = $this.initPokemon(gen,myOtherPkmn[i]);
            yourDamages[pkmn.name] = $this.calculateDamages(gen, myOtherPkmn[i].moves, pkmn, theirPkmnObj);
            theirDamages[pkmn.name] = $this.calculateDamages(gen, theirMoves, theirPkmnObj, pkmn);
        }
        $this.retryIfFail($this.displayDamages.bind($this, yourDamages, theirDamages), 1000);
    }
}