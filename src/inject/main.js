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
            damages.push(move + ": " + minDamage + "% - " + maxDamage + "%");
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
        try {
            let previouslyInjectedDisplay = document.getElementById("damage-display");
            if (previouslyInjectedDisplay) previouslyInjectedDisplay.remove();
        
            let damageDisplay = document.createElement("div");
            damageDisplayLeft = document.createElement("div");
            damageDisplayRight = document.createElement("div");
            damageDisplay.id = "damage-display";
            damageDisplayLeft.id = "damage-display-left";
            damageDisplayRight.id = "damage-display-right";
            damageDisplay.appendChild(damageDisplayLeft);
            damageDisplay.appendChild(damageDisplayRight);
            damageDisplayLeft.innerText = "Your moves:\n" + yourDamages.join("\n");
            damageDisplayRight.innerText = "Their (possible) moves:\n" + theirDamages.join("\n");
            document.getElementsByClassName("controls")[0].appendChild(damageDisplay);
            return true;
        } catch (e) {
            console.log(e);
        }
    };
    this.retryIfFail = function(func, interval, i) {
       if (!i) i = 0;
       if (i > 5) {
           return; // 5 is max retries for now
       }
       setTimeout(function() {
           var success = func();
           if (!success) retryIfFail(func, interval, i + 1);
       }, interval);
   } 
    // where I left off: weird bug where script does not read team initially. 
    this.run = function() {
        let gen = $this.getGeneration();
        let myPkmnName = app.curRoom.battle.mySide.active[0].speciesForme;
        let myBoosts = app.curRoom.battle.mySide.active[0].boosts;
        let myTeam = app.curRoom.battle.myPokemon;
        let myPkmn = myTeam.filter((pkmn) => pkmn.speciesForme === myPkmnName)[0];
        myPkmn.boosts = myBoosts;
        let theirPkmn = app.curRoom.battle.farSide.active[0];
        let theirPkmnNameFormatted = theirPkmn
            .speciesForme
            .replaceAll("-","")
            .replaceAll(" ", "")
            .toLowerCase();
        let theirMoves = gen7FormatsData[theirPkmnNameFormatted]["randomBattleMoves"];
        let myPkmnObj = $this.initPokemon(gen, myPkmn);
        let theirPkmnObj = $this.initPokemon(gen, theirPkmn);
        let yourDamages = $this.calculateDamages(gen, myPkmn.moves, myPkmnObj, theirPkmnObj);
        let theirDamages = $this.calculateDamages(gen, theirMoves, theirPkmnObj, myPkmnObj);
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
