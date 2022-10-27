// @name        Pokemon Showdown God Mode 
// @author      github.com/ridoy
// @description What's the most damage my opponent can do to me next turn? And me to them? This script answers 
//              those questions by calculating and displaying damage ranges of both side's moves each turn. 
//              Currently only configured to work for Generation 7 Random Battles.

// Damage calculation object. This is embedded as a <script> into the page so we can access local variables like
// `app` which contains the game state. This cannot be accessed otherwise: Chrome extensions work in a separate
// scope from the page.
function DamageCalculator() {
    let $this = this;
    this.calculateDamages = function(gen, moves, attacker, defender) {
        let damages = [];
        for (let move of moves) {
            result = calc.calculate(gen, attacker, defender, new calc.Move(gen, move));
            oppHP = result.defender.stats.hp;
            minDamage = Math.floor(result.range()[0] * 1000 / oppHP) / 10;
            maxDamage = Math.floor(result.range()[1] * 1000 / oppHP) / 10;
            damages.push({moveName: move, minDamage: minDamage, maxDamage: maxDamage});
        }
        return damages;
    }
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
    this.getGeneration = function() { // TODO add support for other generations
        return calc.Generations.get(7);
    };
    this.displayDamages = function(yourDamages, theirDamages) {
        // TODO clean this mess up
        // TODO refactoring ideas. Class def in separate files (display, constants (class names), damage calc, main)
        try {
            let previouslyInjectedDisplay = document.getElementById("damage-display");
            if (previouslyInjectedDisplay) previouslyInjectedDisplay.remove();
        
            let damageDisplayContainer = document.createElement("div");
            let myDamageDisplay = document.createElement("div");
            let theirDamageDisplay = document.createElement("div");
            damageDisplayContainer.id = "damage-display-container";
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
            // document.getElementsByClassName("controls")[0].appendChild(damageDisplayContainer);
            damageDisplaySlideout = document.createElement("div");
            damageDisplaySlideout.id = "damage-display-slideout";
            damageDisplayCollapseButton = document.createElement("button");
            damageDisplayCollapseButton.innerText = "Collapse";
            damageDisplaySlideout.appendChild(damageDisplayCollapseButton);
            damageDisplaySlideout.appendChild(damageDisplayContainer);
            damageDisplayCollapseButton.addEventListener('click', function() {
                this.classList.toggle("active");
                if (damageDisplayContainer.style.display === "block") {
                    damageDisplayContainer.style.display = "none";
                } else {
                    damageDisplayContainer.style.display = "block";
                }
            });
            document.body.appendChild(damageDisplaySlideout);
            return true;
        } catch (e) {
            console.log(e);
        }
    };
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

// Executed each turn. `DamageCalculator` is embedded into the page and cannot be called from here,
// So we embed the call to `run()` as a <script> each turn.
function calculateDamageBothSides() {
    let previouslyInjectedScript = document.getElementById("damage-calculator-execution-script");
    if (previouslyInjectedScript) previouslyInjectedScript.remove();

    let damageCalculatorExecutionScript = "damageCalculator.run()"
    embedScript(damageCalculatorExecutionScript, "damage-calculator-execution-script");
    return true;
}

// Periodically check the current turn by scraping chat history. If new turn, recalculate.
function checkIfNewTurn() {
    let numberOfTurns = $('h2.battle-history').length;

    if (numberOfTurns > currentTurn) {
        console.log("It is now turn " + numberOfTurns + ".");
        currentTurn = numberOfTurns;
        calculateDamageBothSides();
    }
}

// Helper function for embedding scripts into the page.
function embedScript(scriptAsString, id) {
    let s = document.createElement("script");
    s.id = id;
    s.textContent = scriptAsString;
    (document.head).appendChild(s);
}

console.log("Script loaded");

// Embed damage calculation script + random battles data within local context.
// These are available locally as `calc` and `gen7FormatsData` respectively.
embedScript(smogonCalcData, "data-script");
embedScript(smogonCalc, "calc-script");
embedScript(gen7FormatsData, "randbats-moves");

let damageCalculatorInitScript = "let damageCalculator = new DamageCalculator();"
embedScript(DamageCalculator.toString() + damageCalculatorInitScript, "damage-calculator-script");

// Redisplay damage calculations if move is canceled
// document.querySelector(".button[name='undoChoice']").addEventListener("click", calculateDamageBothSides);

// TODO reset currentTurn when battle is over or tab is closed.
let currentTurn = $('h2.battle-history').length;

// Execution begins here.
setInterval(checkIfNewTurn, 1000);
