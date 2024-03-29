// Orchestrates damage calculation updates by tracking turn number in active games
function TurnChecker(newDataWindow) {
    let gameToTurnNumberMap = {};
    let activeGameId = null;
    let firstBattleWasInitiated = false;
    let dataWindow = newDataWindow;

    // Periodically check the current turn in the current game. If new turn, recalculate.
    function checkIfNewTurn() {
        if (!app.curRoom.battle) {
            activeGameId = null;
            if (firstBattleWasInitiated) dataWindow.clearDisplay();
            return;
        }

        firstBattleWasInitiated = true;

        // Update data display when switching between battles
        if (app.curRoom.battle.id != activeGameId) {
            activeGameId = app.curRoom.battle.id;
            dataWindow.refresh();
        }
        // If new game was added since we last checked, add it to our watchlist
        for (let room of app.roomList) {
            if (!gameToTurnNumberMap[room.id]) gameToTurnNumberMap[room.id] = 0;
        }
        // TODO removing games
        // If new turn has happened, recalculate damage ranges
        if (app.curRoom.battle.turn > gameToTurnNumberMap[app.curRoom.battle.id]) {
            gameToTurnNumberMap[app.curRoom.battle.id] = app.curRoom.battle.turn;
            dataWindow.refresh();
        }
    }

    // Entry point
    function init(newDataWindow) {
        setInterval(checkIfNewTurn, 1000);
    }

    return {
        init: init
    };
}
