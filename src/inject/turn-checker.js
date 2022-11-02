// Orchestrates damage calculation updates by tracking turn number in active games
function TurnChecker() {
    let gamesToNumTurns = {};
    let activeGameId = null;

    // Periodically check the current turn in the current game. If new turn, recalculate.
    function checkIfNewTurn() {
        if (!app.curRoom.battle) {
            activeGameId = null;
            $('#damage-display-container').remove();
            return;
        }

        // Remove welcome message as soon as battle is started
        $("#welcome-message").remove();

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
    function init() {
        setInterval(checkIfNewTurn, 1000);
    }

    return {
        init: init
    };
}
