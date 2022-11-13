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

    // DamageCalculator needs to be embedded so it can access the page's `app` variable which contains the game state
    // Window and TurnChecker depend on DamageCalculator, so they must be embedded also.
    let initScript = DataWindow.toString();
    initScript += DamageCalculator.toString();
    initScript += TurnChecker.toString();
    initScript += init.toString() + "init();";
    embedScript(initScript, "init-script");
})();

// Helper function for embedding scripts into the page.
function embedScript(scriptAsString, id) {
    let s = document.createElement("script");
    s.id = id;
    s.textContent = scriptAsString;
    (document.head).appendChild(s);
}

function init() {
    let dataWindow = new DataWindow(new DamageCalculator);
    let turnChecker = new TurnChecker(dataWindow);
    turnChecker.init();
}