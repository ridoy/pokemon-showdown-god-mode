function SlideoutContainer() {
    let $this = this;
    const SLIDEOUT_MIN_HEIGHT = 50; // in px
    damageDisplaySlideout = document.createElement("div");
    damageDisplaySlideout.id = "damage-display-slideout";

    let damageDisplayCollapseButton = document.createElement("span");
    damageDisplayCollapseButton.innerText = "Click and drag to adjust size";
    damageDisplayCollapseButton.id = "collapse-button";

    damageDisplaySlideout.appendChild(damageDisplayCollapseButton);
    document.body.appendChild(damageDisplaySlideout);

    this.addEventListeners = function() {
        $(damageDisplaySlideout).css("top", $(window).height() - SLIDEOUT_MIN_HEIGHT);
        $(damageDisplayCollapseButton).mousedown(function(e) {
            let dragging = true;
            $(damageDisplayCollapseButton).css("cursor", "grabbing");
            $(document).mousemove(function(e) {
                let cursorTooLow = $(window).height() - e.pageY < SLIDEOUT_MIN_HEIGHT;
                let cursorTooHigh = e.pageY < 0;
                if (cursorTooLow) {
                    $(damageDisplaySlideout).css("top", $(window).height() - SLIDEOUT_MIN_HEIGHT);
                } else if (cursorTooHigh) {
                    $(damageDisplaySlideout).css("top", 0);
                } else {
                    $(damageDisplaySlideout).css("top", e.pageY);
                }
            });
        });
        $(document).mouseup(function() {
            $(damageDisplayCollapseButton).css("cursor", "grab");
            $(document).unbind('mousemove');
        });
    }
}