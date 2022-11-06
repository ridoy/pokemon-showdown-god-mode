// @name        Pokémon Showdown God Mode 
// @author      github.com/ridoy
// @description What's the most damage my opponent can do to me next turn? And me to them? This script answers 
//              those questions by calculating and displaying damage ranges of both side's moves each turn. 
//              Currently only configured to work for Generation 7 Random Battles.
console.log("Script loaded");

// Embed damage calculation script + random battles data within local context.
// These are available locally as `calc` and `formatsData` respectively.
(function embedScripts() {
    const formatsData = {
        "1": gen1FormatsData,
        "2": gen2FormatsData,
        "3": gen3FormatsData,
        "4": gen4FormatsData,
        "5": gen5FormatsData,
        "6": gen6FormatsData,
        "7": gen7FormatsData
    };

    embedScript(`const formatsData = ${JSON.stringify(formatsData)}`, "randbats-moves");
    embedScript(smogonCalcData, "data-script");
    embedScript(smogonCalc, "calc-script");

    let damageCalculatorInitScript = "let damageCalculator = new DamageCalculator();"
    embedScript(DamageCalculator.toString() + damageCalculatorInitScript, "damage-calculator-script");

    let turnCheckerInitScript = "let turnChecker = new TurnChecker(); turnChecker.init();"
    embedScript(TurnChecker.toString() + turnCheckerInitScript, "turn-checker-script");
})();

// Helper function for embedding scripts into the page.
function embedScript(scriptAsString, id) {
    let s = document.createElement("script");
    s.id = id;
    s.textContent = scriptAsString;
    (document.head).appendChild(s);
}