//
//
//
//
//
//

/** The default user id */
var DEFAULT_USER = 3;
/** The CSR user id */
var CSR_USER = 1;
/** The default user level */
var DEFAULT_USER_LEVEL = "regular";
/** The CSR user level */
var CSR_USER_LEVEL = "admin";

/** Key codes */
var KEYCODE_ENTER = 13;

/** The fade time in ms */
var DEFAULT_FADE_TIME_MS = 400;

/** Initial interval to wait (ms) after reequesting factory reset / reboot before checking if the reboot is finished */
var REBOOT_INITIAL_WAIT_TIME_MS = 120000;

/**
 * Add includes to the string object if not supported.
 */
if (!String.prototype.includes) {
    String.prototype.includes = function (s) {
        return (this.indexOf(s) !== -1);
    };
}

/**
 * Returns the storage object used by the UI.
 *
 * @returns {Object} the storage object
 */
function getStorage() {
    return sessionStorage;
}

/**
 * Retrieves the current user.
 *
 * Retrieves the current user from session storage. If the user is not set
 * it returns undefined.
 *
 * @returns {number|undefined} the current user
 */
function retrieveCurrentUser() {
    if (typeof Storage == 'undefined') {
        return undefined;
    }

    return getStorage().getItem('current_user');
}

/**
 * Removes the current user.
 *
 * Removes the current user from the session storage. If the user is not set
 * it does nothing.
 */
function removeCurrentUser() {
    if (typeof Storage !== 'undefined') {
        getStorage().removeItem('current_user');
    }
}

/**
 * Registers event for enter key click
 *
 * This function registers callback to be called
 * on keyup event for element with specific id.
 *
 * @param {string} id the string id
 * @param {string} callback called on keyup event for enter key
 */
function onEnterKeyClick(id, callback) {
    var element = $(id);
    element.keyup(function(event) {
        if (event.keyCode == KEYCODE_ENTER) {
            callback(element);
        }
    });
}

/**
 * Error handler for AJAX errors.
 *
 * This function acts as the error function in ajax() calls. Its arguments
 * match those defined in ajax() except it has an additional callback which
 * can be used to specify a function called for HTTP errors.
 *
 * @param {Object} xhr the XHR object
 * @param {string} textStatus the type of error
 * @param {string} errorThrown the exception message
 * @param {function} [callback] function to call (optional)
 * @param {*} [callbackArg] argument for the callback (optional)
 * @param {*} [callbackArg2] second argument for the callback (optional)
 */
function ajaxError(xhr, textStatus, errorThrown, callback, callbackArg, callbackArg2) {
    switch (textStatus) {
        case 'timeout':
        case 'error':
            if (typeof callback === 'function') {
                callback(
                    xhr.status,
                    xhr.statusText,
                    xhr.responseText,
                    xhr.responseJSON,
                    callbackArg,
                    callbackArg2);
            }
            break;
        case 'parsererror':
        case 'abort':
        default:
            break;
    }
}

/**
 * Register event handlers to enable Apply button
 *
 * Registers change and input events on set of non-text and text input
 * elements respectively. Disables Apply button upfront.
 *
 * @param {Object} applyButton Apply button to enable
 * @param {Object} inputsTable set of input elements
 * @param {function} [callback] called when complete (optional)
 */
function registerApplyButtonEnabler(applyButton, inputsTable, callback) {
    applyButton.prop('disabled', true);

    inputsTable.on('change', 'input[type=radio], input[type=checkbox], select', enableButton);
    inputsTable.on('input', 'input[type=text], input[type=password]', enableButton);

    function enableButton() {
        applyButton.prop('disabled', false);

        if (typeof callback === 'function') {
            callback();
        }
    }
}

/**
 * Gets connected device name from given host object.
 * Result can be one of: device name, host name, unknown.
 *
 * @param {Object} host Connected device object
 * @returns {string} connected device name
 */
function getConnectedDevicePrintName(host) {
    return (host.config.deviceName ? host.config.deviceName :
            host.config.hostname ? host.config.hostname :
            getLanguageStringForCurrentUserAndId("c_cd04"));
}

/**
 * Generates <td> cell with Connected device name based on given host parameter.
 *
 * @param {Object} host Connected device object
 * @returns {Object} jQuery table cell object with connected device name
 */
function getConnectedDeviceNameCell(host) {

    var unknownName = getLanguageStringForCurrentUserAndId("c_cd04");
    var name = getConnectedDevicePrintName(host);

    if (name === unknownName) {
        return ($('<td>').append($('<span>', {
            class: 'langHtml',
            'data-lang-id': 'c_cd04',
            text: getLanguageStringForCurrentUserAndId("c_cd04")
        })));
    } else {
        return ($('<td>').text(name));
    }
}

/**
 * Configure branding specific styles
 *
 * @param {string} style the style name to apply
 * @param {string} title the title to apply
 */
function initStyling(style, title) {
    var styles = $('<link>', {rel: 'stylesheet', href: '/common/css/skins/' + style + '/styles.css'});
    $('head').append(styles).children('title:first').text(title);
}

/**
 * Get the gateway modem mode from the backend
 *
 * This function gets the gateway modem mode from the
 * backend and updates the global settings. It calls the
 * callback on completion.
 *
 * @param {function} [callback] the callback on completion (optional)
 * @returns {Object} the jQuery promise
 */
function getGatewayModemMode(callback) {
    // TODO: modem mode should be in gateway
    var uri = REST_URI_V1_PATH + "/system/modemmode";
    var deferred = $.Deferred();

    restGetRetry(uri, function(data) {
        deferred.resolve(data.modemmode.enable);
        if (typeof callback === "function") {
            callback(data.modemmode.enable);
        }
    });

    return deferred.promise();
}

/**
 * Gets the cable modem state
 *
 * @returns {Object} the promise object
 */
function getCableModemState() {
    var deferred = $.Deferred();
    var uri = REST_URI_V1_PATH + "/cablemodem/state_";
    restGet(uri, function(data) {
        deferred.resolve(data.cablemodem);
    });
    return deferred.promise();
}

/**
 * Returns string representing current date/time forwarded by the specified offset
 *
 * Implements a custom date/time format for IP lease expire values:
 * e.g. Thu Jan 1 02:00:37 2021
 *
 * @param {number} offset the number of seconds to be added to "now"
 * @returns {string} date and time formatted for the UI
 */
 function getLeaseExpireDateTimeWithOffset(offset) {
    var date = new Date();
    date.setSeconds(date.getSeconds() + Number(offset));
    var dateArray = date.toDateString().split(' ');
    dateArray[2] = date.getDate(); // removes any zero padding
    var time = date.toISOString().split('T').pop().split('.').shift();
    dateArray.splice(3, 0, time); // insert time
    return dateArray.join(' ');
}

/**
 * Generates <div> cell with 'Connected to' value based on given host parameter.
 * Possible values:
 * - 'ethernet' + port
 * - 'Wi-Fi 2.4G' + ssid
 * - 'Wi-Fi 5G' + ssid
 * - 'Other'
 *
 * @param {Object} host Connected device object
 * @returns {Object} jQuery table cell object with 'connected to' value
 */
function getConnectedToCell(host) {
    var connectedTo = "";
    // Connected to
    if (host.config.interface === 'ethernet') {
        connectedTo = $('<div>')
                .append($('<div>', {
                    class: 'langHtml',
                    'data-lang-id': 'c_cd03',
                    text: getLanguageStringForCurrentUserAndId("c_cd03")
                }))
                .append($('<div>', {
                    text: host.config.ethernet.port
                }));
    } else if (host.config.interface === 'wifi') {
        var wifiText = 'Wi-Fi';
        if (host.config.wifi.band === 'band2g') {
            wifiText += ' 2.4G';
        } else if (host.config.wifi.band === 'band5g') {
            wifiText += ' 5G';
        }

        connectedTo = $('<div>', {
                    text: wifiText
                })
                .append($('<div>', {
                    text: host.config.wifi.ssid
                }));
    } else if (host.config.interface === 'unknown') {
        connectedTo = $('<div>', {
                    class: 'langHtml',
                    'data-lang-id': 'rs46',
                    text: getLanguageStringForCurrentUserAndId("rs46")
                });
    }
    return connectedTo;
}

/**
 * Saves list of modified checkboxes.
 *
 * @param {string} enableCheckboxName 'enable' checkboxes class name
 * @param {string} deleteCheckboxName 'delete' checkboxes id prefix 
 * @returns {Object} object containing: enable/delete checkboxes names and modified rules array
 *                                      containing objects with rule id and checkboxes states
 */
function storeModifiedEnabledDeleteCheckboxes(enableCheckboxName, deleteCheckboxName) {
    var modifiedRules = [];
    $("." + enableCheckboxName).each(function(idx) {
        var modifiedRule = {};
        var checkbox = $(this);
        if (checkbox.data("modified")) {
            checkbox.prop("checked", !checkbox.prop("checked"));
            checkbox.data("modified", false);
            modifiedRule.enableModified = true;
        }
        var deleteCheckbox = $("#" + deleteCheckboxName + "-" + checkbox.data("rule-id"));
        if (deleteCheckbox.prop("checked")) {
            deleteCheckbox.prop("checked", !deleteCheckbox.prop("checked"));
            modifiedRule.deleteChecked = true;
        }
        if (modifiedRule.enableModified || modifiedRule.deleteChecked) {
            modifiedRule.ruleId = checkbox.data("rule-id");
            modifiedRules.push(modifiedRule);
        }
    });
    return {
        enableCheckboxName : enableCheckboxName,
        deleteCheckboxName : deleteCheckboxName,
        rules : modifiedRules
    };
}

/**
 * Restores state of modified checkboxes
 *
 * @param {Object} modifiedCheckboxes enable/delete checkboxes names and rules array of objects
 *                                    storing modified checkboxes states
 */
function restoreModifiedEnabledDeleteCheckboxes(modifiedCheckboxes) {
    for (var rule in modifiedCheckboxes.rules) {
        var modifiedRule = modifiedCheckboxes.rules[rule];
        if (modifiedRule.enableModified) {
            var enableCheckbox = $("#" + modifiedCheckboxes.enableCheckboxName + "-" + modifiedRule.ruleId);
            enableCheckbox.prop("checked", !enableCheckbox.prop("checked"));
            enableCheckbox.data("modified", true);
        }
        if (modifiedRule.deleteChecked) {
            $("#" + modifiedCheckboxes.deleteCheckboxName + "-" + modifiedRule.ruleId).prop("checked", true);
        }
    }
}

/**
 * Handler for a change of Enable or Delete check boxes.
 *
 * @param {Object} checkBox the UI input which was changed
 */
function toggleRuleCheckBox(checkBoxObject) {
    var checkBox = $(checkBoxObject);
    checkBox.data("modified", !checkBox.data("modified"));
}

/**
 * Verify passed string value is not empty.
 * 
 * @param {string} value string value to check
 * @returns value if it's not empty, "Not Available" othervise
 */
function getValue(value) {
    if (!value || value.length === 0) {
        return getLanguageStringForCurrentUserAndId("c_st42");
    }
    return value;
}
