// @name        Pokemon Showdown God Mode 
// @author      github.com/ridoy
// @description What's the most damage my opponent can do to me next turn? And me to them? This script answers 
//              those questions by calculating and displaying damage ranges of both side's moves each turn. 
//              Currently only configured to work for Generation 7 Random Battles.

const createSlideoutContainer = function() {
    let damageDisplaySlideout = document.createElement("div");
    damageDisplaySlideout.id = "damage-display-slideout";

    let damageDisplayCollapseButton = document.createElement("span");
    damageDisplayCollapseButton.innerText = "Collapse / Expand [x] ";
    damageDisplayCollapseButton.id = "collapse-button";


    damageDisplaySlideout.appendChild(damageDisplayCollapseButton);
    document.body.appendChild(damageDisplaySlideout);

    damageDisplayCollapseButton.addEventListener('click', function() {
        this.classList.toggle("active");
        console.log("Collapse button clicked.");
        let content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    });
}

createSlideoutContainer();

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
