// Logic for UI of calculation data container
let damageDisplaySlideout = $("<div/>").attr("id", "damage-display-slideout");
let damageDisplayCollapseButton = $("<span/>").attr("id", "collapse-button")
    .html("Pokémon Showdown God Mode (click to expand / collapse this window)").appendTo(damageDisplaySlideout);
damageDisplaySlideout.appendTo("body");

const START_X = 30; // in px
const START_Y = 30; // in px


let welcomeMessage = $("<span/>").attr("id", "welcome-message")
    .html("<b>Welcome to Pokémon Showdown God Mode.</b> <br/> Damage calculations will be shown here once you start a battle.")
    .appendTo(damageDisplaySlideout);
let welcomeMessageSubtext = $("<span/>").attr("id", "welcome-message-subtext")
    .html("This window can be moved by clicking and dragging.")
    .appendTo(welcomeMessage);

$(damageDisplaySlideout).css("top", START_Y);
$(damageDisplaySlideout).css("left", START_X);

$(damageDisplaySlideout).mousedown(function(e) {
    $(damageDisplaySlideout).css("cursor", "grabbing");
    let offset0 = $(this).offset();
    let x0 = e.pageX;
    let y0 = e.pageY;
    $(document).mousemove(function(e) {
        $(damageDisplaySlideout).css("top", offset0.top + (e.pageY - y0));
        $(damageDisplaySlideout).css("left", offset0.left + (e.pageX - x0));
    });
});

$(document).mouseup(function() {
    $(damageDisplaySlideout).css("cursor", "grab");
    $(document).unbind('mousemove');
});

$(damageDisplayCollapseButton).click(function() {
    let collapseButtonHeight = `${$(damageDisplayCollapseButton).height() + 10}px`; // total padding = 10px
    if ($(damageDisplaySlideout).css("height") !== collapseButtonHeight) {
        $(damageDisplaySlideout).css("height", collapseButtonHeight);
        $("#damage-display-container").css("display", "none");
        $("#welcome-message").css("display", "none");
    } else {
        $(damageDisplaySlideout).css("height", "350px");
        $("#damage-display-container").css("display", "block");
        $("#welcome-message").css("display", "block");
    }
})