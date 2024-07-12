//
//
//
//
//
//

var SPINNER_MODE_ENTRANCE = 0;
var SPINNER_MODE_UPDATE   = 1;

/** WIFI network types with password strength requirements */
var WIFI_PASSWORD = {
    PRIMARY : {
        GOOD : { minLength: 10, maxLength: 63, minLowerCase: 1, minUpperCase: 1, minNumber: 1, minSpecial: 0 },
        STRONG : { minLength: 12, maxLength: 63, minLowerCase: 2, minUpperCase: 2, minNumber: 2, minSpecial: 0 },
        VERYSTRONG : { minLength: 14, maxLength: 63, minLowerCase: 3, minUpperCase: 3, minNumber: 3, minSpecial: 1 },
        VERYSTRONG_SENTENCE : { minLength: 30, maxLength: 63, minLowerCase: 3, minUpperCase: 3, minNumber: 0, minSpecial: 0 }
    },
    GUEST : {
        GOOD : { minLength: 8, maxLength: 63, minLowerCase: 1, minUpperCase: 1, minNumber: 1, minSpecial: 0 },
        STRONG : { minLength: 12, maxLength: 63, minLowerCase: 2, minUpperCase: 2, minNumber: 2, minSpecial: 0 },
        VERYSTRONG : { minLength: 14, maxLength: 63, minLowerCase: 3, minUpperCase: 3, minNumber: 3, minSpecial: 1 },
        VERYSTRONG_SENTENCE : { minLength: 30, maxLength: 63, minLowerCase: 3, minUpperCase: 3, minNumber: 0, minSpecial: 0 }
    }
};

/** Map of wifi security to encryption API values */
var WIFI_SECURITY_MODE_TO_ENCRYPTION_TYPE_API_MAP = {
    wpa2_psk : "aes",
    wpa_psk_wpa2_psk : "aes_tkip"
};

/**
 * Waits for reboot to complete.
 *
 * This function waits for the web server to come up and responde to a
 * POST request. This is used as an indication that the device has rebooted.
 * It tries to echo data via the REST echo API, and then it responds with
 * a status OK the function reloads the index page.
 */
function waitForRebootToComplete() {
    /** Subsequent interval to wait (ms) before checking again if the reboot has finished */
    var REBOOT_POLL_TIME_MS = 10000;
    console.log("Sending echo request...");
    restAJAX(
        REST_URI_V1_PATH + "/echo",
        'POST',
        // success
        function() {
            // Redirect to home page
            window.location = 'index.html';
        },
        // data
        { echoStatus : "success" },
        // token
        null,
        // authCallback
        null,
        // error handler
        function () {
            console.log("Echo request failed!");
            setTimeout(waitForRebootToComplete, REBOOT_POLL_TIME_MS);
        }
    );
}

/**
 * Gets status of selected WiFi band
 *
 * @param {string} band WiFi band (band2g or band5g)
 * @param {function} [callback] a function to call when complete (optional)
 */
function getWifiBandStatus(band, callback) {
    var uri = REST_URI_V1_PATH + "/wifi/" + band + "/state";

    authRestGet(uri, function(data) {
        // Call any callback
        if (typeof callback != 'undefined' && callback != null) {
            callback(data.state);
        }
    });
}

/**
 * Get WiFi status for both bands
 *
 * This function gets the status of both 2g and 5g bands.
 * It calls the callback on completion.
 *
 * @param {function} callback the callback on completion
 */
function getWifiStatus(callback) {
    var deferredGetWifiStatus = function (band) {
        var deferred = $.Deferred();
        getWifiBandStatus(band, deferred.resolve);
        return deferred.promise();
    };

    $.when(deferredGetWifiStatus("band2g"),
        deferredGetWifiStatus("band5g")).done(callback);
}

/**
 * Returns WiFi config for selected band
 *
 * @param {string} band WiFi band (band2g or band5g)
 * @param {function} [callback] a function to call when complete (optional)
 */
function getWifiBandConfig(band, callback) {
    var uri = REST_URI_V1_PATH + "/wifi/" + band + "/config";

    authRestGet(uri, function(data) {
        // Call any callback
        if (typeof callback != 'undefined' && callback != null) {
            callback(data.config);
        }
    });
}

/**
 * Patch WiFi config for selected band
 *
 * @param {string} band WiFi band (band2g or band5g)
 * @param {Object} data WiFi config object
 * @param {function} [callback] a function to call when complete (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 */
function patchWifiBandConfig(band, data, callback, errorHandlers) {
    var uri = REST_URI_V1_PATH + "/wifi/" + band + "/config";

    authRestPatch(uri, data, function() {
        // Call any callback
        if (typeof callback != 'undefined' && callback != null) {
            callback();
        }
    }, errorHandlers);
}

/**
 * Returns Guest WiFi config for selected band
 *
 * @param {string} band WiFi band (band2g or band5g)
 * @param {function} [callback] a function to call when complete (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 */
function getGuestWifiBandConfig(band, callback, errorHandlers) {
    var uri = REST_URI_V1_PATH + "/wifi/" + band + "/guest/config";

    authRestGet(uri, function(data) {
        // Call any callback
        if (typeof callback != 'undefined' && callback != null) {
            callback(data.config);
        }
    }, errorHandlers);
}

/**
 * Patch Guest WiFi config for selected band
 *
 * @param {string} band WiFi band (both, band2g or band5g)
 * @param {Object} data Guest WiFi config object
 * @param {function} [callback] a function to call when complete (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 */
function patchGuestWifiBandConfig(band, data, callback, errorHandlers) {
    if (band == "both") {
        var requestsInProgress = 2;
        var localCallback = function () {
            requestsInProgress--;
            if (requestsInProgress == 0 && callback) {
                callback();
            }
        };
        authRestPatch(REST_URI_V1_PATH + "/wifi/band2g/guest/config",
                data, localCallback, errorHandlers, "band2g");
        authRestPatch(REST_URI_V1_PATH + "/wifi/band5g/guest/config",
                data, localCallback, errorHandlers, "band5g");
    } else {
        var uri = REST_URI_V1_PATH + "/wifi/" + band + "/guest/config";

        authRestPatch(uri, data, function() {
            // Call any callback
            if (typeof callback != 'undefined' && callback != null) {
                callback();
            }
        }, errorHandlers, band);
    }
}

/**
 * Gets the subnet mask as CIDR slash notation
 *
 * @param {string} the subnet mask
 *
 * @returns {string} the CIDR subnet mask
 */
function getSubnetMaskCIDR(subnetMask) {
    try {
        return new IPv4Address(subnetMask).getMaskCIDR();
    } catch (e) {
        return "";
    }
}

/**
 * Validates whether the provided string is a valid IPv4 address
 *
 * @param {string} address the address to be checked
 *
 * @returns {boolean} true if the argument is a valid IPv4 address
 */
function isValidIPv4Address(address) {
    if (typeof(address) != "string") {
        return false;
    } else {
        var ipv4Regex = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;
        return ipv4Regex.test(address);
    }
}

/**
 * Validates whether the provided string is a valid IPv4 DNS address
 *
 * @param {string} address the address to be checked
 *
 * @returns {boolean} true if the argument is a valid IPv4 address
 */
function isValidIPv4DNS(address) {
    var privateIP = /^(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)|(^169\.254\.)|(^22[4-9]\.)|(^2[3-9][0-9]\.)|(^[3-9][0-9][0-9]\.)/;
    if (privateIP.test(address) || (address == "0.0.0.0")) {
        return false;
    } else {
        return isValidIPv4Address(address);
    }
}

/**
 * Checks whether the IPv4 octet is valid
 *
 * @param {string} octet the octet
 * @returns {boolean} true if valid
 */
function isValidIPv4Octet(octet) {
    return isInteger(octet) && octet >= 0 && octet <= 255;
}

/**
 * Check whether the provided string is a valid IPv6 hextet,
 * i.e. 1 to 4 hexadecimal digits
 *
 * @param {string} address the address to be checked
 *
 * @returns {boolean} true if the argument is a valid IPv6 hextet
 */
function isValidIPv6Hextet(input) {
    var regex = /^([0-9a-fA-F]{1,4})$/;
    return regex.test(input);
}

/**
 * Check whether the provided string is a valid IPv6 address
 * The inputs can be full form notation, short form notation or
 * dual form notation (i.e. a combination of ipv6 and ipv4).
 *
 * @param {string} address the address to be checked
 *
 * @returns {boolean} true if the argument is a valid IPv6 address
 */
function isValidIPv6Address(address) {
    if (typeof(address) != "string") {
        return false;
    }
    if (address.includes(".")) { //dual form notation
        //Regex to validate the ipv6 part.
        var dualIpv6Regex = /^(?:(?:[A-Fa-f0-9]{1,4}:){5}[A-Fa-f0-9]{1,4}|(?=(?:[A-Fa-f0-9]{0,4}:){0,5}[A-Fa-f0-9]{0,4}$)(([0-9A-Fa-f]{1,4}:){1,5}|:)((:[0-9A-Fa-f]{1,4}){1,5}|:)|(?:[A-Fa-f0-9]{1,4}:){5}:|:(:[A-Fa-f0-9]{1,4}){5})$/;
        var ipv6lastIndex = address.lastIndexOf(":");

        //Slicing the the address into ipv6 part and ipv4 part.
        var ipv6Part = address.slice(0, ipv6lastIndex);
        var ipv4Part = address.slice(ipv6lastIndex+1, address.length);

        //Adding an extra : when the short notation is at the end of the ipv6 address part
        if ( (ipv6Part.endsWith(":") )) {
            ipv6Part += ":";
        }
        return (dualIpv6Regex.test(ipv6Part) && isValidIPv4Address(ipv4Part));
    } else {  //non dual form notation
        return isIpv6AddressValid(address);
    }
}

/**
 * Validates whether the provided string is a valid IPv6 DNS address
 *
 * @param {string} address the address to be checked
 *
 * @returns {boolean} true if the argument is a valid IPv4 address
 */
function isValidIPv6DNS(address) {
    var restrictedIP = /^(^::1$)|(^::0$)|(^[fF][cCdDfF][0-9a-fA-F]{2}(?:[:][0-9a-fA-F]{0,4}){0,7})|(^[fF][eE][89aAbB][0-9a-fA-F](?:[:][0-9a-fA-F]{0,4}){0,7})|(^[fF][eE][cC][0](?:[:][0-9a-fA-F]{0,4}){0,7})/;
    if (restrictedIP.test(address) || (address == "0:0:0:0:0:0:0:0") || (address == "0:0:0:0:0:0:0:1")) {
        return false;
    } else {
        return isValidIPv6Address(address);
    }
}

/**
 * Returns the password strength level
 *
 * This function takes a plain text password as input. It then checks the
 * password strength and returns an integer representing the current strength
 * level.
 *
 * There are four possible password strength levels, defined as follows:
 *
 *   - 0 - The password does not meet the minimum requirements
 *   - 1 - The password meets requirements defined in WIFI_PASSWORD.*.GOOD
 *   - 2 - The password meets requirements defined in WIFI_PASSWORD.*.STRONG
 *   - 3 - The password meets requirements defined in WIFI_PASSWORD.*.VERYSTRONG
 *
 * @param {string} password the password in plain text
 * @param {Object} requirements Object with password requirements levels for specific WIFI network (primary or guest)
 * @returns {number} the password strength level
 */
 function getPasswordStrengthLevel(password, requirements) {

    var isSatisfied = function (strengthLevel) {

        var result = false;

        // Get amount of: upper case / lower case / number characters in password
        var matchUpperCase = (password.match(/[A-Z]/g) ? password.match(/[A-Z]/g).length : 0);
        var matchLowerCase = (password.match(/[a-z]/g) ? password.match(/[a-z]/g).length : 0);
        var matchNumber = (password.match(/[0-9]/g) ? password.match(/[0-9]/g).length : 0);
        var matchSpecial = (password.length - ( matchUpperCase + matchLowerCase + matchNumber ));

        if (password.length >= strengthLevel.minLength &&
            password.length <= strengthLevel.maxLength &&
            matchUpperCase >= strengthLevel.minUpperCase &&
            matchLowerCase >= strengthLevel.minLowerCase &&
            matchNumber >= strengthLevel.minNumber &&
            matchSpecial >= strengthLevel.minSpecial) {

                // Special characters ranges - ASCII 32 (space) - 126 (~)
                var specials = /^[ -~]+$/;
                if ( specials.test( password ) ) {
                    result = true;
                }
        }
        return result;
    };

    if (isSatisfied(requirements.VERYSTRONG) || isSatisfied(requirements.VERYSTRONG_SENTENCE)) {
        return 3;
    } else if (isSatisfied(requirements.STRONG)){
        return 2;
    } else if (isSatisfied(requirements.GOOD)){
        return 1;
    }

    return 0;
}

/**
 * Updates the WiFi password strength indicator
 *
 * Displays the appropriately styled arrow and text in the correct position
 * on the supplied band's WiFi password strength level bar based on the
 * password strength.
 *
 * There are four possible password strength levels, defined as follows:
 *
 *   - 0 - The password does not meet the minimum requirements defined in
 *         strength level 1.
 *   - 1 - Password contains at least one digit, uppercase and lowercase
 *         character and is at least 10 characters long.
 *   - 2 - Requirements for strength level 1, plus password also contains
 *         a single special character.
 *   - 4 - Requirements for strength level 1, plus password contains at least
 *         two special characters.
 *
 * @param {string} indicatorId - id of the outer container for the indicator
 * @param {number} passwordStrength - the integer representing the password strength
 */
function updatePasswordStrengthIndicator(indicatorId, passwordStrength) {
    // Hide all password strength arrows and text for the specified band
    $("#" + indicatorId + " div").hide();
    // Show the correct strength level indicator based on the strength level
    switch (passwordStrength) {
        case 0:
            $("#" + indicatorId + " .password-strength-indicator-not-sufficient").show();
            break;
        case 1:
            $("#" + indicatorId + " .password-strength-indicator-good").show();
            break;
        case 2:
            $("#" + indicatorId + " .password-strength-indicator-strong").show();
            break;
        case 3:
            $("#" + indicatorId + " .password-strength-indicator-very-strong").show();
    }
}

/**
 * Bind event to update a password strength indicator on input
 *
 * This function takes an input 'name' attribute for a password input and
 * an 'id' attribvute for a container of the corresponding password strength
 * indicator.  It then binds an event to update the password strength
 * indicator when the password input changes.
 *
 * @param {string} inputName - password input 'name' attribute
 * @param {string} indicatorId - password indicator container 'id' attribute
 * @param {Object} networkType - WIFI network type: primary or guest containing password strength requirements
 */
function bindPasswordStrengthIndicator(inputName, indicatorId, networkType) {
    $("input[name='" + inputName + "']").on('input', function() {
        updatePasswordStrengthIndicator(
            indicatorId,
            getPasswordStrengthLevel($(this).val(), networkType)
        );
    });
}

/**
 * Validates an SSID name
 *
 * Ensures that a given SSID name is valid.
 *
 * The requirements for a valid SSID name are as follows:
 *
 * - Must start and finish with a letter, number or special character
 * - Must not exceed 32 characters long
 *
 * @param {string} ssidName - the name of the SSID to validate
 * @returns {boolean} true if SSID is valid, false if not
 */
function isSSIDNameValid(ssidName) {
    // Check that the length is between 1 and 32 inclusive
    if (ssidName.length < 1 || ssidName.length > 32) {
        return false;
    }

    // Check there is not a space at the start or end of the SSID name
    if (ssidName.startsWith(" ") || ssidName.endsWith(" ")) {
        return false;
    }

    // Check that the characters are valid ASCII (between 32 and 126 inclusive)
    return (/^[ -~]+$/.test(ssidName));
}

/**
 * Validates whether an SSID name is blacklisted.
 *
 * Ensures that a given SSID name is not blacklisted/reserved.
 *
 * @param {string} ssidName the name of the SSID to validate
 * @param {Array} reservedSsids the array of reserved SSIDs
 * @return {bool} true if ssidName is in reserved SSID array, false if not
*/
function isSSIDNameBlackListed(ssidName, reservedSsids) {
    // Compare entered ssidName with all the reservedSsids
    var ssid = ssidName.replace(/ /g, "").toLowerCase();

    if (reservedSsids) {
        // Return true if the ssidName matches with any one of the reservedSsids
        // Should we check for substring?
        return reservedSsids.indexOf(ssid) != -1;
    }

    return false;
}

/**
 * validates the string is an integer
 *
 * @param {string} value the string to check
 * @returns {boolean} true if value is an integer
 */
function isInteger(value) {
    var reg = new RegExp('^\\d+$');
    return reg.test(value);
}

/**
 * Validates the value of an input field showing an error if invalid.
 *
 * This function takes the this reference for an input (as passed to
 * the function bound to a jQuery on('input') handler) and compares its
 * value to the min and max values specified. If the value is invalid
 * highlights the input with a red border and displays the following
 * div element (typically a div containing an icon and error message).
 *
 * The first span of the following div element is set to the value of the input,
 * the second span the language string identified by id.
 *
 * If showVal is defined and true then the first span within the div is
 * set to the input value.
 *
 * If alternateVal is also defined then that is used in preference to
 * the input value for the first span.
 *
 * If id is defined then the second span is set to the language string
 * identified by id.
 *
 * Accepted permutations:
 * showVal
 * showVal, id
 * showVal, alternateVal (provide null for id)
 * showVal, id, alternateVal
 *
 * For an example of use see ping.html.
 *
 * To get 'this' from a jQuery selector use $('my-selector')[0]
 *
 * @param {Object} inputThis the this for the input
 * @param {number} min the minimum allowed value
 * @param {number} max the maximum allowed value
 * @param {boolean} [showVal] include the input value in the error displayed (optional)
 * @param {string} [id] the language string id to use in the error displayed (optional)
 * @param {string} [alternateVal] alternative string to use instead of value from input (optional)
 *
 * @returns {boolean} true if value otherwise false.
 */
function validateNumericInput(inputThis, min, max, showVal, id, alternateVal) {
    var jqInput = $(inputThis);
    var value = jqInput.val();

    if (!isInteger(value) || value < min || value > max) {
        jqInput.addClass('error');
        // The first div that follows the input
        var div = jqInput.nextAll('div.small-error-container:first');
        // The first span in that div (setting its text to the value)
        if (showVal) {
            var firstSpan;

            // If alternativeVal defined use it in preference to the input value
            firstSpan = div.find('span').first().text(alternateVal ? alternateVal : inputThis.value);

            // If id is defined set the next spans language string
            if (id) {
                firstSpan.next().
                    attr('data-lang-id', id).
                    html(getLanguageStringForCurrentUserAndId(id));
            }
        }
        // Show the div
        div.show();
        return false;
    } else {
        jqInput.removeClass('error');
        jqInput.nextAll('div.small-error-container:first').hide();
        return true;
    }
}

/**
 * Validates the order of port range start and end input values
 * and shows error if incorrect
 *
 * This function takes jQuery objects for start and end port range
 * inputs and validates that the end port is greater than a start port.
 * If it isn't, it highlights the end port input with a red border
 * and displays the error contained in a following div element
 * with specific error class.
 *
 * @param {Object} jqStartInput jQuery object for the range start input
 * @param {Object} jqEndInput jQuery object for the range end input
 *
 * @returns {boolean} true if correct port order otherwise false.
 */
function validatePortRangeOrder(jqStartInput, jqEndInput) {
    if (parseInt(jqEndInput.val()) < parseInt(jqStartInput.val())) {
        jqEndInput
            .addClass('error')
            .nextAll('.port-range-error-inverted-port-numbers').show();
        return false;
    }

    return true;
}

/**
 * Validates length of two port ranges and shows error if they doesn't match
 *
 * This function takes jQuery objects for start and end inputs
 * of a two port validates that their length matches.
 * If it doesn't, it highlights the end port input of a second range
 * with a red border and displays the error contained in a div element
 * with specific error class.
 *
 * @param {Object} jqStartInput1 jQuery object for the first range start input
 * @param {Object} jqEndInput1 jQuery object for the first range end input
 * @param {Object} jqStartInput2 jQuery object for the second range start input
 * @param {Object} jqEndInput2 jQuery object for the second range end input
 *
 * @returns {boolean} true if ranges match otherwise false.
 */
function validatePortRangesLengthsEquals(jqStartInput1, jqEndInput1,
    jqStartInput2, jqEndInput2) {
    if (parseInt(jqEndInput1.val()) - parseInt(jqStartInput1.val()) !=
        parseInt(jqEndInput2.val()) - parseInt(jqStartInput2.val())) {
        jqEndInput2
            .addClass('error')
            .nextAll('.port-range-error-range-mismatch').show();
        return false;
    }

    return true;
}

/**
 * Validates that the port range doesn't include restricted ports
 * and shows error if it does.
 *
 * This function takes jQuery objects for start and end port range
 * inputs and checks if doesn't contain restricted ports.
 * If it does, it highlights the inputs with a red border
 * and displays the errors contained in a following div element
 * with specific error class.
 *
 * @param {string} protocol determines restricted ports
 * @param {Object} startInputThis jQuery object for the range start input
 * @param {Object} endInputThis jQuery object for the range end input
 *
 * @returns {boolean} true if range doesn't contain restricted ports otherwise false.
 */
function validateAllowedPorts(protocol, jqStartInput, jqEndInput) {
    function showReservedPortInputError(jqInput, reservedPorts) {
        jqInput
            .addClass('error')
            .nextAll('.port-range-error-reserved-ports')
                .show()
                .find('span.reserved-ports').text('(' + reservedPorts + ')');
    }

    var valid = true;

    var portRangeValidator = new PortRangeValidator(protocol,
        parseInt(jqStartInput.val()),
        parseInt(jqEndInput.val()));
    var reservedPorts = portRangeValidator.getRestrictedPortsString();

    if (portRangeValidator.containsRestrictedPort()) {
        // If reserved port is inside range, show error for both inputs
        showReservedPortInputError(jqStartInput, reservedPorts);
        showReservedPortInputError(jqEndInput, reservedPorts);
        valid = false;
    } else {
        // If reserved port is on a range bound, show error only for that bound input
        if (portRangeValidator.isStartPortRestricted()) {
            showReservedPortInputError(jqStartInput, reservedPorts);
            valid = false;
        }
        if (portRangeValidator.isEndPortRestricted()) {
            showReservedPortInputError(jqEndInput, reservedPorts);
            valid = false;
        }
    }

    return valid;
}

/**
 * Returns the string ID for the protocol from the REST api.
 *
 * @param {string} protocol The protocol as received from REST
 * @returns {string} the string ID for the protocol
 */
function getNetworkProtocolStringId(protocol) {
    // Protocol string IDs
    var PROTOCOL_STRING_ID = {
        "tcp"     : "g_tcp",
        "udp"     : "g_udp",
        "tcp_udp" : "g_both",
        "all"     : "g_all"
    };

    if (PROTOCOL_STRING_ID.hasOwnProperty(protocol)) {
        return PROTOCOL_STRING_ID[protocol];
    } else {
        return "c_cd04";
    }
}

/**
 * Validates an entered date and time
 *
 * Ensures that the entered date and time is valid and is
 * in the future. Optionally, an error container can be passed
 * to this function and shown/hidden if the date and time
 * is valid/invalid. Similarly, a button can be passed to be
 * enabled/disabled based on whether the date and time is valid/invalid.
 *
 * @param {string} date the date to validate in the "dd/mm/yyyy" format
 * @param {string} time the time to validate in the "hh:mm" format
 * @param {Object} [errorContainer] jQuery object of error container to show/hide
 * @param {Object} [applyButton] jQuery object of apply button to enable/disable
 *
 * @returns {boolean} true if date and time is valid, false if not
 */
    function validateDateTime(date, time, errorContainer, applyButton) {
    var dateTimeValid = false;

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date) && /^\d{2}\:\d{2}$/.test(time)) {
        var dateParts = date.split("/");
        var day = parseInt(dateParts[0], 10);
        var month = parseInt(dateParts[1], 10);
        var year = parseInt(dateParts[2], 10);

        var timeParts = time.split(":");
        var minutes = parseInt(timeParts[1], 10);
        var hours = parseInt(timeParts[0], 10);

        if (month > 0 && month <= 12 && minutes >= 0 && minutes <= 59 && hours >= 0 && hours <= 23) {
            var monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) {
                monthLengths[1] = 29;
            }

            if (day > 0 && day <= monthLengths[month - 1]) {
                var currentDateTime = new Date();
                var dateTime = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
                dateTimeValid = dateTime.toString() !== 'Invalid Date' && dateTime > currentDateTime;
            }
        }
    }

    if (applyButton) {
        applyButton.prop('disabled', !dateTimeValid);
    }

    if (errorContainer) {
        errorContainer.toggle(!dateTimeValid);
    }

    return dateTimeValid;
}

/**
 * Validates a proposed UI password's length.
 *
 * @param {string} password a proposed UI password
 * @returns {boolean} true if the password length is okay
 */
function isValidUIPasswordLength(password) {
    return (password.length >= 8);
}

/**
 * Validates a proposed UI password
 *
 * @param {string} password a proposed UI password
 * @returns {boolean} true if the password is okay
 */
function isValidUIPassword(password) {
    if (!isValidUIPasswordLength(password)) {
        return false;
    }

    // Strange bug if you just try and return the test!
    var isValid =
        // At least one digit
        /\d/.test(password) &&
        // At least 1 lower case letter
        /[a-z]/.test(password) &&
        // At least 1 upper case letter
        /[A-Z]/.test(password) &&
        // Space not allowed
        !/\s/.test(password);

    return isValid;
}

/**
 * Returns string left-padded with '0'
 *
 * @param {number} value the number to be padded
 * @param {number} digits the count of digits in the result
 * @returns {string} value converted to string and padded
 */
function padZeroLeft(value, digits) {
    return ("00" + value).slice(-digits);
}

/**
 * Returns string representing date in the format used in the UI
 *
 * @param {Date} date to be formatted
 * @returns {string} formatted date
 */
function formatDateForUI(date) {
    return padZeroLeft(date.getDate(), 2) + "/" +
        padZeroLeft(date.getMonth() + 1, 2) +
        "/" + date.getFullYear();
}

/**
 * Returns string representing time in the format used in the UI
 *
 * @param {Date} date which time part should be formatted
 * @returns {string} formatted time
 */
function formatTimeForUI(date) {
    return padZeroLeft(date.getHours(), 2) + ":" +
        padZeroLeft(date.getMinutes(), 2) + ":" +
        padZeroLeft(date.getSeconds(), 2) + ".00";
}

/**
 * Returns string representing date and time in the format used in the UI
 *
 * @param {Date} date to be formatted
 * @returns {string} formatted date and time
 */
function formatDateTimeForUI(date) {
    return formatDateForUI(date) + " " + formatTimeForUI(date);
}

/**
 * Returns string representing seconds as days, hours, minutes and seconds
 *
 * @param {number} seconds the number of seconds to be converted
 * @param {boolean} [shortFormat] optional parameter for D:H:M:S format
 * @returns {string} conversion result
 */
function convertSecondsToDaysHoursMinutesSeconds(seconds, shortFormat) {
    var SECONDS_PER_DAY = 86400;
    var SECONDS_PER_HOUR = 3600;
    var SECONDS_PER_MINUTE = 60;

    var days = Math.floor(seconds / SECONDS_PER_DAY);
    var hours = Math.floor((seconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
    var minutes = Math.floor(((seconds % SECONDS_PER_DAY) % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    seconds = ((seconds % SECONDS_PER_DAY) % SECONDS_PER_HOUR) % SECONDS_PER_MINUTE;

    var conversion;
    if (shortFormat) {
        conversion = "D:" + days + " H:" + hours + " M:" + minutes + " S:" + seconds;
    } else {
        conversion = days + "day(s)" + hours + "h:" + minutes + "m:" + seconds + "s";
    }

    return conversion;
}

/**
 * Checks if an IPv6 address is in the correct format
 *
 * Expected format: 128 bit colon delimited hexadecimal,
 * including both full and compact representations
 *
 * @param {string} ipv6Address string representing the IPv6 address
 * @returns {boolean} true if valid format, false otherwise
 */
function isIpv6AddressValid(ipv6Address) {
    var regex = /^(?:(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}|(?=(?:[A-Fa-f0-9]{0,4}:){0,7}[A-Fa-f0-9]{0,4}$)(([0-9A-Fa-f]{1,4}:){1,7}|:)((:[0-9A-Fa-f]{1,4}){1,7}|:)|(?:[A-Fa-f0-9]{1,4}:){7}:|:(:[A-Fa-f0-9]{1,4}){7})$/;

    return regex.test(ipv6Address);
}

/**
 * Pads the provided IPv6 segment with leading '0' characters
 *
 * The segment argument is expected to contain from 0 to 4 hex digits.
 * It will be be padded so always 4-character segment is returned.
 *
 * @param {string} segment IPv6 segment
 * @returns {string} complete IPv6 segment
*/
function expandSegment(segment) {
    return ("0000" + segment).slice(-4);
}

/**
 * Adds the specified number of "0000" strings to the provided array
 *
 * @param {Array} segments the array to be extended
 * @param {number} count the number of items to add to the array
*/
function addMissingSegments(segments, count) {
    for (var i = 0; i < count; i++) {
        segments.push("0000");
    }
}

/**
 * Returns fully expanded IPv6 address
 *
 * The argument address can use shortcut notation without leading '0'
 * in segments and '::' used for all-zero segments. The address will be
 * expanded so always 8 segments separated by ':' are returned.
 * Each segment contains 4 hex digits.
 *
 * @param {string} IPv6 address
 * @returns {string} fully expanded IPv6 address
 * @throws {Error} when provided invalid IPv6 address
 */
function expandIPv6Address(address) {
    if (!isIpv6AddressValid(address)) {
        throw new Error("Invalid IPv6 address \"" + address + "\"");
    }
    var segments = address.split(":");
    var missingSegmentsCount = 8 - segments.length;
    var expandedSegments = [];

    var addedMissing = false;
    for (var i in segments) {
        expandedSegments.push(expandSegment(segments[i]));
        if(segments[i] == "" && !addedMissing) {
            addMissingSegments(expandedSegments, missingSegmentsCount);
            addedMissing = true;
        }
    }
    return expandedSegments.join(":");
}

/**
 * Returns leading segments of the provided address
 *
 * length / 16 complete segments of address are returned.
 * The address argument can use shortcut notation, it will be expanded
 * as needed. If length argument is not divisible by 16 the result does not
 * contain the last incomplete segment.
 *
 * @param {string} address IPv6 address
 * @param {number} length the number of bits to return
 *
 * @returns {string} length/16 leading segments of the provided address
 */
function getIPv6Prefix(address, length) {
    var expandedAddress = expandIPv6Address(address);
    var segments = expandedAddress.split(":");
    var prefixSegementCount = length / 16;
    var returnedSegments = segments.slice(0, prefixSegementCount);
    return returnedSegments.join(":");
}

/**
 * Checks whether the mac address meets validation rule.
 *
 * @param {string} macAddress MAC address to check in plain text
 * @returns {boolean} true if macAddress is valid, false otherwise
 */
function checkMacAddressValidation(macAddress) {
    // Basic error check for 00 and FF addresses
    if (macAddress == "00:00:00:00:00:00" ||
        macAddress.toUpperCase() == "FF:FF:FF:FF:FF:FF") {
        return false;
    }

    return new RegExp("^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$").test(macAddress);
}

/**
 * Checks whether the mac address single byte meets validation rule.
 *
 * @param {string} macAddressByte MAC address byte to check in plain text
 * @returns {boolean} true if macAddress byte is valid, false otherwise
 */
function checkMacAddressByteValidation(macAddressByte) {
    return new RegExp("^([a-fA-F0-9][a-fA-F0-9]{1})$").test(macAddressByte);
}

/**
 * Returns numeric value of IPv4 address.
 *
 * This function returns an unsigned integer.
 *
 * @param {string} address IPV4 address in dot notation
 *
 * @returns {number} integer value of the provided address
*/
function convertIPv4AddressToNumber(address) {
    var parts = address.split('.');
    return (parseInt(parts[0]) * 0x1000000) + (parseInt(parts[1]) * 0x10000) + (parseInt(parts[2]) * 0x100) + parseInt(parts[3]);
}

/**
 * Gets an IPv4 address input with a variable amount of editable octets
 *
 * On some pages with IPv4 address inputs, the number of editable octets
 * will vary depending on the subnet mask. This function will return a
 * full IPv4 address from a section where each visible span or input
 * element is an octet of the IPv4 address.
 *
 * @param {Object} selector jQuery object for the input element container
 * @returns {string} the full IPv4 address
 */
function getIpv4RuleInputAddress(selector) {
    var address = [];
    var octets = selector.children("span, input").filter(function() {
        return $(this).css("display") != "none";
    });

    octets.each(function() {
        if ($(this).is('span')) {
            address.push($(this).text());
        } else {
            address.push($(this).val());
        }
    });

    return address.join(".");
}

/**
 * Returns the number of hosts
 *
 * Given subnet mask and a starting address from this subnet it returns
 * the number of the following host addresses belonging to the subnet.
 * Broadcast address is taken into account, but it's assumed that the
 * startAddress already excludes all zero host address.
 *
 * @param {string} subnetMask IPV4 address in dot notation
 * @param {string} startAddress IPV4 address in dot notation
 *
 * @returns {number} integer the size of the specified range
*/
function getHostCountInSubnet(subnetMask, startAddress) {
    var startAddressNumber = startAddress.toNumber();
    var subnetNumber = subnetMask.toNumber();

    // added 1 because host address part starts from 0
    var hostsInSubnet = ~subnetNumber + 1;

    // all ones host address is used for broadcast, so it's subtracted from
    // the number of hosts
    // 31-bit subnet is a special case as broadcast address is not used there
    if(subnetNumber != 0xFFFFFFFE) {
        hostsInSubnet--;
    }

    var addressesNotUsed = startAddressNumber & ~subnetNumber;
    return hostsInSubnet - addressesNotUsed;
}

/**
 * Returns the number of adresses contained in the specified address range.
 *
 * @param {string} startAddress IPV4 address in dot notation, start of the range
 * @param {string} endAddress IPV4 address in dot notation, end of the range
 *
 * @returns {number} integer the size of the specified range
 */
function getIPv4AddressRangeSize(startAddress, endAddress) {
    var startAddressNumber = convertIPv4AddressToNumber(startAddress);
    var endAddressNumber = convertIPv4AddressToNumber(endAddress);
    return endAddressNumber - startAddressNumber + 1;
}

/**
 * Returns the maximum IPv4 address from the specified range.
 *
 * @param {string} startAddress IPV4 address in dot notation, start of the range
 * @param {number} rangeSize the number of addresses in the range
 *
 * @returns {string} max IPv4 address in dot notation
 */
function getMaxAddressInRange(startAddress, rangeSize) {
    var startAddressNumber = startAddress.toNumber();
    var endAddressNumber = startAddressNumber + rangeSize - 1;
    var parts = [];
    // this code would be simpler with bit AND and right SHIFT
    // but JavaScript bit AND returns signed 32-bit integer
    parts[0] = Math.floor(endAddressNumber / 0x1000000);
    parts[1] = Math.floor((endAddressNumber % 0x1000000) / 0x10000);
    parts[2] = Math.floor((endAddressNumber % 0x10000) / 0x100);
    parts[3] = endAddressNumber % 0x100;
    return parts.join(".");
}

/**
 * Checks whether the string is ASCII 32-126 inclusive
 *
 * @param {string} string to validate
 * @returns {boolean} true if valid
 */
function isAsciiString(string) {
    var regex = /^[\x20-\x7E]*$/;

    return regex.test(string);
}

/**
 * Checks whether the device name in mac filter contains only: small letters, capital letters and numbers
 *
 * @param {string} deviceName device name to validate
 * @returns {boolean} true if valid
 */
function isValidDeviceName(deviceName) {
    var deviceNameExpression = /^[a-zA-Z0-9\-\_\/]+$/;
    return deviceNameExpression.test(deviceName);
}

/**
 * Validates the provided string against MVXREQ-2023,MVXREQ-2024 and MVXREQ-2026
 *
 * @param {string} string
 * @returns {boolean} true if valid
 */
function isValidDomain(string) {
    var regex = /^(?!.*--)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
    return regex.test(string);
}

/**
 * Get descendant object property
 *
 * @param {Object} obj object
 * @param {string} desc period separated property
 *
 * @returns {*} object property value
 **/
function getDescendantProp(obj, desc) {
    var arr = desc.split('.');
    while (arr.length) {
        obj = obj[arr.shift()];
    }
    return obj;
}

/**
 * Set descendant object property
 *
 * @param {Object} obj object
 * @param {string} desc period separated property
 * @param {*} value property value to be set
 *
 * @returns {*} object new property value
 **/
function setDescendantProp(obj, desc, value) {
    var arr = desc.split('.');
    while (arr.length > 1) {
        obj = obj[arr.shift()];
    }
    return obj[arr[0]] = value; //jshint ignore:line
}

/**
 * Gets the current URL query string as an object
 *
 * @returns {Object} the query as an object
 */
function getQueryParams() {
    var params = {};
    // get query string without "?"
    var queryString = window.location.search.substr(1);
    if (queryString) {
        var queryArray = queryString.split("&");
        for (var index = 0; index < queryArray.length; index++) {
            var element = queryArray[index].split("=");
            // ignore empty/no values
            if (element[0] && element[1]) {
                var value = decodeURIComponent(element[1]);
                if (params.hasOwnProperty(element[0])) {
                    var existing = params[element[0]];
                    if (Array.isArray(existing)) {
                        existing.push(value);
                    } else {
                        params[element[0]] = [existing, value];
                    }
                } else {
                    params[element[0]] = value;
                }
            }
        }
    }
    return params;
}

/**
 * Sets the current URL query string to the provided object
 *
 * @param {Object} [params] the object to set as the query string (optional)
 * @param {boolean} [replace] whether to replace or push to history stack (optional)
 */
function setQueryParams(params, replace) {
    var queryString = "";
    if (params != null) {
        var queryArray = [];
        for (var param in params) {
            if (params.hasOwnProperty(param)) {
                var element = params[param];
                if (element) {
                    if (Array.isArray(element)) {
                        for (var index = 0; index < element.length; index++) {
                            queryArray.push(param + "=" +
                                encodeURIComponent(array[index]));
                        }
                    } else {
                        queryArray.push(param + "=" +
                            encodeURIComponent(element));
                    }
                }
            }
        }
        if (queryArray.length) {
            queryString += "?" + queryArray.join("&");
        }
    }

    var url = window.location.protocol + "//" + window.location.host +
        window.location.pathname + queryString;
    var state = params ? { params: params } : {};
    if (replace) {
        window.history.replaceState(state, "", url);
    } else {
        window.history.pushState(state, "", url);
    }
}

/**
 * Filters an array into new arrays based on the provided property
 *
 * Allows an array to be filtered into several arrays based on the
 * array of provided property values.
 * Returns an array of length one greater than the inputed property
 * values array. Any element that does not match will be placed in
 * the last array.
 *
 * @param {Array} array the array to filter
 * @param {string} property the property to filter on
 * @param {Array} propertyValues the values to create new arrays from
 * @returns {Array} A 2D array of the results
 */
 function filterArrayByPropertyValue(array, property, propertyValues) {
    var results = [];
    var buckets = propertyValues.length + 1;
    // populate results array with number of property values + 1;
    for (var i = 0; i < buckets; i++) {
        results.push([]);
    }

    array.forEach(function (value) {
        for (var i = 0; i < buckets; i++) {
            if (i === buckets-1 || propertyValues[i] === value[property]) {
                results[i].push(value);
                break;
            }
        }
    });

    return results;
}

/**
 * Defines a class that be used to display/hide the spinner. The
 * DeferredSpinner object should be created and the relevant
 * parameters set. Promises should then be added to the
 * DeferredSpinner object (using addCriterion) and then the spinner
 * is displayed (using display). When all of the promises have been
 * resolved then the Spinner will be removed, an optional callback
 * called and an optional div re-displayed.
 *
 * @param {number} mode TODO but may be used to disable/enable.
 * @param {string} spinner name of spinner to be displayed.
 * @param {string} spinnerText name of spinner text field.
 * @param {string} text text to be displayed.
 * @param {string} hideDiv optional DIV to be hidden.
 */
function DeferredSpinner(mode,spinner,spinnerText,text,hideDiv) {

    /* TODO: When ccsp key becomes available ensure that spinner
     *       does something relevant to mode.
     */

    this.htmlSpinner = spinner;
    this.spinnerText = spinnerText;
    this.text = text;
    this.div = hideDiv;
    this.criteriaCount = 0;
    this.mode = mode;
    this.waiting = false;
    this.deferred = $.Deferred();

    this.addCriterion = function(newCriterion) {
        this.criteriaCount++;
        var spinner = this;
        newCriterion.always(function() {
            spinner.criteriaCount--;
            if (spinner.criteriaCount === 0) {
                spinner.deferred.resolve();
            }
        });
    };

    /**
     *
     * @param {string} text Optional text to be displayed.
     */
    this.setText = function(text) {
        this.text = text;
    };

    /**
     *
     * @param {string} div Optional div to be hidden during display
     */
    this.setDiv = function(div) {
        this.div = div;
    };

    /**
     *
     * @param {object} spinner  Reference to object.
     */
    this.tidy = function() {
        $(this.htmlSpinner).hide();

        if (this.div != undefined) {
            $(this.div).show();
        }
        this.waiting = false;
        this.deferred = $.Deferred();
        if (typeof this.callback === 'function') {
            this.callback();
        }
    };

    /**
     * Displays the spinner and wait for promises to resolve.
     */
    this.display = function() {
        if (this.waiting) {
            return;
        }
        if (this.div != undefined) {
            $(this.div).hide();
        }
        if (this.text != undefined) {
            $(this.spinnerText).html(this.text);
        }
        $(this.htmlSpinner).show();
        this.waiting = true;
        var spinner = this;
        return this.deferred.always(function() {
            spinner.tidy();
        });
    };

    /**
     * Displays the spinner and waits for promises to resolve.
     * Also triggers events on start and finish.
     * At the start the "spinnerDisplayedEvent" will be triggered.
     * Once the promise is resolved the "spinnerDismissedEvent"
     * will be triggered.
     */
    this.displayAndNotify = function() {
        if (this.waiting) {
            return;
        }
        $(document).trigger("spinnerDisplayedEvent");
        this.display().always(function() {
            $(document).trigger("spinnerDismissedEvent");
        });
    };
}

/**
 * Is there IPv4 provisioning at all in the gateway?
 *
 * @returns {boolean} true yes (either ipv4 only or dualstack), false no
 */
 function provisioningSupportsIPv4() {
    return (globalSettings.gateway.provisioning.mode == "ipv4" || globalSettings.gateway.provisioning.mode == "ipv4_ipv6");
}

/**
 * Is there IPv4 provisioning only in the gateway?
 *
 * @returns {boolean} true yes, false no
 */
 function provisioningSupportsIPv4Only() {
    return (globalSettings.gateway.provisioning.mode == "ipv4");
}

/**
 * Is there IPv6 provisioning at all in the gateway?
 *
 * @returns {boolean} true yes (either ipv6 only or dualstack), false no
 */
function provisioningSupportsIPv6() {
    return (globalSettings.gateway.provisioning.mode == "ipv6" || globalSettings.gateway.provisioning.mode == "ipv4_ipv6");
}

/**
 * Is there IPv6 provisioning only in the gateway?
 *
 * @returns {boolean} true yes, false no
 */
 function provisioningSupportsIPv6Only() {
    return (globalSettings.gateway.provisioning.mode == "ipv6");
}

/**
 * Is there dual stack provisioning in the gateway?
 *
 * @returns {boolean} true yes, false no
 */
 function provisioningSupportsDualstack() {
    return (globalSettings.gateway.provisioning.mode == "ipv4_ipv6");
}

/**
 * Helper to check if the user can modify the complete IP Address
 *
 * @returns {boolean} true if DHCP subnet can be modified
 */
function canModifyCompleteAddress() {
    return (globalSettings && globalSettings.screens &&
        globalSettings.screens.lanDhcpSubnetEditable) ||
        getSkin() == "ziggo";
}

/**
 * Helper to check if the current skin is Sunrise or Yallo
 *
 * @returns {boolean} true if current skin is Sunrise or Yallo
 */
function isSkuSunriseOrYallo() {
    return getSkin() == "yallo" ||
        getSkin() == "sunrise";                     
}
/**
 * Populates the WiFi security modes list
 *
 * @param {Object} select the jQuery select object
 * @param {Array} modes the supported modes
 */
function populateWiFiSecurityModes(select, modes) {
    var SECURITY_MODE_MAP = {
        "disable": "c_01",
        "wpa2_psk": "c_st33",
        "wpa_psk_wpa2_psk": "c_st32",
        "wpa3_sae": "c_st46",
        "wpa2_psk_wpa3_sae": "c_st45"
    };

    for (var i = 0; i < modes.length; i++) {
        var mode = modes[i];
        var stringId = SECURITY_MODE_MAP[mode];
        select.append('<option value="' + mode + '" class="langHtml" data-lang-id="' +
            stringId + '">' + getLanguageStringForCurrentUserAndId(stringId) + '</option>');
    }
}

/**
 * Gets the WiFi capabilities
 *
 * @param {Object|function} [errorHandlers] the error handlers (optional)
 * @returns {Object} the deferred promise
 */
function getWiFiCapabilities(errorHandlers) {
    var deferred = $.Deferred();
    authRestGet(REST_URI_V1_PATH + "/wifi/capabilities", function (data) {
        data.capabilities.reservedSsids = data.capabilities.reservedSsids.map(function (ssid) {
            return ssid.replace(/ /g, "").toLowerCase();
        });
        deferred.resolve(data.capabilities);
    }, errorHandlers);
    return deferred.promise();
}
