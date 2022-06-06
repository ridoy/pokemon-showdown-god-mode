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


// The funny thing is, with Chrome extensions, you don't have access to 
// JavaScript variables on the page. So we have to do something a little sloppy
// - we inject the calculation script to get access to the Pokemon on the field,
// run the calculation
function calculate() {
    let previouslyInjectedScript = document.getElementById("damage-calculation-script");
    if (previouslyInjectedScript) previouslyInjectedScript.remove();

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
var currentTurn = $('h2.battle-history').length;

function checkIfNewTurn() {
    var numberOfTurns = $('h2.battle-history').length;

    if (numberOfTurns > currentTurn) {
        console.log("It is now turn " + numberOfTurns + ".");
        currentTurn = numberOfTurns;
        retryIfFail(calculate, 500, 0);
    }
}

setInterval(checkIfNewTurn, 1000);

function getMyMoves() {
    var myMoveEls = $('button[name="chooseMove"]');
    var myMoves = "[";
    for (var i = 0; i < myMoveEls.length; i++) {
        myMoves += "'" + $(myMoveEls[i]).attr('data-move') + "',";
    }
    return myMoves + "]";
}