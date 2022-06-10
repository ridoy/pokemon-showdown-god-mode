console.log("Script loaded");
// Inject calc

function embedScript(scriptAsString, id) {
    let s = document.createElement("script");
    s.id = id;
    s.textContent = scriptAsString;
    (document.head).appendChild(s);
}

embedScript(smogonCalcData, "data-script");
embedScript(smogonCalc, "calc-script");
embedScript(gen7FormatsData, "randbats-moves");

function pressEnterEvent() {
    return new KeyboardEvent('keydown', {altKey:false,
        bubbles: true,
        cancelBubble: false,
        cancelable: true,
        charCode: 0,
        code: "Enter",
        composed: true,
        ctrlKey: false,
        currentTarget: null,
        defaultPrevented: true,
        detail: 0,
        eventPhase: 0,
        isComposing: false,
        isTrusted: true,
        key: "Enter",
        keyCode: 13,
        location: 0,
        metaKey: false,
        repeat: false,
        returnValue: false,
        shiftKey: false,
        type: "keydown",
        which: 13
    });
}

// Chrome extensions run in a separate scope from the current page. Therefore, you can't access
// any variables in the page's environment, like `app` which contains the game state.
// The workaround is to inject our code as a string in a new <script> element. It's sloppy but the
// only alternative I see is scraping this information from the DOM (in which I am uninterested).
function calculateDamageBothSides() {

    // Where I left off
    // Perhaps https://github.com/smogon/pokemon-showdown/blob/d09e2d83549f57fa183b34945e4ae7676d1dc21a/data/formats-data.ts
    // Read random battle sets from this file (and figure otu the right gen too? how doe sthat work?)
    // TODO figure out other gens
    let previouslyInjectedScript = document.getElementById("damage-calculation-script");
    if (previouslyInjectedScript) previouslyInjectedScript.remove();

    // TODO we can obtain our moves of all 6 pokemon and switch movesets based on active pokemon, instead of scraping the moveset of active pokemon from DOM
    let damageCalculation = `
    myPkmn = app.curRoom.battle.mySide.active[0];
    theirPkmn = app.curRoom.battle.farSide.active[0];
    gen = calc.Generations.get(7);
    opponentMoves = gen7FormatsData[theirPkmn.speciesForme.replaceAll("-","").replaceAll(" ", "").toLowerCase()]["randomBattleMoves"];

    myPkmnObj = new calc.Pokemon(gen, myPkmn.speciesForme,{
        item: myPkmn.item,
        nature: "Hardy",
        ability: "${getAbility()}",
        boosts: myPkmn.boosts,
        item: myPkmn.item,
        level: myPkmn.level,
        evs: { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }
    })
    theirPkmnObj = new calc.Pokemon(gen, theirPkmn.speciesForme,{
        item: theirPkmn.item,
        nature: "Hardy",
        ability: theirPkmn.ability,
        level: theirPkmn.level,
        boosts: theirPkmn.boosts,
        item: theirPkmn.item,
        evs: { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }
    })
    yourDamageText = ["Your moves:"];
    oppDamageText = ["Their moves:"];
    for (let move of ${getMyMoves()}) {
        result = calc.calculate(gen, myPkmnObj, theirPkmnObj, new calc.Move(gen, move));
        oppHP = result.defender.stats.hp;
        minDamage = Math.floor(result.range()[0] * 1000 / oppHP) / 10;
        maxDamage = Math.floor(result.range()[1] * 1000 / oppHP) / 10;
        yourDamageText.push(move + ": " + minDamage + "% - " + maxDamage + "%");
    }
    for (let move of opponentMoves) {
        result = calc.calculate(gen, theirPkmnObj, myPkmnObj, new calc.Move(gen, move));
        myHP = result.defender.stats.hp;
        minDamage = Math.floor(result.range()[0] * 1000 / myHP) / 10;
        maxDamage = Math.floor(result.range()[1] * 1000 / myHP) / 10;
        oppDamageText.push(move + ": " + minDamage + "% - " + maxDamage + "%");
    }
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
    damageDisplayLeft.innerText = yourDamageText.join("\\n");
    damageDisplayRight.innerText = oppDamageText.join("\\n");
    document.getElementsByClassName("controls")[0].appendChild(damageDisplay);
    `;
    embedScript(damageCalculation, "damage-calculation-script");
    return true;
}

function getAbility() {
    const mouseoverEvent = new MouseEvent('mouseover', {
        'view': window,
        'bubbles': true,
        'cancelable': true
    });
    const p1Tooltip = document.querySelector('.has-tooltip[data-id="p1a"]');
    const p2Tooltip = document.querySelector('.has-tooltip[data-id="p2a"]');

    p1Tooltip.dispatchEvent(mouseoverEvent);
    var myAbility = stripLabel($('.tooltip > p').get(1).innerHTML);

    //p2Tooltip.dispatchEvent(mouseoverEvent);
   // var theirPkmnText = stripParenthesesAndLevel($('.tooltip > h2').text());

    return myAbility;
}

function stripLabel(text) {
    // "<small>Ability:</small> " is 24 char
    return text.substring(24);
}

/** 
 * Function func must return true if successful
 */
 function retryIfFail(func, interval, i) {
    if (!i) i = 0;
    if (i > 5) {
        return; // 5 is max retries for now
    }
    setTimeout(function() {
        var success = func();
        if (!success) retryIfFail(func, interval, i + 1);
    }, interval);
}

// TODO reset currentTurn when battle is over or tab is closed.
var currentTurn = $('h2.battle-history').length;

function checkIfNewTurn() {
    let numberOfTurns = $('h2.battle-history').length;

    if (numberOfTurns > currentTurn) {
        console.log("It is now turn " + numberOfTurns + ".");
        currentTurn = numberOfTurns;
        retryIfFail(calculateDamageBothSides, 500, 0);
    }
}

function getMyMoves() {
    let myMoveEls = $('button[name="chooseMove"]');
    let myMoves = myMoveEls.toArray().map((el) => $(el).attr('data-move'));
    return stringArrayToString(myMoves);
}

// String array to string
function stringArrayToString(arr) {
    let str = "[";
    for (var i = 0; i < arr.length; i++) {
        str += "'" + arr[i] + "',";
    }
    return str + "]";
}

// It all starts here 
setInterval(checkIfNewTurn, 1000);