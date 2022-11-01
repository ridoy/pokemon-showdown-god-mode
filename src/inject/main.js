// @name        Pokémon Showdown God Mode 
// @author      github.com/ridoy
// @description What's the most damage my opponent can do to me next turn? And me to them? This script answers 
//              those questions by calculating and displaying damage ranges of both side's moves each turn. 
//              Currently only configured to work for Generation 7 Random Battles.

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

let turnCheckerInitScript = "let turnChecker = new TurnChecker(); turnChecker.init();"
embedScript(TurnChecker.toString() + turnCheckerInitScript, "turn-checker-script");
