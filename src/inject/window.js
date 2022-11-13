// Logic for UI of calculation data container
function DataWindow(newDamageCalculator) {
    const START_X = 70; // in px
    const START_Y = 70; // in px

    const COLLAPSE_BUTTON_TEXT = "Pokémon Showdown God Mode (click to expand / collapse this window)";
    const WELCOME_MESSAGE_HTML = "<b>Welcome to Pokémon Showdown God Mode.</b>"
        + "<br/> Damage calculations will be shown here once you start a battle.";
    const WELCOME_MESSAGE_SUBTEXT_HTML = "This window can be moved by clicking and dragging."
    const PLAYER_DAMAGE_LABEL_HTML = "Your moves and damages <br/>"
        + "<span class='subtext'>Strongest moves are bolded.</span>";
    const ENEMY_DAMAGE_LABEL_HTML = "<br/>Their (potential) moves and damages<br/>"
        + "<span class='subtext'>Actual damages may be higher/lower depending on enemy's held item and ability.</span>";

    const WINDOW_ID = "damage-display-window";
    const COLLAPSE_BUTTON_ID = "collapse-button";
    const COLLAPSE_BUTTON_COLLAPSED_CLASSNAME = "collapse-button-collapsed";
    const WINDOW_CONTENT_ID = "damage-display-container";
    const WELCOME_MESSAGE_ID = "welcome-message";
    const WELCOME_MESSAGE_SUBTEXT_ID = "welcome-message-subtext";
    const DAMAGE_DISPLAY_CLASSNAME = "damage-display";
    const DAMAGE_DISPLAY_ITEM_CLASSNAME = "damage-display-item";
    const DAMAGE_DISPLAY_ITEM_FAINTED_CLASSNAME = "damage-display-item-fainted";
    const PLAYER_DAMAGE_DISPLAY_ITEM_CLASSNAME = "my-damage-display-item";
    const ENEMY_DAMAGE_DISPLAY_ITEM_CLASSNAME = "their-damage-display-item";
    const DAMAGE_AMOUNT_CLASSNAME = "damage-amount";

    let damageCalculator, damageDisplayWindow, damageDisplayCollapseButton, damageDisplayContainer;

    (function init() {
        damageCalculator = newDamageCalculator;
        damageDisplayWindow = $("<div/>").attr("id", WINDOW_ID)
            .appendTo("body");
        damageDisplayCollapseButton = $("<span/>").attr("id", COLLAPSE_BUTTON_ID)
            .html(COLLAPSE_BUTTON_TEXT)
            .appendTo(damageDisplayWindow);
        damageDisplayContainer = $('<div />').attr("id", WINDOW_CONTENT_ID)
            .appendTo(damageDisplayWindow);

        $(damageDisplayWindow).css("top", START_Y);
        $(damageDisplayWindow).css("left", START_X);
              
        attachEventListeners();
        displayWelcomeMessage();
    })();

    // Recalculate all damages using the current state of the battle and update the displayed data.
    function refresh() {
        let damages = damageCalculator.run();
        if (!damages) {
            setTimeout(refresh, 1000);
            return;
        }
        displayDamages(damages.yourDamages, damages.theirDamages, damages.faintedPkmn);
    }

    // Clear display
    function clearDisplay() {
        $(damageDisplayContainer).empty();
    }

    // Display and embed a welcome message in the window.
    function displayWelcomeMessage() {
        let welcomeMessage = $("<span/>").attr("id", WELCOME_MESSAGE_ID)
            .html(WELCOME_MESSAGE_HTML)
            .appendTo(damageDisplayContainer);
        let welcomeMessageSubtext = $("<span/>").attr("id", WELCOME_MESSAGE_SUBTEXT_ID)
            .html(WELCOME_MESSAGE_SUBTEXT_HTML)
            .appendTo(damageDisplayContainer);
    }

    // Display damage info of this turn in window.
    // @param {Object[Object]} yourDamages - Damages your Pokémon can inflict on the enemy's active Pokémon.
    // @param {Object[Object]} theirDamages - Damages their active Pokémon can inflict on your Pokémon.
    // @return {boolean} True if execution completes successfully.
    function displayDamages(yourDamages, theirDamages, faintedPkmn) {
        clearDisplay();
        let myDamageDisplay = $('<div />').attr("class", DAMAGE_DISPLAY_CLASSNAME);
        let myDamageLabel = $('<span/>').html(PLAYER_DAMAGE_LABEL_HTML)
            .appendTo(damageDisplayContainer);
        appendRangesToDamageDisplay(yourDamages, PLAYER_DAMAGE_DISPLAY_ITEM_CLASSNAME, myDamageDisplay, false, faintedPkmn);
        $(myDamageDisplay).appendTo(damageDisplayContainer);

        // With the current UI, your opponent's damages table has their active pokemon's moves in the
        // first column, so we generate that first
        let theirDamageDisplay = $('<div />').attr("class", DAMAGE_DISPLAY_CLASSNAME);
        let theirMoves = theirDamages[Object.keys(theirDamages)[0]];
        let theirMoveNamesColumn = theirMoves.reduce((prev,curr) => `${prev}<br/><b>${curr.moveName}</b>`, '');
        let theirMovesDisplay = $("<div/>")
            .html(theirMoveNamesColumn)
            .attr("class", `${ENEMY_DAMAGE_DISPLAY_ITEM_CLASSNAME} ${DAMAGE_DISPLAY_ITEM_CLASSNAME}`)
            .appendTo(theirDamageDisplay);
        appendRangesToDamageDisplay(theirDamages, ENEMY_DAMAGE_DISPLAY_ITEM_CLASSNAME, theirDamageDisplay, true, faintedPkmn);
        let theirDamageLabel = $('<span/>')
            .html(ENEMY_DAMAGE_LABEL_HTML)
            .appendTo(damageDisplayContainer);
        $(theirDamageDisplay).appendTo(damageDisplayContainer);
    }

    // Append damage ranges to an HTML element.
    // @param {Object[Object]} pkmnToDamages - mapping of Pokémon to damages either received or dealt
    // @param {String} className - Class name of individual damage display elements
    // @param {Node} parentElement - HTML element to which the string created by this function is appended
    // @param {Boolean} isEnemy - Don't show move in UI if isEnemy is true (in current design)
    function appendRangesToDamageDisplay(pkmnToDamages, className, parentElement, isEnemy, faintedPkmn) {
        // isEnemy param to have slightly different UIs is kind of sloppy
        for (let pkmnName of Object.keys(pkmnToDamages)) {
            let moves = pkmnToDamages[pkmnName];
            let isFainted = faintedPkmn.includes(pkmnName);
            let maxDamage = Math.max.apply(null, moves.map(move => move.maxDamage));               
            let thisPkmnDamagesString = (!isFainted) ? `<b>${pkmnName}</b>` : pkmnName;
            for (let move of moves) {
                let isMaxDamage = move.maxDamage === maxDamage && move.maxDamage !== 0;
                thisPkmnDamagesString += `<br/>
                    ${(isMaxDamage && !isFainted) ? '<b>' : ''}
                    ${(isEnemy) ? '' : move.moveName + '<br/>'}
                    <span class=${DAMAGE_AMOUNT_CLASSNAME}>${move.minDamage} - ${move.maxDamage}%</span>
                    ${(isMaxDamage && !isFainted) ? '</b>' : ''}`
            }
            let damageDisplayItemClassName = `${DAMAGE_DISPLAY_ITEM_CLASSNAME} ${className}`;
            damageDisplayItemClassName += (isFainted) ? DAMAGE_DISPLAY_ITEM_FAINTED_CLASSNAME : '';
            let damageDisplayItem = $("<div/>", {
                "class": damageDisplayItemClassName
            }).html(thisPkmnDamagesString).appendTo(parentElement);
        }
    }

    // Convert the maximum damage of a move (in percent) to a class name representing how many hits would result in a KO.
    // @param {Number} maxDamage - max damage of move as a percentage
    // @param {Boolean} attackerIsEnemy - if maxDamage represents damage dealt by enemy
    // @return {String} class name that represents this damage amount
    function getKORangeClassName(maxDamage, attackerIsEnemy) {
        const isOneHitKO = maxDamage >= 100;
        const isTwoHitKO = maxDamage >= 50;
        const isThreeHitKO = maxDamage >= (100 / 3);
        if (isOneHitKO) {
            return (attackerIsEnemy) ? "background-red" : "background-green";
        } else if (isTwoHitKO) {
            return (attackerIsEnemy) ? "background-orange" : "background-yellow";
        } else if (isThreeHitKO) {
            return (attackerIsEnemy) ? "background-yellow" : "background-orange";
        } else {
            return (attackerIsEnemy) ? "background-green" : "background-red";
        }
    }

    function attachEventListeners() {
        // Handle mousedown: start dragging window to new position.
        $(damageDisplayWindow).mousedown(function(e) {
            $(damageDisplayWindow).css("cursor", "grabbing");
            let offset0 = $(this).offset();
            let x0 = e.pageX;
            let y0 = e.pageY;
            $(document).mousemove(function(e) {
                $(damageDisplayWindow).css("top", offset0.top + (e.pageY - y0));
                $(damageDisplayWindow).css("left", offset0.left + (e.pageX - x0));
            });
        });

        // Handle mouseup: stop dragging window.
        $(document).mouseup(function() {
            $(damageDisplayWindow).css("cursor", "grab");
            $(document).unbind("mousemove");
        });

        // Handle collapsing/expanding window
        $(damageDisplayCollapseButton).click(function() {
            if ($(damageDisplayContainer).css("display") === "block") {
                $(damageDisplayContainer).css("display", "none");
                $(damageDisplayCollapseButton).addClass(COLLAPSE_BUTTON_COLLAPSED_CLASSNAME);
            } else {
                $(damageDisplayCollapseButton).removeClass(COLLAPSE_BUTTON_COLLAPSED_CLASSNAME);
                $(damageDisplayContainer).css("display", "block");
            }
        });
    }

    return {
        refresh: refresh,
        clearDisplay: clearDisplay
    }
}