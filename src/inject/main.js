// @name        Pokemon Showdown God Mode 
// @author      github.com/ridoy
// @description What's the most damage my opponent can do to me next turn? And me to them? This script answers 
//              those questions by calculating and displaying damage ranges of both side's moves each turn. 
//              Currently only configured to work for Generation 7 Random Battles.

const createSlideoutContainer = function() {
    let damageDisplaySlideout = document.createElement("div");
    damageDisplaySlideout.id = "damage-display-slideout";

    let damageDisplayCollapseButton = document.createElement("span");
    damageDisplayCollapseButton.innerText = "Click and drag to adjust size";
    damageDisplayCollapseButton.id = "collapse-button";

    damageDisplaySlideout.appendChild(damageDisplayCollapseButton);
    document.body.appendChild(damageDisplaySlideout);

    let dragging = false;
    const SLIDEOUT_MIN_HEIGHT = 50; // in px
    $(damageDisplaySlideout).css("top", $(window).height() - SLIDEOUT_MIN_HEIGHT);
    $(damageDisplayCollapseButton).mousedown(function(e) {
        let dragging = true;
        $(damageDisplayCollapseButton).css("cursor", "grabbing");
        $(document).mousemove(function(e) {
            let cursorTooLow = $(window).height() - e.pageY < SLIDEOUT_MIN_HEIGHT;
            let cursorTooHigh = e.pageY < 0;
            if (cursorTooLow) {
                $(damageDisplaySlideout).css("top", $(window).height() - SLIDEOUT_MIN_HEIGHT);
            } else if (cursorTooHigh) {
                $(damageDisplaySlideout).css("top", 0);
            } else {
                $(damageDisplaySlideout).css("top", e.pageY);
            }
        });
    })
    $(document).mouseup(function() {
        dragging = false;
        $(damageDisplayCollapseButton).css("cursor", "grab");
        $(document).unbind('mousemove');
    })
}


createSlideoutContainer();



function TurnChecker() {

// Keep track of ids of current games in map of ids to game turn numbers.
// Refresh data when tab is changed, ergo continually check app.curRoom
//  
    let gamesToNumTurns = {};
    let activeGameId = null;

    // Periodically check the current turn in the current game. If new turn, recalculate.
    function checkIfNewTurn() {
        if (!app.curRoom.battle) {
            activeGameId = null;
            $('#damage-display-container').remove();
            return;
        }
        // Tab switching
        if (app.curRoom.battle.id != activeGameId) {
            activeGameId = app.curRoom.battle.id;
            damageCalculator.run();
        }
        // If new game was added since we last checked, add it to our watchlist
        for (let room of app.roomList) {
            if (!gamesToNumTurns[room.id]) gamesToNumTurns[room.id] = 0;
        }
        // TODO removing games
        if (app.curRoom.battle.turn > gamesToNumTurns[app.curRoom.battle.id]) {
            gamesToNumTurns[app.curRoom.battle.id] = app.curRoom.battle.turn;
            damageCalculator.run();
        }
    }

    function init() {
        setInterval(checkIfNewTurn, 1000);
    }

    return {
        init: init
    };
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

let turnCheckerInitScript = "let turnChecker = new TurnChecker(); turnChecker.init();"
embedScript(TurnChecker.toString() + turnCheckerInitScript, "turn-checker-script");
