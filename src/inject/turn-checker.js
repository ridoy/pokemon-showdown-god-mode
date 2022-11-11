// Orchestrates damage calculation updates by tracking turn number in active games
function TurnChecker() {
    let gamesToNumTurns = {};
    let activeGameId = null;
    let firstBattleWasInitiated = false;
    let damageCalculator;

    // Periodically check the current turn in the current game. If new turn, recalculate.
    function checkIfNewTurn() {
        if (!app.curRoom.battle) {
            activeGameId = null;
            if (firstBattleWasInitiated) damageCalculator.clearDisplay();
            return;
        }

        firstBattleWasInitiated = true;

        // Update data display when switching between battles
        if (app.curRoom.battle.id != activeGameId) {
            activeGameId = app.curRoom.battle.id;
            damageCalculator.run();
        }
        // If new game was added since we last checked, add it to our watchlist
        for (let room of app.roomList) {
            if (!gamesToNumTurns[room.id]) gamesToNumTurns[room.id] = 0;
        }
        // TODO removing games
        // If new turn has happened, recalculate damage ranges
        if (app.curRoom.battle.turn > gamesToNumTurns[app.curRoom.battle.id]) {
            gamesToNumTurns[app.curRoom.battle.id] = app.curRoom.battle.turn;
            damageCalculator.run();
        }
    }

    // Entry point
    function init(newDamageCalculator) {
        setInterval(checkIfNewTurn, 1000);
        damageCalculator = newDamageCalculator;
    }

    return {
        init: init
    };
}
