// Logic for UI of calculation data container
const START_X = 70; // in px
const START_Y = 70; // in px

let damageDisplayWindow = $("<div/>")
    .attr("id", "damage-display-window");
let damageDisplayCollapseButton = $("<span/>")
    .attr("id", "collapse-button")
    .html("Pokémon Showdown God Mode (click to expand / collapse this window)")
    .appendTo(damageDisplayWindow);
let damageDisplayContainer = $('<div />')
    .attr("id", "damage-display-container")
    .appendTo(damageDisplayWindow);
damageDisplayWindow.appendTo("body");
displayWelcomeMessage();

$(damageDisplayWindow).css("top", START_Y);
$(damageDisplayWindow).css("left", START_X);

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
    $(document).unbind('mousemove');
});

// Handle collapsing/expanding window
$(damageDisplayCollapseButton).click(function() {
    if ($(damageDisplayContainer).css("display") === "block") {
        $("#damage-display-container").css("display", "none");
        $(damageDisplayCollapseButton).addClass("collapse-button-collapsed");
    } else {
        $(damageDisplayCollapseButton).removeClass("collapse-button-collapsed");
        $("#damage-display-container").css("display", "block");
    }
});

// Display and embed a welcome message in the window.
function displayWelcomeMessage() {
    let welcomeMessage = $("<span/>").attr("id", "welcome-message")
        .html("<b>Welcome to Pokémon Showdown God Mode.</b> <br/> Damage calculations will be shown here once you start a battle.")
        .appendTo(damageDisplayContainer);
    let welcomeMessageSubtext = $("<span/>").attr("id", "welcome-message-subtext")
        .html("This window can be moved by clicking and dragging.")
        .appendTo(damageDisplayContainer);
}
