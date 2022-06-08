console.log("Script loaded");
// Inject calc

var smogonCalcScript = document.createElement("script");
smogonCalcScript.id = "data-script";
smogonCalcScript.textContent = smogonCalc;
(document.head).appendChild(smogonCalcScript);

var smogonCalcDataScript = document.createElement("script");
smogonCalcDataScript.id = "calc-script";
smogonCalcDataScript.textContent = smogonCalcData;
(document.head).appendChild(smogonCalcDataScript);


// Chrome extensions run in a separate scope from the current page. Therefore, you can't access
// any variables in the page's environment, like `app` which contains the game state.
// The workaround is to inject our code as a string in a new <script> element. It's sloppy but the
// only alternative I see is scraping this information from the DOM (in which I am uninterested).
function calculateDamageBothSides() {

    // Where I left off
    // Perhaps https://github.com/smogon/pokemon-showdown/blob/d09e2d83549f57fa183b34945e4ae7676d1dc21a/data/formats-data.ts
    // Read random battle sets from this file (and figure otu the right gen too? how doe sthat work?)
    // 
    let previouslyInjectedScript = document.getElementById("damage-calculation-script");
    if (previouslyInjectedScript) previouslyInjectedScript.remove();
    let chatbox = $('.battle-log-add .textbox')[1];
    chatbox.value = "/randbats Raikou"; // TODO change
    let ev = new KeyboardEvent('keydown', {altKey:false,
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
      which: 13});
    chatbox.dispatchEvent(ev);
    let opponentMoves = [];
    let moveEls = $($(".infobox").slice(-1)).find("a");
    if (!moveEls) { return false; }
    if ($(".infobox").slice(-1).find("span")[0].innerText.indexOf("Raikou") === -1) {
        return false; // Will trigger retry
    }
    moveEls.each((i) => opponentMoves.push(moveEls[i].text));
    opponentMoves = stringArrayToString(opponentMoves);

    let damageCalculation = `myPkmn = app.curRoom.battle.mySide.active[0];
    theirPkmn = app.curRoom.battle.farSide.active[0];
    gen = calc.Generations.get(7);

    myPkmnObj = new calc.Pokemon(gen, myPkmn.name,{
        item: myPkmn.item,
        nature: "Hardy",
        ability: "${getAbility()}",
        boosts: myPkmn.boosts,
        item: myPkmn.item,
        level: myPkmn.level,
        evs: { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }
    })
    theirPkmnObj = new calc.Pokemon(gen, theirPkmn.name,{
        item: theirPkmn.item,
        nature: "Hardy",
        ability: theirPkmn.ability,
        level: theirPkmn.level,
        boosts: theirPkmn.boosts,
        item: theirPkmn.item,
        evs: { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }
    })
    for (let move of ${getMyMoves()}) {
        result = calc.calculate(gen, myPkmnObj, theirPkmnObj, new calc.Move(gen, move));
        oppHP = result.defender.stats.hp;
        minDamage = Math.floor(result.range()[0] * 1000 / oppHP) / 10;
        maxDamage = Math.floor(result.range()[1] * 1000 / oppHP) / 10;
        console.log(move + " does " + minDamage + "% - " + maxDamage + "%");
    }
    for (let move of ${opponentMoves}) {
        result = calc.calculate(gen, theirPkmnObj, myPkmnObj, new calc.Move(gen, move));
        myHP = result.defender.stats.hp;
        minDamage = Math.floor(result.range()[0] * 1000 / myHP) / 10;
        maxDamage = Math.floor(result.range()[1] * 1000 / myHP) / 10;
        console.log(move + " does " + minDamage + "% - " + maxDamage + "%");
    }`;
    var damageCalculationScript = document.createElement("script");
    damageCalculationScript.id = "damage-calculation-script";
    damageCalculationScript.textContent = damageCalculation;
    (document.head).appendChild(damageCalculationScript);
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