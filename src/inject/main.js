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

// Inject script to read pokedata from app object
// calculate and console log

function calculate() {
    let damageCalculation = `let myPkmn = app.curRoom.battle.mySide.active[0];
    let theirPkmn = app.curRoom.battle.farSide.active[0];
    let gen = calc.Generations.get(7);

    let myPkmnObj = new calc.Pokemon(gen, myPkmn.name,{
        item: myPkmn.item,
        nature: "Hardy",
        ability: "${getAbility()}",
        item: myPkmn.item,
        level: myPkmn.level,
        evs: { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }
    })

    let theirPkmnObj = new calc.Pokemon(gen, theirPkmn.name,{
        item: theirPkmn.item,
        nature: "Hardy",
        ability: theirPkmn.ability,
        level: theirPkmn.level,
        item: theirPkmn.item,
        evs: { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }
    })

    console.log(calc.calculate(gen, myPkmnObj, theirPkmnObj, new calc.Move(gen, "Wild Charge")))`;
    var damageCalculationScript = document.createElement("script");
    damageCalculationScript.textContent = damageCalculation;
    (document.head).appendChild(damageCalculationScript);
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
