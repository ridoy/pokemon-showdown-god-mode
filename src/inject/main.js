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

// Damage calculation object. This gets embedded as a new <script> into the page in order to access the local context,
// which is necessary for accessing local variables like `app` which contain vital data about the current 
// game state. The local state cannot be accessed from within this Chrome extension script (separate contexts) 
// so we must embed.
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
    this.run = function() {
        let gen = $this.getGeneration();
        let myPkmnName = app.curRoom.battle.mySide.active[0].speciesForme;
        myTeam = app.curRoom.battle.myPokemon;
        myPkmn = myTeam.filter((pkmn) => pkmn.speciesForme === myPkmnName)[0];
        theirPkmn = app.curRoom.battle.farSide.active[0];
        theirPkmnNameFormatted = theirPkmn
            .speciesForme
            .replaceAll("-","")
            .replaceAll(" ", "")
            .toLowerCase();
        opponentMoves = gen7FormatsData[theirPkmnNameFormatted]["randomBattleMoves"];
        myPkmnObj = $this.initPokemon(gen, myPkmn);
        theirPkmnObj = $this.initPokemon(gen, theirPkmn);
        yourDamageText = $this.calculateDamages(gen, myPkmn.moves, myPkmnObj, theirPkmnObj);
        oppDamageText = $this.calculateDamages(gen, opponentMoves, theirPkmnObj, myPkmnObj);
        if (!document.getElementById("damage-display")) {
            damageDisplay = document.createElement("div");
            damageDisplayLeft = document.createElement("div");
            damageDisplayRight = document.createElement("div");
            damageDisplay.id = "damage-display";
            damageDisplayLeft.id = "damage-display-left";
            damageDisplayRight.id = "damage-display-right";
            damageDisplay.appendChild(damageDisplayLeft);
            damageDisplay.appendChild(damageDisplayRight);
        }
        damageDisplayLeft.innerText = "Your moves:\n" + yourDamageText.join("\n");
        damageDisplayRight.innerText = "Their (possible) moves:\n" + oppDamageText.join("\n");
        document.getElementsByClassName("controls")[0].appendChild(damageDisplay);
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
