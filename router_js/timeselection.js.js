// Object containing previous values of time sliders
var timeSlidersPreviousValues = {};

var TIMELINE_WIDTH_PX = 670;
var TIMELINE_HEIGHT_PX = 15;

// Each hour width in pixels
var TIMELINE_HOUR_WIDTH_PX = ((TIMELINE_WIDTH_PX + 10) / 25);

// Minimum range length in hours
var MIN_RANGE_LENGTH = 1;

// Length of created range
var RANGE_ADD_LENGTH = 2;

// Width of the whole handle element
var HANDLE_ELEMENT_WIDTH_PX = 66;
var HANDLE_ELEMENT_HALF_WIDTH_PX = HANDLE_ELEMENT_WIDTH_PX/2;

// Width of the "small handle" which is inside handle element
// and is directly over timeline.
// Used to reduce bar width so that it doesn't cover handle
var HANDLE_WIDTH_PX = 16;
var HANDLE_HALF_WIDTH_PX = HANDLE_WIDTH_PX/2;

// Days of the week in the time selection table
var DAYS_OF_WEEK_TIME_SELECTION = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
];

function getHourFromPosition(position) {
    if (position < 0) {
        position = 0;
    }
    return Math.floor(position / TIMELINE_HOUR_WIDTH_PX);
}

function getPositionFromHour(hour) {
    return Math.floor(hour * TIMELINE_HOUR_WIDTH_PX);
}

// converts x to 0x:00
function convertHourToText(hour) {
    return (("0" + hour.toString()).slice(-2)) + ":00";
}

// $range - jQuery object for range
function updateRangeRemoveButtonPosition($range) {
    var rangeStartHandleLeft = parseInt($range.children(".time-slider-range-handle-begin").css("left"));
    var rangeEndHandleLeft = parseInt($range.children(".time-slider-range-handle-end").css("left"));

    // Remove button is positioned with respect to the range bar.
    // Therfore, need to subtract offset
    // HANDLE_ELEMENT_HALF_WIDTH_PX + HANDLE_HALF_WIDTH_PX
    $range.children(".time-slider-range-bar").children(".time-slider-range-remove").css({
        left: (rangeEndHandleLeft - rangeStartHandleLeft)/2 -
        (HANDLE_ELEMENT_HALF_WIDTH_PX + HANDLE_HALF_WIDTH_PX)} );
}

// $bar - jQuery object for range bar
function updateRangeBarPosition($bar, positionStart, positionEnd) {
    $bar.css({
            left: HANDLE_ELEMENT_HALF_WIDTH_PX + positionStart + HANDLE_HALF_WIDTH_PX,
            width: (positionEnd - positionStart) - HANDLE_WIDTH_PX});
}

// $handle - jQuery object for handle
function isHandleMovementAllowed($handle, ui, prevHour, newHour) {
    if ($handle.hasClass("time-slider-range-handle-begin")) {
        if (Math.abs(ui.position.left - ui.originalPosition.left) < 2) {
            // avoid roundoff errors
            return false;
        } else if (ui.position.left < ui.originalPosition.left) {
            // dragging left - check if overwriting range on the left
            var adjacentRangeHour = $.map($(".time-slider-range-handle-end"), function(hour) {
                    // Get end hours of all ranges
                    return (parseInt($(hour).attr("data-hour")));
                }).filter(function(hour){
                    // Get only ranges with hour less than or equal previous hour
                    return hour <= prevHour;
                }).sort(function(a, b) {
                    // reverse sort
                    return b - a;
                })[0];

            return adjacentRangeHour ? adjacentRangeHour <= newHour : true;
        } else {
            // draggin right - check for minimum range length
            return parseInt($handle.siblings(".time-slider-range-handle-end").attr("data-hour")) >= newHour + MIN_RANGE_LENGTH;
        }
    } else if ($handle.hasClass("time-slider-range-handle-end")) {
        if (Math.abs(ui.position.left - ui.originalPosition.left) < 2) {
            // avoid roundoff errors
            return false;
        } else if (ui.position.left < ui.originalPosition.left) {
            // draggin left - check for minimum range length
            return parseInt($handle.siblings(".time-slider-range-handle-begin").attr("data-hour")) + MIN_RANGE_LENGTH <= newHour;
        } else {
            // dragging right - check if overwriting range on the right
            var adjacentBeginRangeHour = $.map($(".time-slider-range-handle-begin"), function(hour) {
                    // Get begin hours of all ranges
                    return (parseInt($(hour).attr("data-hour")));
                }).filter(function(hour){
                    // Get only ranges with hour greater than or equal previous hour
                    return hour >= prevHour;
                }).sort(function(a, b) {
                    return a - b;
                })[0];

            return adjacentBeginRangeHour ? newHour <= adjacentBeginRangeHour : true;
        }
    } else {
        throw "Incorrect object passed to isMovementAllowed";
    }
}

// $range - jQuery object for range
function findRangeForMerging($range) {
    var rangeStartHour = parseInt($range.children(".time-slider-range-handle-begin").attr("data-hour"));
    var rangeEndHour = parseInt($range.children(".time-slider-range-handle-end").attr("data-hour"));

    // Check if range is overlaping with other
    var ranges = $range.siblings(".time-slider-range")
        .filter(function(){
            return rangeStartHour <= parseInt($(this).children(".time-slider-range-handle-end").attr("data-hour")) &&
                rangeEndHour >= parseInt($(this).children(".time-slider-range-handle-begin").attr("data-hour"));
        });

    return ranges;
}

function mergeRanges($range1, $range2) {
    var beginHour = Math.min(
        parseInt($range1.children(".time-slider-range-handle-begin").attr("data-hour")),
        parseInt($range2.children(".time-slider-range-handle-begin").attr("data-hour")));

    var endHour = Math.max(
        parseInt($range1.children(".time-slider-range-handle-end").attr("data-hour")),
        parseInt($range2.children(".time-slider-range-handle-end").attr("data-hour")));


    $range2.remove();
    $range1.children(".time-slider-range-handle-begin")
        .attr("data-hour", beginHour)
        .text(convertHourToText(beginHour))
        .css({left : getPositionFromHour(beginHour)});

    $range1.children(".time-slider-range-handle-end")
        .attr("data-hour", endHour)
        .text(convertHourToText(endHour))
        .css({left : getPositionFromHour(endHour)});

    updateRangeRemoveButtonPosition($range1);

    updateRangeBarPosition(
        $range1.children(".time-slider-range-bar"),
        getPositionFromHour(beginHour),
        getPositionFromHour(endHour));
}

/**
 * Creates time slider
 *
 * @param {string} parentId Id of parent to which slider will be prepended
 * @param {string} idPrefix Slider id prefix
 */
function createTimeSlider(parentId, idPrefix) {
    // On add handle click - add new range and merge it with existing ranges if needed
    function onAddHandleClick(e) {
        $("#"+idPrefix+"-apply-changes").prop("disabled", false);
        $("#time-slider-add-handler").hide();

        // Get hour asociated with the click position
        var hour = getHourFromPosition(e.pageX - newTimeSliderTimeLine.offset().left);

        // If new hour range wouldn't fit into timeline, shift it left
        hour = Math.min(24 - MIN_RANGE_LENGTH, hour);
        var endRange = hour > 22 ? MIN_RANGE_LENGTH : RANGE_ADD_LENGTH;
        var range = { "begin": hour, "end": hour + endRange};

        var newRange = createTimeRange(newTimeSliderTimeLineArea, range);

        // Check if newly created range should be merged with existing one.
        // Merging is needed if new range is within RANGE_ADD_LENGTH distance
        // to the existing range.
        // Covers merging from both sides:
        // - If new range is created within RANGE_ADD_LENGTH from the end of timeline
        //   merges with range on the left if needed
        // - in other cases merges with range on the right if needed
        var mergeRange = findRangeForMerging(newRange);

        if (mergeRange.length) {
            mergeRanges(newRange, mergeRange);
        }
    }

    // On mouseover - detect cursor:
    // - entering timeline both from outside of timeline
    //   or from other element (range handle)
    // - leaving cursor towards other element (range handle)
    function onMouseOver(e) {
        if ($(e.target).is(newTimeSliderTimeLine)) {
            if (!newTimeSliderTimeLine.hasClass("time-slider-time-line-handle-dragging")) {
                var addHandler = $("#time-slider-add-handler");

                addHandler.css({left : -10 + e.pageX - newTimeSliderTimeLine.offset().left});

                // Activate mouse move
                newTimeSliderTimeLine.on("mousemove", onMouseMove);

                addHandler.show();
            }
        } else if ($(e.target).is(".time-slider-range-handle.time-slider-range-handle-begin, .time-slider-range-handle.time-slider-range-handle-end")) {
            newTimeSliderTimeLine.off("mousemove");

            $("#time-slider-add-handler").hide();
        }
        // else if target is add button - do nothing
    }

    // On mousemove - update add handler position
    // Should be active only if directly over timeline
    // Activated by mouseover(timeline)
    // Deactivated when cursor
    // - is leaving towards other timeline element - by mouseover(other element)
    // - is leaving timeline completely - handled by this function
    function onMouseMove(e) {
        var addHandler = $("#time-slider-add-handler");

        addHandler.css({left : -10 + e.pageX - newTimeSliderTimeLine.offset().left});

        // Check for cursor leaving timeline - done by calculating coordinates
        // as timeline mouseout/mouseleave event is not triggered because add handler
        // (which is timeline child) is extending beyond timeline
        var timelineX = e.pageX - newTimeSliderTimeLine.offset().left;
        var timelineY = e.pageY - newTimeSliderTimeLine.offset().top;

        // timelineX/Y < -3 is workaround for an issue when cursor
        // enters timeline from left/above and mousemove event left/top position
        // is stuck at value from leaving timeline (i .e. -0.666...)
        if (timelineX < -3 || timelineX > TIMELINE_WIDTH_PX || timelineY < -3 || timelineY > TIMELINE_HEIGHT_PX) {
            // Deactivate mouse move event
            newTimeSliderTimeLine.off("mousemove");
            addHandler.hide();
        }
    }

    var sliderId = idPrefix + "-time-slider";

    // Initialize slider previous state variable to compare if changed later
    timeSlidersPreviousValues[idPrefix] = [];

    var timeSlider = $("<div/>", {
        class: "time-slider",
        id: sliderId
    });

    var newTimeSliderHours = $("<div/>", {
            class: "time-slider-hours"
        }).appendTo(timeSlider);

    for (var i = 0; i < 25; i++) {
        newTimeSliderHours.append(
            $("<span/>", {
                text: ("0" + i.toString()).slice(-2)
            }));
    }

    // Gray timeline bar
    var newTimeSliderTimeLine = $("<div/>", {
            class: "time-slider-time-line",
            id: "time-slider-time-line"
        }).appendTo(timeSlider);

    // Invisible container element, slightly wider then timeline.
    // Used by draggable widget to contain hour ranges handlers which are
    // attached to it. It's needed as for extreme hours of the day
    // handlers needs to exceed the timeline.
    var newTimeSliderTimeLineArea = $("<div/>", {
            class: "time-slider-time-line-area",
            id: "time-slider-time-line-area"
        }).appendTo(newTimeSliderTimeLine);

    timeSlider.prependTo("#" + parentId);

    // On range bar mouseenter show range remove button
    newTimeSliderTimeLineArea.on( "mouseenter", ".time-slider-range-bar", function(e) {
        if (!newTimeSliderTimeLine.hasClass("time-slider-time-line-handle-dragging")) {
            $(this).children(".time-slider-range-remove").show();
        }
    });

    // On range bar mouseleave hide range remove button
    newTimeSliderTimeLineArea.on( "mouseleave", ".time-slider-range-bar", function(e) {
        $(this).children(".time-slider-range-remove").hide();
    });

    // On range bar click remove hour range
    newTimeSliderTimeLineArea.on( "click", ".time-slider-range-bar", function(e) {
        $(this)
            .toggle()
            .parent().remove();
        //When a slider is removed, enable the "apply changes" button by making disable prop false
        $("#" + idPrefix + "-apply-changes").prop("disabled", false);
    });

    // Add add handle
    $("<div/>", {
        class: "time-slider-range-handle time-slider-range-add",
        id: "time-slider-add-handler"
    })
    .css({left: 0})
    .css({display: "none"})
    .append($("<span/>", {
        class: "langHtml",
        "data-lang-id": "g_pc36",
        text: getLanguageStringForCurrentUserAndId("g_pc36")
    })).appendTo(newTimeSliderTimeLineArea);

    // On add handle click
    newTimeSliderTimeLineArea.on("click", ".time-slider-range-add", onAddHandleClick);

    // On timeline mouseover
    newTimeSliderTimeLine.on("mouseover", onMouseOver);

    // Add clear button
    var clearAllButtonArea = $("<div/>", {
        class: "time-slider-clear-all-area"
    });

    var clearAllButton = $("<a/>", {
            class: "time-slider-clear-all langHtml",
            "data-lang-id": "g_pc28",
            text: "Clear All",
            id: sliderId + "-clear-all"
        }).appendTo(clearAllButtonArea);

    clearAllButtonArea.appendTo(timeSlider);

    $(clearAllButton).on("click", (function() {
        $(".time-slider-range").remove();
    }));
}

function createTimeRange(parentId, rule) {
    var hourRange = $("<div/>", {
        class: "time-slider-range"
    }).appendTo(parentId);

    var rangeStartHandle = $("<div/>", {
            class: "time-slider-range-handle time-slider-range-handle-begin",
            text: convertHourToText(rule.begin),
            "data-hour": rule.begin,
        }).css({left : getPositionFromHour(rule.begin)})
        .appendTo(hourRange);

    rangeStartHandle.draggable({
        axis: "x",
        containment: $("#time-slider-time-line-area"),
        // Set the offset of the handle relative to the cursor so that it is centered
        cursorAt: { left: 19 },
        start: function( e, ui ) {
            $(this).addClass("time-slider-range-handle-dragging");

            // Prevent remove and add buttons from showing during drag
            $("#time-slider-time-line").addClass("time-slider-time-line-handle-dragging");
        },
        stop: function( e, ui ) {
            var $this = $(this);

            $(this).removeClass("time-slider-range-handle-dragging");

            // Allow remove and add buttons showing
            $("#time-slider-time-line").removeClass("time-slider-time-line-handle-dragging");

            // Merge range with adjacent range if neeeded
            var mergeRange = findRangeForMerging($this.parent());
            if (mergeRange.length) {
                mergeRanges($this.parent(), mergeRange);
            }

            updateRangeRemoveButtonPosition($this.parent());
        },
        drag: function( e, ui ) {
            var $this = $(this);

            // Callculate new hour grid position and new hour
            var newPosition = ui.position.left - (ui.position.left % TIMELINE_HOUR_WIDTH_PX);
            var prevHour = parseInt($this.attr("data-hour"));
            var newHour = getHourFromPosition(ui.position.left);

            if (prevHour !== newHour) {
                if (isHandleMovementAllowed($this, ui, prevHour, newHour)) {
                    // Hour changed - set new grid position
                    ui.position.left = newPosition;

                    $this.attr("data-hour", newHour)
                        .text(convertHourToText(newHour));

                    updateRangeBarPosition(
                        $this.siblings(".time-slider-range-bar"),
                        ui.position.left, $this.siblings(".time-slider-range-handle-end").position().left);
                } else {
                    // Drag position indicates new hour but movement is not allowed
                    // overwrite position with previous hour position
                    ui.position.left = getPositionFromHour(prevHour);
                }
            } else {
                // Hour didn't change - overwrite position for grid
                ui.position.left = newPosition;
            }
        }
    });

    var rangeEndHandle = $("<div/>", {
            class: "time-slider-range-handle time-slider-range-handle-end",
            text: convertHourToText(rule.end),
            "data-hour": rule.end,
        }).css({"left" : getPositionFromHour(rule.end)})
        .appendTo(hourRange);

    rangeEndHandle.draggable({
        axis: "x",
        containment: $("#time-slider-time-line-area"),
        // Set the offset of the handle relative to the cursor so that it is centered
        cursorAt: { left: 19 },
        start: function( e, ui ) {
            $(this).addClass("time-slider-range-handle-dragging");

            // Prevent remove and add button from showing during drag
            $("#time-slider-time-line").addClass("time-slider-time-line-handle-dragging");
        },
        stop: function( e, ui ) {
            var $this = $(this);

            $(this).removeClass("time-slider-range-handle-dragging");

            // Allow remove and add buttons showing
            $("#time-slider-time-line").removeClass("time-slider-time-line-handle-dragging");

            // Merge range with adjacent range if neeeded
            var mergeRange = findRangeForMerging($this.parent());
            if (mergeRange.length) {
                mergeRanges($this.parent(), mergeRange);
            }

            updateRangeRemoveButtonPosition($this.parent());
        },
        drag: function( e, ui ) {
            var $this = $(this);
            var newPosition = ui.position.left - (ui.position.left % TIMELINE_HOUR_WIDTH_PX);
            var prevHour = parseInt($this.attr("data-hour"));
            var newHour = getHourFromPosition(ui.position.left);

            if (prevHour !== newHour) {
                if (isHandleMovementAllowed($this, ui, prevHour, newHour)) {
                    // Hour changed - set new grid position
                    ui.position.left = newPosition;

                    $this.attr("data-hour", newHour)
                        .text(convertHourToText(newHour));

                    updateRangeBarPosition(
                        $this.siblings(".time-slider-range-bar"),
                        $this.siblings(".time-slider-range-handle-begin").position().left, ui.position.left);
                } else {
                    // Drag position indicates new hour but movement is not allowed
                    // overwrite position with previous hour position
                    ui.position.left = getPositionFromHour(prevHour);
                }
            } else {
                // Hour didn't change - overwrite position for grid
                ui.position.left = newPosition;
            }
        }
    });

    var timeSliderRangeBar = $("<div/>", {
        class: "time-slider-range-bar"
    });

    updateRangeBarPosition(timeSliderRangeBar, getPositionFromHour(rule.begin), getPositionFromHour(rule.end));

    var rangeRemoveHandle =  $("<div/>", {
        class: "time-slider-range-handle time-slider-range-remove"
    })
    .css({display: "none"})
    .append($("<span/>", {
        class: "langHtml",
        "data-lang-id": "g_pc37",
        text: getLanguageStringForCurrentUserAndId("g_pc37")
    }));

    rangeRemoveHandle.appendTo(timeSliderRangeBar);

    timeSliderRangeBar.appendTo(hourRange);

    updateRangeRemoveButtonPosition(hourRange);

    return hourRange;
}

function convertRulesRangesTo24HourArray(rulesRanges) {
    rulesRanges.sort(function(a, b) {
        return a.begin - b.begin;
    });

    var hourArray = [];
    var ruleObj = {};

    for (var key in rulesRanges) {
        ruleObj = rulesRanges[key];

        for (var i = ruleObj.begin; i < ruleObj.end; i++) {
            hourArray.push(parseInt(i));
        }
    }

    return hourArray;
}

/**
 * Gets daily times selection slider values
 *
 * @param {string} idPrefix Slider id prefix
 * @returns {Array} integer array of selected hours [0-23]
 */
function getTimeSliderValues(idPrefix) {
    var rulesRanges = [];
    $("#" + idPrefix + "-time-slider > * > * > .time-slider-range")
        .each(function(i, cell) {
        rulesRanges.push(
            {"begin": parseInt($(cell).children(".time-slider-range-handle-begin").text()),
            "end": parseInt($(cell).children(".time-slider-range-handle-end").text())});
    });

    return convertRulesRangesTo24HourArray(rulesRanges);
}

/**
 * Sets daily times selection slider values
 *
 * @param {string} idPrefix Slider id prefix
 * @param {Array} rule integer array of selected hours [0-23]
 */
function setTimeSliderValues(idPrefix, rule) {
    // Store state for slider values changed check
    timeSlidersPreviousValues[idPrefix] = rule;

    var hourRules = [];
    var begin = parseInt(rule[0]);
    var end = 0;
    for (var i = 0; i < rule.length; i++) {
        if ((i != rule.length - 1) && (rule[i] == rule[i + 1] - 1)) {
            end = rule[i + 1];
        } else {
            if (end < begin) {
                end = begin;
            }
            hourRules.push({ "begin": begin, "end": end + 1 });
            begin = rule[i + 1];
        }
    }

    hourRules.forEach(function(rule) {
        createTimeRange("#" + idPrefix + "-time-slider > * > #time-slider-time-line-area", rule);
    });
}

/**
 * Saves daily times selection slider state so that changes can be detected.
 *
 * @param {string} idPrefix Slider id prefix
 */
function saveTimeSliderState(idPrefix) {
    timeSlidersPreviousValues[idPrefix] =
        getTimeSliderValues(idPrefix);
}

/**
 * Checks if selection changed since values were last set
 *
 * @param {string} idPrefix Slider id prefix
 * @returns {boolean} true if changed
 */
function isTimeSliderValuesChanged(idPrefix) {
    return getTimeSliderValues(idPrefix).toString() !==
        timeSlidersPreviousValues[idPrefix].toString();
}

// Day specific time table

// Object containing previous values of tables
var daySpecificTimesTablesPreviousValues = {};

/**
 * Creates day specific time selection table
 *
 * @param {string} parentId Id of parent to which table will be prepended
 * @param {string} idPrefix Table id prefix
 */
function createDaySpecificTimesTable(parentId, idPrefix) {
    var tableId = idPrefix + "-time-table";

    // Initialize table previous state variable to compare if changed later
    daySpecificTimesTablesPreviousValues[idPrefix] = {};

    // Create table
    var table = $("<table/>", {
        class: "time-table",
        id: tableId,
        onmousedown: "return false"
    }).prependTo("#" + parentId);

    // Add first row with one empty cell and "Hours" text
    var hoursTextRow = $("<tr>");
    hoursTextRow.append(
        $("<th/>"));
    hoursTextRow.append(
        $("<th/>", {
            class: "langHtml",
            "data-lang-id": "g_pc25",
            colspan: 24,
            text: "Hours"
        }));
    table.append(hoursTextRow);

    // Add second row with one empty cell and hours numbers
    var hoursRow = $("<tr>");
    hoursRow.append($("<th>"));
    for (j = 0; j < 24; j++) {
        hoursRow.append(
            $("<th/>", {
                class: "time-table-hour",
                text: j
            }));
    }
    table.append(hoursRow);

    // Add rows for weekdays
    for (var d = 0; d < 7; d++) {
        var row = $("<tr>");

        // Add weekday name cell
        row.append(
            $("<th/>", {
                class: "time-table-day langHtml",
                "data-day-num": d,
                // Weekdays translations start at g_pc39 for Monday
                "data-lang-id": "g_pc" + (39 + d).toString()
            }));

        // Add hour selection cells
        for (var h = 0; h < 24; h++) {
            row.append(
                $("<td/>", {
                    class: "time-table-selection",
                    id: tableId + "-day-" + d + "-hour-" + h
                }));
        }

        table.append(row);
    }

    // Add empty spacer row
    table.append(
        $("<tr>", {
            class: "time-table-spacer"})
        );

    // Add row with legend and Clear All and Inverse buttons
    var legendRow = $("<tr>");
    legendRow.append(
        $("<td/>"));
    legendRow.append(
        $("<td/>", {
            class: "time-table-legend time-table-highlight"
        }));
    legendRow.append(
        $("<td/>", {
            class: "time-table-legend-text langHtml",
            "data-lang-id": "g_pc26",
            colspan: 12,
            text: "Blocked day and time"
        }));
    legendRow.append(
        $("<td/>", {
            class: "time-table-legend-action",
            colspan: 6,
            }).append(
                $("<a/>", {
                    class: "time-table-legend-text langHtml",
                    "data-lang-id": "g_pc28",
                    text: "Clear All",
                    id: tableId + "-clear-all"
                }))
        );
    legendRow.append(
        $("<td/>", {
            class: "time-table-legend-action",
            colspan: 5,
            }).append(
                $("<a/>", {
                    class: "time-table-legend-text langHtml",
                    "data-lang-id": "g_pc27",
                    text: "Inverse",
                    id: tableId + "inverse"
                }))
        );
    table.append(legendRow);

    updateLanguageContentForCurrentUserForId("#" + tableId);

    // Change cell state on click
    table.find("td.time-table-selection").on("mousedown", function(event) {
        var isAdding = !$(this).hasClass("time-table-selected");

        $(this).toggleClass("time-table-selected");

        // Register mouse enter event for all cells
        // In case mouse cursor is "dragged" into them
        table.find("td.time-table-selection").on("mouseenter", function() {
            // add and del classes are used to override (invert) default cells cursors
            if (isAdding) {
                $(this).addClass("time-table-drag-add time-table-selected");
            } else {
                $(this)
                    .addClass("time-table-drag-del")
                    .removeClass("time-table-selected");
            }
        });
        $("#"+idPrefix+"-apply-changes").prop("disabled", false);
    });

    // Register mouseup for the whole document
    // in case mouse button is released outside of table
    $(document).on("mouseup", function(event) {
        // Unregister mouse enter event for all cells
        table.find("td.time-table-selection")
            .off("mouseenter")
            .removeClass("time-table-drag-add time-table-drag-del");
    });

    // Highlight day or hour text cell when mouse over
    table.find("th.time-table-day, th.time-table-hour").on("mouseenter mouseleave", function(event) {
        $(this).toggleClass("time-table-highlight");
    });

    // On day name click, change settings of all hours of that day
    table.find("th.time-table-day").on("mousedown", function(event) {
        // id contains "day-*"
        var rowCells = table.find("[id*='day-" + $(this).attr("data-day-num") + "']");
        var rowSelectedCells =
            table.find(".time-table-selected[id*='day-" + $(this).attr("data-day-num") + "']");

        if (rowCells.length !== rowSelectedCells.length) {
            // If hour states differ, select all
            rowCells.addClass("time-table-selected");
        } else {
            // If same states, toggle all
            rowCells.toggleClass("time-table-selected");
        }
        //When a slider is removed, enable the "apply changes" button by making disable prop false
        $("#" + idPrefix + "-apply-changes").prop("disabled", false);
    });

    // On hour number click, change setting of that hour for each day
    table.find("th.time-table-hour").on("mousedown", function(event) {
        // id ends with "hour-*"
        var columnCells = table.find("[id$='hour-" + $(this).text() + "']");
        var columnSelectedCells =
            table.find(".time-table-selected[id$='hour-" + $(this).text() + "']");

        if (columnCells.length !== columnSelectedCells.length) {
            // If hour states differ, select all
            columnCells.addClass("time-table-selected");
        } else {
            // If same states, toggle all
            columnCells.toggleClass("time-table-selected");
        }
        //When a slider is removed, enable the "apply changes" button by making disable prop false
        $("#" + idPrefix + "-apply-changes").prop("disabled", false);
    });

    // Clear all link
    $("#" + tableId + "-clear-all").on("click", (function() {
        table.find(".time-table-selected").each(function(i, cell) {
            $(cell).removeClass("time-table-selected");
        });
    }));

    // Inverse button
    $("#" + tableId + "inverse").on("click", (function() {
        $("#"+idPrefix+"-apply-changes").prop("disabled", false);
        table.find(".time-table-selection").each(function(i, cell) {
            $(cell).toggleClass("time-table-selected");
        });
    }));
}

/**
 * Gets day specific blocked time selection table values
 *
 * @param {string} idPrefix Table id prefix
 * @returns {Object} blocked hours grouped by days of the week
 */
function getDaySpecificTimesTableValues(idPrefix) {
    var blockedTimesArray = Array.apply(null, Array(7)).map(function() {
        return [];
    });

    // Go through each cell
    $("#" + idPrefix + "-time-table")
        .find(".time-table-selection")
        .each(function(i, cell) {
            // Set selected hour state according to specific cell state
            if ($(cell).hasClass("time-table-selected")) {
                blockedTimesArray[Math.floor(i / 24)].push(parseInt(i % 24));
            }
        });

    var rules = {};

    for (var key in blockedTimesArray) {
        if (blockedTimesArray[key].length) {
            rules[DAYS_OF_WEEK_TIME_SELECTION[key]] = blockedTimesArray[key];
        }
    }

    return rules;
}

/**
 * Sets day specific blocked time selection table values
 *
 * @param {string} idPrefix Table id prefix
 * @param {Object} rules blocked hours grouped by days of the week
 */
function setDaySpecificTimesTableValues(idPrefix, rules) {
    // Store state for table values changed check
    daySpecificTimesTablesPreviousValues[idPrefix] = rules;

    // Go through each cell and set it's state
    $("#" + idPrefix + "-time-table")
        .find(".time-table-selection")
        .each(function(i, cell) {
            // Sets hour state depending on blocked rules
            var dayOfWeek = DAYS_OF_WEEK_TIME_SELECTION[Math.floor(i / 24)];
            if (rules[dayOfWeek] && rules[dayOfWeek].indexOf(parseInt(i % 24)) !== -1) {
                $(cell).addClass("time-table-selected");
            } else {
                $(cell).removeClass("time-table-selected");
            }
        });
}

/**
 * Saves table state so that changes can be detected.
 *
 * @param {string} idPrefix Table id prefix
 */
function saveDaySpecificTimesTableState(idPrefix) {
    daySpecificTimesTablesPreviousValues[idPrefix] =
        getDaySpecificTimesTableValues(idPrefix);
}

/**
 * Checks if selection changed since values were last set
 *
 * @param {string} idPrefix Table id prefix
 * @returns {boolean} true if changed
 */
function isDaySpecificTimesTableValuesChanged(idPrefix) {
    return JSON.stringify(getDaySpecificTimesTableValues(idPrefix)) !==
        JSON.stringify(daySpecificTimesTablesPreviousValues[idPrefix]);
}

/**
 * Gets the number of day specific blocked time selection ranges
 *
 * @param {Object} rules blocked hours grouped by days of the week
 * @returns {number} the number of rule ranges
 */
function getNumberOfDaySpecificTimeRanges(rules) {
    var count = 0;

    for (var day in rules) {
        var prevHour = -1;

        for (var i = 0; i < rules[day].length; i++) {
            var hour = parseInt(rules[day][i]);

            if (hour == 0 || hour > prevHour + 1) {
                count++;
            }

            prevHour = hour;
        }
    }

    return count;
}
