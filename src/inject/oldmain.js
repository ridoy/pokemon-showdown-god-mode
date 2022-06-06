console.log("Script loaded");

var p1Team = [];
var p2Team = [];
const evs = { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 };
const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
const gen = calc.Generations.get(7);
// Inject calc
// Inject script to read pokedata from app object
// calculate and console log
//
var injectedScript = calcScript;

function calculateStrongestMoveEachSide() {
    var pkmn = getCurrentPokemon();
    var chatbox = $('.battle-log-add .textbox')[1];
    chatbox.value = "/randbats " + pkmn['theirPkmn']['name'];
    var ev = new KeyboardEvent('keydown', {altKey:false,
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

    var myPkmn = new calc.Pokemon(gen, pkmn['myPkmn']['name'], {
        level: pkmn['myPkmn']['level'],
        nature: 'Hardy',
        evs: evs,
        ivs: ivs  
    });

    var theirPkmn = new calc.Pokemon(gen, pkmn['theirPkmn']['name'], {
        level: pkmn['theirPkmn']['level'],
        nature: 'Hardy',
        evs: evs,
        ivs: ivs  
    });
    var moveEls = $($('.infobox').slice(-1)).find("a");
    if (!moveEls) { return false; }
    if ($('.infobox').slice(-1).find('span')[0].innerText.indexOf(pkmn['theirPkmn']['name']) === -1) {
        return false;
    }
    var opponentMoves = [];
    var myMoveEls = $('button[name="chooseMove"]');
    var myMoves = [];
    for (var i = 0; i < myMoveEls.length; i++) {
        myMoves.push($(myMoveEls[i]).attr('data-move'));
    }
    moveEls.each((i) => opponentMoves.push(moveEls[i].text));
    var maxHP = myPkmn.maxHP()

    var damageRanges = {};
    var moveWithMaxDamage = {name: opponentMoves[0], max: 0, min: 0};
    for (var move of opponentMoves) {
        console.log(gen, theirPkmn, myPkmn, move);
        var result = calc.calculate(
          gen,
          theirPkmn,
          myPkmn,
          new calc.Move(gen, move)
        );
        var minDamage = Math.floor(result.range()[0] * 1000 / maxHP) / 10;
        var maxDamage = Math.floor(result.range()[1] * 1000 / maxHP) / 10;
        if (maxDamage > moveWithMaxDamage.max) {
            moveWithMaxDamage = { name: move, min: minDamage, max: maxDamage };
        }
        damageRanges[move] = [minDamage, maxDamage];
    }
    console.log("Opponent's most dangerous attack: " + moveWithMaxDamage.name + " " + moveWithMaxDamage.min + "-" + moveWithMaxDamage.max + "%");
    console.log(damageRanges);

    damageRanges = {};
    moveWithMaxDamage = {name: myMoves[0], max: 0, min: 0};
    for (var move of myMoves) {
        var result = calc.calculate(
          gen,
          myPkmn,
          theirPkmn,
          new calc.Move(gen, move)
        );
        var minDamage = Math.floor(result.range()[0] * 1000 / maxHP) / 10;
        var maxDamage = Math.floor(result.range()[1] * 1000 / maxHP) / 10;
        if (maxDamage > moveWithMaxDamage.max) {
            moveWithMaxDamage = { name: move, min: minDamage, max: maxDamage };
        }
        damageRanges[move] = [minDamage, maxDamage];
    }
    console.log("My most dangerous attack: " + moveWithMaxDamage.name + " " + moveWithMaxDamage.min + "-" + moveWithMaxDamage.max + "%");
    console.log(damageRanges);
    return true;
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
        retryIfFail(calculateStrongestMoveEachSide, 500, 0);

    }
}

setInterval(checkIfNewTurn, 1000);

/** 
 * Get names of current Pokemon on battlefield for both sides.
 * Only works for single battles right now.
 */
function getCurrentPokemon() {
    const mouseoverEvent = new MouseEvent('mouseover', {
        'view': window,
        'bubbles': true,
        'cancelable': true
    });
    const p1Tooltip = document.querySelector('.has-tooltip[data-id="p1a"]');
    const p2Tooltip = document.querySelector('.has-tooltip[data-id="p2a"]');

    p1Tooltip.dispatchEvent(mouseoverEvent);
    var myPkmnText = stripParenthesesAndLevel($('.tooltip > h2').text());

    p2Tooltip.dispatchEvent(mouseoverEvent);
    var theirPkmnText = stripParenthesesAndLevel($('.tooltip > h2').text());

    return { 
        myPkmn: myPkmnText,
        theirPkmn: theirPkmnText
    };
}

/**
 * Get P1 or P2 Pokemon's real name and level.
 * Given text from the tooltip, usually in the form of:
 * "Pikachu L100"  or "SomeNickname (Pikachu) L100"
 */
function stripParenthesesAndLevel(text) {
    var name = "";
    var leftParenIndex = text.indexOf("(");
    var rightParenIndex = text.indexOf(")");
    if (leftParenIndex !== -1 && rightParenIndex !== -1) {
        // Is alternate forme, correct name is in parenthesis
        name = text.substring(leftParenIndex + 1, rightParenIndex);
    } else {
        name = text.replace(/ L[0-9]{1,3}/, "")
    }
    // Strip level
    return {
        level: parseInt(text.match(/L[0-9]{1,3}/)[0].slice(1)),
        name: name.trim()
    }
}

var isValidKey = function(keyCode) {
    return (keyCode == 48) || (keyCode == 49) || (keyCode == 50);
}

function retrieveWindowVariables(variables) {
    var ret = {};

    var scriptContent = "";
    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        scriptContent += "if (typeof " + currVariable + " !== 'undefined') $('body').attr('tmp_" + currVariable + "', JSON.stringify(" + currVariable + "));\n"
    }

    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        ret[currVariable] = $.parseJSON($("body").attr("tmp_" + currVariable));
        $("body").removeAttr("tmp_" + currVariable);
    }

     $("#tmpScript").remove();

    return ret;
}
