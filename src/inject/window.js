// Logic for UI of calculation data container
function DataWindow() {
    const START_X = 70; // in px
    const START_Y = 70; // in px

    const COLLAPSE_BUTTON_TEXT = "Pokémon Showdown God Mode (click to expand / collapse this window)";
    const WELCOME_MESSAGE_HTML = "<b>Welcome to Pokémon Showdown God Mode.</b>"
        + "<br/> Damage calculations will be shown here once you start a battle.";
    const WELCOME_MESSAGE_SUBTEXT_HTML = "This window can be moved by clicking and dragging."

    const WINDOW_ID = "damage-display-window";
    const COLLAPSE_BUTTON_ID = "collapse-button";
    const COLLAPSE_BUTTON_COLLAPSED_CLASSNAME = "collapse-button-collapsed";
    const WINDOW_CONTENT_ID = "damage-display-container";
    const WELCOME_MESSAGE_ID = "welcome-message";
    const WELCOME_MESSAGE_SUBTEXT_ID = "welcome-message-subtext";

    let damageDisplayWindow = $("<div/>")
        .attr("id", WINDOW_ID);
    let damageDisplayCollapseButton = $("<span/>")
        .attr("id", COLLAPSE_BUTTON_ID)
        .html(COLLAPSE_BUTTON_TEXT)
        .appendTo(damageDisplayWindow);
    let damageDisplayContainer = $('<div />')
        .attr("id", WINDOW_CONTENT_ID)
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

    // Display and embed a welcome message in the window.
    function displayWelcomeMessage() {
        let welcomeMessage = $("<span/>").attr("id", WELCOME_MESSAGE_ID)
            .html(WELCOME_MESSAGE_HTML)
            .appendTo(damageDisplayContainer);
        let welcomeMessageSubtext = $("<span/>").attr("id", WELCOME_MESSAGE_SUBTEXT_ID)
            .html(WELCOME_MESSAGE_SUBTEXT_HTML)
            .appendTo(damageDisplayContainer);
    }

    // Recalculate all damages using the current state of the battle and update the displayed data
    // accordingly.
    function refresh() {
        // Call damageCalculator.calculate();
        // Use data to update window
    }

    return {
        refresh: refresh
    }
}