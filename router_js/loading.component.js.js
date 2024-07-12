/**
 * Loading Component
 *
 * A loading circle indicator for better UX
 *
 * @param {Object} options for loading initializing and progress
 * @param {number} [options.initial] initial value of loading progress
 * @param {number} [options.step] step value used during increment()
 * @param {string} options.element element selector where loading component content html should be placed
 * @param {string} [options.startColor] initial element color
 * @param {string} [options.endColor] final element color when loading is complete
 * @param {string} [options.idleColor] color of element when in idle state
 * @param {function} [options.onClick] click event handler called when loading is in 'canceled' state
 */
function Loading(options) {
    this.value = options.initial || 0;
    this.step = options.step;
    this.element = $(options.element);
    this.idleColor = options.idleColor || Loading.DEFAULT_END_COLOR;
    this.startColor = options.startColor || '#ddea14';
    this.endColor = options.endColor || Loading.DEFAULT_END_COLOR;
    this.onClick = options.onClick || $.noop;
    this.enabled = options.enabled;
    this.cancelled = false;

    this.element.load('/components/loading/loading.component.html', function () {
        this.circle = this.element.find('.progress-ring__circle');
        var radius = this.circle[0].r.baseVal.value;
        var circumference = radius * 2 * Math.PI;
        this.circle.css({
            strokeDasharray: circumference + ' ' + circumference,
            strokeDashoffset: circumference
        });
        this.circumference = circumference;
        this.enableButton(options.enabled);
        this.draw();
    }.bind(this));
}

/**
 * Maximum value constant
 *
 * Maximum percentage of progress - 100%
 */
Loading.MAX_VALUE = 100;

/**
 * Cancel value constant
 *
 */
Loading.CANCEL_VALUE = 0;

/**
 * Default loading color when finished
 */
Loading.DEFAULT_END_COLOR = '#11aa44';

/**
 * Loading value set finished event name
 *
 * Event with this name fired when value progress
 * animation is finished
 */
Loading.LOADING_EVENT_VALUE_SET_FINISHED = 'loading:value-set-finished';

/**
 * Increments loading indicator progress by a {step} instance field value
 */
Loading.prototype.increment = function () {
    if (this.value < Loading.MAX_VALUE) {
        this.value = Math.min(this.value + this.step, Loading.MAX_VALUE);
    }
    this.draw();
};

/**
 * Sets the progress value manually
 *
 * @param {number} value - progress value
 */
Loading.prototype.setValue = function (value) {
    this.value = value;
    this.draw();
};

/**
 * Sets the final color of the loading component
 *
 * @param {string} color - color value HEX/RGB
 */
Loading.prototype.setEndColor = function (color) {
    this.endColor = color;
    // only redraw if already started.
    if (this.value) {
        this.draw();
    }
};

/**
 * Applies instance field values to UI view
 */
Loading.prototype.draw = function () {
    var ratio = this.value / 100;

    if (this.circle) {
        this.circle.css({strokeDashoffset: this.circumference - this.value / 100 * this.circumference});
    }
    var svg = this.element.find('svg');

    if (svg) {
        var blend = ratio ? blendColor(this.startColor, this.endColor, ratio) : this.idleColor;

        svg.attr('stroke', blend);
        this.getInnerCircle().attr('fill', blend);
        if (this.value) {
            this.progressCounter(350);
        } else {
            this.resetButtonLabel();
        }
    }
};

/**
 * Helper method to animate progress counter
 *
 * @param {number} duration - animation total duration
 */
Loading.prototype.progressCounter = function (duration) {
    var self = this;
    var startTimestamp = null;
    var obj = this.getCircleText();
    var start = parseInt(obj.text()) || 0;
    var end = this.value;
    var step = function (timestamp) {
        if (!startTimestamp) {
            startTimestamp = timestamp;
        }
        var progress = Math.min((timestamp - startTimestamp) / duration, 1);
        if (!self.cancelled) {
            obj.text(Math.floor(progress * (end - start) + start) + '%');
        }
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            if (end == Loading.MAX_VALUE) {
                self.element.trigger(Loading.LOADING_EVENT_VALUE_SET_FINISHED);
                self.stopProgress = false;
            } else if (end == Loading.CANCEL_VALUE) {
                self.resetButtonLabel();
            }
        }
    };
    window.requestAnimationFrame(step);

};

/**
 * Resets progress button label back to "Click me"
 *
 */
Loading.prototype.resetButtonLabel = function () {
    var circleText = this.getCircleText();
    circleText.html(getLanguageStringForCurrentUserAndId('c_lo03'));
    this.cancelled = true;
    // Reduce the text font size until it fits inside the inner circle of the button.
    // This is required as translations vary in length and not all fit.
    var innerCircleWidth = this.getInnerCircle()[0].getBoundingClientRect().width;
    while(circleText[0].getBoundingClientRect().width >= innerCircleWidth) {
        var currentFontSize = parseInt(circleText.css("font-size"));
        circleText.css("font-size", currentFontSize-1);
    }
};

/**
 * Cancel loading
 *
 * Immediately cancel loading progress and set content to
 * show restart action
 */
Loading.prototype.cancel = function () {
    this.setValue(0);
};

/**
 * Get inner circle element
 *
 * @returns {Object} jquery element
 */
Loading.prototype.getInnerCircle = function () {
    return this.element.find('.inner-circle');
};

/**
 * Get circle text element
 *
 * @returns {Object} jquery element
 */
Loading.prototype.getCircleText = function () {
    return this.element.find('#diagnostic-complete');
};

/**
 * Selects a color between {start} and {end} by ratio
 *
 * @param {string} start - start color
 * @param {string} end - end color
 * @param {number} ratio - must be between 0 - 1. Smaller ratio results in blend closer to {start} color.
 *      Closer to 1 - blend closer to {end}.
 */
function blendColor(start, end, ratio) {
    var alpha = ratio;
    var beta = 1 - ratio;
    var output = '#';

    for(var i = 0; i<3; i++) {
        var sub1 = start.substring(1 + 2 * i, 3 + 2 * i);
        var sub2 = end.substring(1 + 2 * i, 3 + 2 * i);
        var v1 = parseInt(sub1, 16);
        var v2 = parseInt(sub2, 16);
        var v = Math.floor(v1 * beta + v2 * alpha);
        var sub = v.toString(16).toUpperCase();
        var padsub = ('0' + sub).slice(-2);
        output += padsub;
    }

    return output;
}

/**
 * Enables/disables clicking on progress button
 *
 * @param {boolean} enable - button if clickable if true , non-clickable otherwise
 */
Loading.prototype.enableButton = function(enable) {
    var svg = this.element.find('#progress-svg');
    if (enable) {
        svg.one('click', this.onClick);
        svg.css('cursor', 'pointer');
    } else {
        svg.click($.noop);
        svg.css('cursor', 'not-allowed');
    }
    this.cancelled = false;
};
