//// ERROR CODES ////

// General error codes

/** An internal error occurred */
var ERROR_CODE_GENERAL_INTERNAL_ERROR = 0x00000001;
/** An endpoint is not recognised */
var ERROR_CODE_GENERAL_UNRECOGNISED_ENDPOINT = 0x00000002;
/** An endpoint is recognised but the entity cannot be found */
var ERROR_CODE_GENERAL_ENTITY_NOT_FOUND = 0x00000003;
/** Missing request body */
var ERROR_CODE_GENERAL_MISSING_REQUEST_BODY = 0x00000004;
/** The content-length header is missing */
var ERROR_CODE_GENERAL_MISSING_CONTENT_LENGTH = 0x00000005;
/** Invalid JSON */
var ERROR_CODE_GENERAL_INVALID_JSON = 0x00000006;
/** The session for the token has not been found */
var ERROR_CODE_GENERAL_SESSION_NOT_FOUND = 0x00000007;
/** The user is not allowed to do this */
var ERROR_CODE_GENERAL_USER_FORBIDDEN = 0x00000008;
/** The requested functionality is not supported in this configuration */
var ERROR_CODE_GENERAL_FEATURE_UNSUPPORTED = 0x00000009;
/** The HTTP request method is not allowed on this endpoint */
var ERROR_CODE_GENERAL_METHOD_NOT_ALLOWED = 0x0000000a;
/** Missing property */
var ERROR_CODE_GENERAL_MISSING_PROPERTY = 0x00001001;
/** Unrecognised property */
var ERROR_CODE_GENERAL_UNRECOGNISED_PROPERTY = 0x00001002;
/** Invalid property value */
var ERROR_CODE_GENERAL_INVALID_PROPERTY_VALUE = 0x00001003;

// User error codes

/** The user id is invalid */
var ERROR_CODE_USER_INVALID_USER_ID = 0x00010001;
/** The user language is invalid */
var ERROR_CODE_USER_INVALID_USER_LANGUAGE = 0x00010002;
/** The user client browser cannot be recognised */
var ERROR_CODE_USER_CLIENT_NOT_RECOGNISED = 0x00010003;
/** The user password property is missing */
var ERROR_CODE_USER_MISSING_PASSWORD = 0x00010004;
/** The user password is invalid (does not match stored password) */
var ERROR_CODE_USER_INVALID_PASSWORD = 0x00010005;
/** The new user password property is missing */
var ERROR_CODE_USER_MISSING_NEW_PASSWORD = 0x00010006;
/** The new user password is invalid (does not fulfil password rules) */
var ERROR_CODE_USER_INVALID_NEW_PASSWORD = 0x00010007;
/** The user token is not recognised */
var ERROR_CODE_USER_USER_TOKEN_NOT_FOUND = 0x00010008;
/** A user is already logged in */
var ERROR_CODE_USER_ALREADY_LOGGED_IN = 0x00010009;
/** An admin is currently logged in */
var ERROR_CODE_USER_ADMIN_LOGGED_IN = 0x0001000a;
/** User access violation */
var ERROR_CODE_USER_FORBIDDEN_USER = 0x0001000b;

// Diagnostics error codes

/** The host property is missing */
var ERROR_CODE_DIAG_MISSING_HOST = 0x00030001;
/** The host name or IP address is invalid */
var ERROR_CODE_DIAG_INVALID_HOST = 0x00030002;
/** The data block size is invalid */
var ERROR_CODE_DIAG_DATA_BLOCK_SIZE_INVALID = 0x00030003;
/** The timeout value is invalid */
var ERROR_CODE_DIAG_TIMEOUT_INVALID = 0x00030004;
/** The ping interval time is invalid */
var ERROR_CODE_DIAG_PING_INTERVAL_INVALID = 0x00030005;
/** The number of pings is invalid */
var ERROR_CODE_DIAG_PING_COUNT_INVALID = 0x00030006;
/** Ping is busy */
var ERROR_CODE_DIAG_PING_BUSY = 0x00030007;
/** The traceroute retry count is invalid */
var ERROR_CODE_DIAG_TRACEROUTE_RETRY_COUNT_INVALID = 0x00030008;
/** The traceroute maximum hop count is invalid */
var ERROR_CODE_DIAG_TRACE_ROUTE_MAX_HOP_COUNT_INVALID = 0x00030009;
/** Traceroute is busy */
var ERROR_CODE_TRACEROUTE_BUSY = 0x0003000a;

// Network error codes

/** The MAC address is missing */
var ERROR_CODE_NETWORK_MISSING_MAC_ADDRESS = 0x00040001;
/** The MAC address is invalid */
var ERROR_CODE_NETWORK_INVALID_MAC_ADDRESS = 0x00040002;
/** The MAC address is a duplicate */
var ERROR_CODE_NETWORK_DUPLICATE_MAC_ADDRESS = 0x00040003;
/** The IP address is missing */
var ERROR_CODE_NETWORK_MISSING_IP_ADDRESS = 0x00040004;
/** The IP address is not a valid IPv4 address */
var ERROR_CODE_NETWORK_INVALID_IPV4_ADDRESS = 0x00040005;
/** The IP address is not a valid IPv6 address */
var ERROR_CODE_NETWORK_INVALID_IPV6_ADDRESS = 0x00040006;
/** The port number is missing */
var ERROR_CODE_NETWORK_MISSING_PORT_NUMBER = 0x00040007;
/** The port number is invalid */
var ERROR_CODE_NETWORK_INVALID_PORT_NUMBER = 0x00040008;
/** The protocol is missing */
var ERROR_CODE_NETWORK_MISSING_PROTOCOL = 0x00040009;
/** The protocol is invalid */
var ERROR_CODE_NETWORK_INVALID_PROTOCOL = 0x0004000a;
/** The port security rule is a duplicate */
var ERROR_CODE_NETWORK_DUPLICATE_RULE = 0x0004000b;
/** The port security rule is overlapping with another */
var ERROR_CODE_NETWORK_OVERLAPPING_RULE = 0x0004000c;
/** The subnet mask is invalid */
var ERROR_CODE_NETWORK_INVALID_SUBNET_MASK = 0x0004000d;
/** The rule list is full - maximum limit reached */
var ERROR_CODE_NETWORK_RULE_LIST_FULL = 0x0004000e;

// Wifi error codes

/** The SSID is missing */
var ERROR_CODE_WIFI_MISSING_SSID = 0x00050001;
/** The SSID is invalid (Does not follow SSID naming rules) */
var ERROR_CODE_WIFI_INVALID_SSID = 0x00050002;
/** The SSID is the same as the primary SSID */
var ERROR_CODE_WIFI_MATCHES_PRIMARY_SSID = 0x00050003;
/** The SSID is the same as the guest SSID */
var ERROR_CODE_WIFI_MATCHES_GUEST_SSID = 0x00050004;
/** The channel number is missing */
var ERROR_CODE_WIFI_MISSING_CHANNEL = 0x00050005;
/** The channel number is invalid */
var ERROR_CODE_WIFI_INVALID_CHANNEL = 0x00050006;
/** The security type is missing */
var ERROR_CODE_WIFI_MISSING_SECURITY_TYPE = 0x00050007;
/** The security type is invalid */
var ERROR_CODE_WIFI_INVALID_SECURITY_TYPE = 0x00050008;
/** The SSID password is missing */
var ERROR_CODE_WIFI_MISSING_SSID_PASSWORD = 0x00050009;
/** The SSID password is invalid (does not follow SSID password rules) */
var ERROR_CODE_WIFI_INVALID_SSID_PASSWORD = 0x0005000a;
/** The SSID password matches the primary SSID password */
var ERROR_CODE_WIFI_PASSWORD_MATCHES_PRIMARY_PASSWORD = 0x0005000b;
/** The SSID password matches the guest SSID password */
var ERROR_CODE_WIFI_PASSWORD_MATCHES_GUEST_PASSWORD = 0x0005000c;
/** Smart Mode is not modifiable by the user */
var ERROR_CODE_WIFI_SMART_MODE_NOT_MODIFIABLE = 0x0005000e;

//// CONSTANTS ////

/** The V1 REST path root */
var REST_URI_V1_PATH = "/rest/v1";

/** The default time to wait between retries */
var DEFAULT_RETRY_DELAY_TIME = 10000;

/** The default number of times to retry */
var DEFAULT_RETRY_COUNT = 2;

/** The retry count for infinite retries */
var INFINITE_RETRY_COUNT = -1;

//// FUNCTIONS ////

/**
 * Handle an HTTP error when calling a REST endpoint
 *
 * @param {number} status the HTTP status
 * @param {string} textStatus the HTTP status text (may be empty)
 * @param {string} responseText the HTTP response body (may be empty)
 * @param {Object} responseData the parsed HTTP response body (may be empty)
 * @param {Object} errorHandlers the error handlers map (may be empty)
 * @param {*} userData the user data (may be empty)
 */
function restHttpError(status, textStatus, responseText, responseData, errorHandlers, userData) {
    var title = "HTTP Error " + status;
    var message = responseText;
    var errorCode = 0;

    switch (status) {
        case 0: // Network error
            if (textStatus === "timeout" && errorHandlers.hasOwnProperty("timeout")) {
                errorHandlers.timeout(userData);
            } else if (errorHandlers.hasOwnProperty("network")) {
                errorHandlers.network(userData);
            } else {
                $(document).trigger("unhandledNetworkError");
            }
            return;
        case 401: // Unauthorized
            if (errorHandlers.hasOwnProperty(401)) {
                errorHandlers[401](status, textStatus);
                return;
            }
        /* falls through */
        case 400: // Bad request
        case 403: // Forbidden
        case 404: // Not found
        case 405: // Bad method
        case 411: // Length required
        case 500: // Internal server error
        case 503: // Service unavailable

            // Was the JSON parsed?
            if (typeof responseData != 'undefined' && responseData != null) {
                message = responseData.message;
                errorCode = (responseData.errorCode || 0);
            }

            if (errorHandlers.hasOwnProperty(status)) {
                errorHandlers[status](status, message, errorCode, userData);
            }
        /* falls through */
        default:
            break;
    }
}

/**
 * The base REST endpoint AJAX function.
 *
 * This function should never be called directly. It is used by specified
 * functions below.
 *
 * The optional errorHandlers argument is a map which associates an error
 * handler with an HTTP error status value. If the default error handling
 * is to be overridden add a key value pair of the status to handle and a
 * function to handle it. The handler function is called with two arguments,
 * the HTTP status and the error message supplied by the backend.
 *
 * The userData value is passed back as the last argument of the success or
 * error callback
 *
 * NOTE: That authorization errors (401) can be overridden in which case
 * the authorization callback is ignored.
 *
 * NOTE: Setting the error callback will replace the built in error handling
 * meaning the errorHandlers map and authCallback will not be used.
 * Generally it will not be needed.
 *
 * @param {string} uri the URI to call
 * @param {string} method the method to use
 * @param {function} [success] the success callback function (optional)
 * @param {Object} [data] the data to send (optional)
 * @param {string} [token]  the authorization token (optional)
 * @param {function} [authCallback] the authorization error callback (optional)
 * @param {Object|function} [errorHandlers] the error handlers (optional)
 * @param {Object} [xhrFields] fieldName-fieldValue pairs to set on the native XHR object (optional)
 * @param {*} [userData] a user data value (optional)
 * @param {number} [timeout] a timeout for the request in milliseconds (optional)
 */
function restAJAX(uri, method, success, data, token, authCallback, errorHandlers, xhrFields, userData, timeout) {
    // Define error handlers if not defined
    if (typeof errorHandlers == 'undefined' || errorHandlers == null) {
        errorHandlers = {};
    }

    // Set the authorization error callback if not overridden
    if (typeof authCallback != 'undefined' && authCallback != null &&
        typeof errorHandlers == 'object' && !errorHandlers.hasOwnProperty(401)) {
        errorHandlers[401] = authCallback;
    }

    var settings = {
        'method': method,
        'success': function (data, textStatus, xhr) {
            if (typeof success != 'undefined' && success != null) {
                success(data, textStatus, xhr, userData);
            }
        },
        'error': typeof errorHandlers === 'function' ? errorHandlers : function (xhr, textStatus, errorThrown) {
            ajaxError(xhr, textStatus, errorThrown, restHttpError, errorHandlers, userData);
        }
    };

    if (typeof timeout === 'number' && timeout % 1 === 0) {
        settings.timeout = timeout;
    }

    if (typeof data != 'undefined' && data != null) {
        if (data instanceof FormData) {
            settings.contentType = false; // Let jquery define a multipart boundary
            settings.data = data;
        } else {
            settings.contentType = 'application/json';
            settings.data = JSON.stringify(data);
        }
        settings.processData = false;
    }

    if (xhrFields) {
        settings.xhrFields = xhrFields;
    }

    if (typeof token != 'undefined' && token != null) {
        settings.headers = {
            'Authorization': "Bearer " + token
        };
    }

    // Let jQuery infer returned data type from the content header.
    $.ajax(uri, settings);
}

/**
 * Performs an HTTP GET request on a specified REST endpoint
 *
 * This function performs an HTTP GET request to the specified URI. If
 * token is defined and is not null an appropriate Authorization header is
 * added to the request. Any data returned is parsed and passed to the
 * success callback function as a JavaScript object.
 *
 * The optional errorHandlers argument is a map which associates an error
 * handler with an HTTP error status value. If the default error handling
 * is to be overridden add a key value pair of the status to handle and a
 * function to handle it. The handler function is called with two arguments,
 * the HTTP status and the error message supplied by the backend.
 *
 * NOTE: That authorization errors (401) can be overridden in which case
 * the authorization callback is ignored.
 *
 * @param {string} uri the URI
 * @param {function} [success] the success callback function (optional)
 * @param {string} [token] the authorization token (optional)
 * @param {function} [authCallback] the authorization error callback (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 * @param {number} [timeout] a timeout for the request in milliseconds (optional)
 */
function restGet(uri, success, token, authCallback, errorHandlers, userData, timeout) {
    restAJAX(uri, "GET", success, null, token, authCallback, errorHandlers, null, userData, timeout);
}

/**
 * Performs an HTTP PUT request on a specified REST endpoint
 *
 * This function performs an HTTP PUT request to the specified URI. The
 * data object is converted to JSON and sent as the body of the request
 * together with the "Content-Type" header set to "application/json". If
 * token is defined and is not null an appropriate Authorization header is
 * added to the request. Any data returned is parsed and passed to the
 * success callback function as a JavaScript object.
 *
 * The optional errorHandlers argument is a map which associates an error
 * handler with an HTTP error status value. If the default error handling
 * is to be overridden add a key value pair of the status to handle and a
 * function to handle it. The handler function is called with two arguments,
 * the HTTP status and the error message supplied by the backend.
 *
 * NOTE: That authorization errors (401) can be overridden in which case
 * the authorization callback is ignored.
 *
 * @param {string} uri the URI
 * @param {Object} data the request data object
 * @param {function} [success] the success callback function (optional)
 * @param {string} [token] the authorization token (optional)
 * @param {function} [authCallback] the authorization error callback (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 * @param {number} [timeout] a timeout for the request in milliseconds (optional)
*/
function restPut(uri, data, success, token, authCallback, errorHandlers, userData, timeout) {
    restAJAX(uri, "PUT", success, data, token, authCallback, errorHandlers, null, userData, timeout);
}

/**
 * Performs an HTTP POST request on a specified REST endpoint
 *
 * This function performs an HTTP POST request to the specified URI. The
 * data object is converted to JSON and sent as the body of the request
 * together with the "Content-Type" header set to "application/json". If
 * token is defined and is not null an appropriate Authorization header is
 * added to the request. Any data returned is parsed and passed to the
 * success callback function as a JavaScript object.
 *
 * The optional errorHandlers argument is a map which associates an error
 * handler with an HTTP error status value. If the default error handling
 * is to be overridden add a key value pair of the status to handle and a
 * function to handle it. The handler function is called with two arguments,
 * the HTTP status and the error message supplied by the backend.
 *
 * NOTE: That authorization errors (401) can be overridden in which case
 * the authorization callback is ignored.
 *
 * @param {string} uri the URI
 * @param {Object} data the request data object
 * @param {function} [success] the success callback function (optional)
 * @param {string} [token] the authorization token (optional)
 * @param {function} [authCallback] the authorization error callback (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 * @param {number} [timeout] a timeout for the request in milliseconds (optional)
 */
function restPost(uri, data, success, token, authCallback, errorHandlers, userData, timeout) {
    restAJAX(uri, "POST", success, data, token, authCallback, errorHandlers, null, userData, timeout);
}

/**
 * Performs an HTTP PATCH request on a specified REST endpoint
 *
 * This function performs an HTTP PATCH request to the specified URI. The
 * data object is converted to JSON and sent as the body of the request
 * together with the "Content-Type" header set to "application/json". If
 * token is defined and is not null an appropriate Authorization header is
 * added to the request. Any data returned is parsed and passed to the
 * success callback function as a JavaScript object.
 *
 * The optional errorHandlers argument is a map which associates an error
 * handler with an HTTP error status value. If the default error handling
 * is to be overridden add a key value pair of the status to handle and a
 * function to handle it. The handler function is called with two arguments,
 * the HTTP status and the error message supplied by the backend.
 *
 * NOTE: That authorization errors (401) can be overridden in which case
 * the authorization callback is ignored.
 *
 * @param {string} uri the URI
 * @param {Object} data the request data object
 * @param {function} [success] the success callback function (optional)
 * @param {string} [token] the authorization token (optional)
 * @param {function} [authCallback] the authorization error callback (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 * @param {number} [timeout] a timeout for the request in milliseconds (optional)
 */
function restPatch(uri, data, success, token, authCallback, errorHandlers, userData, timeout) {
    restAJAX(uri, "PATCH", success, data, token, authCallback, errorHandlers, null, userData, timeout);
}

/**
 * Performs an HTTP DELETE request on a specified REST endpoint.
 *
 * This function performs an HTTP DELETE request to the specified URI. If
 * token is defined and is not null an appropriate Authorization header is
 * added to the request. Any data returned is parsed and passed to the
 * success callback function as a JavaScript object.
 *
 * The optional errorHandlers argument is a map which associates an error
 * handler with an HTTP error status value. If the default error handling
 * is to be overridden add a key value pair of the status to handle and a
 * function to handle it. The handler function is called with two arguments,
 * the HTTP status and the error message supplied by the backend.
 *
 * NOTE: That authorization errors (401) can be overridden in which case
 * the authorization callback is ignored.
 *
 * @param {string} uri the URI
 * @param {function} [success] the success handler (optional)
 * @param {string} [token] the authorization token (optional)
 * @param {function} [authCallback] the authorization error callback (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 * @param {number} [timeout] a timeout for the request in milliseconds (optional)
 */
function restDelete(uri, success, token, authCallback, errorHandlers, userData, timeout) {
    restAJAX(uri, "DELETE", success, null, token, authCallback, errorHandlers, null, userData, timeout);
}

/**
 * Performs an HTTP GET request on a specified REST endpoint
 *
 * This function performs an HTTP GET request to the specified URI. If
 * token is defined and is not null an appropriate Authorization header is
 * added to the request. Any data returned is parsed and passed to the
 * success callback function as a JavaScript object.
 *
 * The optional errorHandlers argument is a map which associates an error
 * handler with an HTTP error status value. If the default error handling
 * is to be overridden add a key value pair of the status to handle and a
 * function to handle it. The handler function is called with two arguments,
 * the HTTP status and the error message supplied by the backend.
 *
 * If HTTP status 503 is returned "Service Unavailable", the method will
 * wait for the specified delay time and then try the get again. It will
 * do this the number of times specified in retries. If it still gets
 * the error and there are error handlers, the error handler for 503 will
 * be called.
 *
 * The default values for delayMs and retries are 10000 and 2 respectively.
 *
 * NOTE: That authorization errors (401) can be overridden in which case
 * the authorization callback is ignored.
 *
 * @param {string} uri the URI
 * @param {function} [success] the success callback function (optional)
 * @param {number} [delayMs] the delay between retries in ms (optional)
 * @param {number} [retries] the number to times to retry (optional)
 * @param {string} [token] the authorization token (optional)
 * @param {function} [authCallback] the authorization error callback (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 */
function restGetRetry(uri, success, delayMs, retries, token, authCallback, errorHandlers, userData) {
    if (typeof delayMs === 'undefined') {
        delayMs = DEFAULT_RETRY_DELAY_TIME;
    }

    if (typeof retries === 'undefined') {
        retries = DEFAULT_RETRY_COUNT;
    }

    if (typeof errorHandlers === 'undefined') {
        errorHandlers = {};
    }

    // The original 503 error handler. This can legally be undefined!
    var error503Handler = errorHandlers[503];

    // Replace it to do the retry
    errorHandlers[503] = function(status, message, errorCode, userData) {
        if ((retries === INFINITE_RETRY_COUNT) || (retries > 0)) {
            if (retries > 0) {
                retries --;
            }

            setTimeout(function() {
                restGet(uri, success, token, authCallback, errorHandlers, userData);
            }, delayMs);
        } else {
            // If run out of retries call the original handler
            if (typeof error503Handler !== 'undefined') {
                error503Handler(status, message, errorCode, userData);
            }
        }
    };

    restGet(uri, success, token, authCallback, errorHandlers, userData);
}

var isLoading = {};

/**
 * Loads the file specified in the URI and caches it in the browser.
 *
 * @param {string} uri the URI to load/cache
 * @param {function} success the success callback
 * @param {function} callback success callback internal function
 * @param {function} done the done callback
 * @param {Object} [errorHandlers] the error handlers (optional)
 */
function authCache(uri, success, callback, done, errorHandlers) {
    if (errorHandlers) {
        if (!errorHandlers.hasOwnProperty(401)) {
            errorHandlers[401] = authFailure;
        }
    } else {
        errorHandlers = { 401: authFailure };
    }
    $.ajax(uri, {
        cache: true, // cache for efficiency
        // No data type as it is HTML
        error:  function (xhr, textStatus, errorThrown) {
            ajaxError(xhr, textStatus, errorThrown, restHttpError, errorHandlers);
        },
        success: success,
    }).always(function() {
        if (typeof done === 'function') {
            done();
        }
    });
}

/**
 * Loads HTML from given url - uses cached content if possible
 *
 * @param {string} uri the URI of the content
 * @param {function} successHandler called when the content is succesfully loaded
 * @param {function} callback called within successHandler
 * @param {Object} [errorHandlers] the error handlers (optional)
 */
function loadFromCache(uri, successHandler, callback, errorHandlers) {
    if (isLoading[uri]) {
        return;
    }
    isLoading[uri] = true;

    // Cache the content
    authCache(uri, successHandler, callback,
    // ajax done handler
    function() {
        isLoading[uri] = false;
    }, errorHandlers);
}

/**
 * Loads HTML in to the content area of the index page.
 *
 * @param {string} uri the URI of the content
 * @param {function} callback called when the content is loaded
 * @param {Object} [errorHandlers] the error handlers (optional)
 */
function loadContent(uri, callback, errorHandlers) {
    loadFromCache(uri, function(data, textStatus, jqXHR) {
        $("#index-content").fadeOut(DEFAULT_FADE_TIME_MS, function() {
            $("#index-content-unavailable").hide();
            $("#index-content").empty();

            $("#index-content").html(data);
            updateLanguageContentForCurrentUserForId("#index-content");
            $("#index-content").fadeIn(DEFAULT_FADE_TIME_MS);

            if (typeof callback === 'function') {
                callback();
            }
        });
    }, callback, errorHandlers);
}

/**
 * Loads HTML in to the overlay area of the index page.
 *
 * @param {string} uri the URI of the content
 * @param {function} callback called when the content is loaded
 * @param {Object} [errorHandlers] the error handlers (optional)
 */
function loadOverlay(uri, callback, errorHandlers) {
    loadFromCache(uri, function(data, textStatus, jqXHR) {
        $("#index-overlay").empty();

        $("#index-overlay").html(data);
        updateLanguageContentForCurrentUserForId("#index-overlay");

        // Show the overlay
        $("#index-overlay").fadeIn(DEFAULT_FADE_TIME_MS, function() {
            // Hide scrollbars from the page body that is behind the overlay
            $("body").addClass("noscroll");
            
            if (typeof callback === 'function') {
                callback();
            }
        });
    }, callback, errorHandlers);
}

/**
 * Hides an overlay.
 *
 * @param {function} callback called once the overlay is hidden
 */
function hideOverlay(callback) {
    $("#index-overlay").fadeOut(DEFAULT_FADE_TIME_MS, function() {
        // Restore any scrollbars on the page body
        $("body").removeClass("noscroll");

        if (typeof callback === 'function') {
            callback();
        }
    });
}

/**
 * Called when an Unauthorized error is received.
 */
function authFailure() {
    var user = retrieveCurrentUser();
    if (user) {
        removeCurrentUser();
        authRemoveUserLevel(user);
        var token = authRetrieveToken(user);
        if (token) {
            authRemoveToken(user);
            $(document).trigger("onInvalidateUserEvent");
        }
    }
    $("#index-loading-overlay").fadeOut(DEFAULT_FADE_TIME_MS, function() {
        loadOverlay("/overlays/login.html");
    });
}

/**
 * Stores the token for the specified user to local storage
 *
 * @param {number} user the user id
 * @param {string} token the authorization token
 */
function authStoreToken(user, token) {
    getStorage().setItem('token_' + user, token);
}

/**
 * Retrieves the token for the specified user from local storage
 *
 * @param {number} user the user id
 */
function authRetrieveToken(user) {
    return getStorage().getItem('token_' + user);
}

/**
 * Removes the token for the specified user from local storage
 *
 * @param {number} user the user id
 */
function authRemoveToken(user) {
    getStorage().removeItem('token_' + user);
}

/**
 * Stores the user level for the specified user to local storage
 *
 * @param {number} user the user id
 * @param {string} userLevel the user access level
 */
 function authStoreUserLevel(user, userLevel) {
    getStorage().setItem('level_' + user, userLevel);
}

/**
 * Retrieves the user level for the specified user from local storage
 *
 * @param {number} user the user id
 */
function authRetrieveUserLevel(user) {
    return getStorage().getItem('level_' + user);
}

/**
 * Removes the user level for the specified user from local storage
 *
 * @param {number} user the user id
 */
 function authRemoveUserLevel(user) {
    getStorage().removeItem('level_' + user);
}

/**
 * Returns true if CSR is currently logged in
 */
 function isCurrentUserCsr() {
    return authRetrieveUserLevel(retrieveCurrentUser()) == CSR_USER_LEVEL;
}

/**
 * Performs an HTTP GET request on a specified REST endpoint
 *
 * This function performs an HTTP GET request to the specified URI. If
 * the stored token is invalid this results in the password overlay
 * being displayed.
 *
 * @param {string} uri the URI
 * @param {function} [success] the success callback function (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 * @param {number} [timeout] a timeout for the request in milliseconds (optional)
 */
function authRestGet(uri, success, errorHandlers, userData, timeout) {
    restGet(uri, success,
        authRetrieveToken(retrieveCurrentUser()), authFailure,
        errorHandlers, userData, timeout);
}

/**
 * Performs an HTTP PUT request on a specified REST endpoint
 *
 * This function performs an HTTP PUT request to the specified URI. The
 * data object is converted to JSON and sent as the body of the request
 * together with the "Content-Type" header set to "application/json". Any
 * data returned is parsed and passed to the success callback function as
 * a JavaScript object. If the stored token is invalid this results in the
 * password overlay being displayed.
 *
 * @param {string} uri the URI
 * @param {Object} data the request data object
 * @param {function} [success] the success callback function (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 * @param {number} [timeout] a timeout for the request in milliseconds (optional)
 */
function authRestPut(uri, data, success, errorHandlers, userData, timeout) {
    restPut(uri, data, success,
        authRetrieveToken(retrieveCurrentUser()), authFailure,
        errorHandlers, userData, timeout);
}

/**
 * Performs an HTTP POST request on a specified REST endpoint
 *
 * This function performs an HTTP POST request to the specified URI. The
 * data object is converted to JSON and sent as the body of the request
 * together with the "Content-Type" header set to "application/json". Any
 * data returned is parsed and passed to the success callback function as
 * a JavaScript object. If the stored token is invalid this results in the
 * password overlay being displayed.
 *
 * @param {string} uri the URI
 * @param {Object} data the request data object
 * @param {function} [success] the success callback function (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 * @param {number} [timeout] a timeout for the request in milliseconds (optional)
 */
function authRestPost(uri, data, success, errorHandlers, userData, timeout) {
    restPost(uri, data, success,
        authRetrieveToken(retrieveCurrentUser()), authFailure,
        errorHandlers, userData, timeout);
}

/**
 * Performs an HTTP PATCH request on a specified REST endpoint
 *
 * This function performs an HTTP PATCH request to the specified URI. The
 * data object is converted to JSON and sent as the body of the request
 * together with the "Content-Type" header set to "application/json". Any
 * data returned is parsed and passed to the success callback function as
 * a JavaScript object. If the stored token is invalid this results in the
 * password overlay being displayed.
 *
 * @param {string} uri the URI
 * @param {Object} data the request data object
 * @param {function} [success] the success callback function (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 * @param {number} [timeout] a timeout for the request in milliseconds (optional)
 */
function authRestPatch(uri, data, success, errorHandlers, userData, timeout) {
    restPatch(uri, data, success,
        authRetrieveToken(retrieveCurrentUser()), authFailure,
        errorHandlers, userData, timeout);
}

/**
 * Performs an HTTP DELETE request on a specified REST endpoint
 *
 * This function performs an HTTP DELETE request to the specified URI. If
 * the stored token is invalid this results in the password overlay
 * being displayed.
 *
 * @param {string} uri the URI
 * @param {function} [success] the success callback function (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 * @param {number} [timeout] a timeout for the request in milliseconds (optional)
 */
function authRestDelete(uri, success, errorHandlers, userData, timeout) {
    restDelete(uri, success,
        authRetrieveToken(retrieveCurrentUser()), authFailure,
        errorHandlers, userData, timeout);
}

/**
 * Performs an HTTP GET request on a specified REST endpoint
 *
 * This function performs an HTTP GET request to the specified URI. If
 * the stored token is invalid this results in the password overlay
 * being displayed.
 *
 * If HTTP status 503 is returned "Service Unavailable", the method will
 * wait for the specified delay time and then try the get again. It will
 * do this the number of times specified in retries. If it still gets
 * the error and there are error handlers, the error handler for 503 will
 * be called.
 *
 * The default values for delayMs and retries are 10000 and 3 respectively.
 *
 * @param {string} uri the URI
 * @param {function} success the success callback function
 * @param {number} [delayMs] the delay between retries in ms (optional)
 * @param {number} [retries] the number to times to retry (optional)
 * @param {Object} [errorHandlers] the error handlers (optional)
 * @param {*} [userData] a user data value (optional)
 */
function authRestGetRetry(uri, success, delayMs, retries, errorHandlers, userData) {
    restGetRetry(uri, success, delayMs, retries,
        authRetrieveToken(retrieveCurrentUser()), authFailure,
        errorHandlers, userData);
}

/**
 * Performs an HTTP GET request on a specified REST endpoint
 *
 * This function performs an HTTP GET request to the specified URI.
 *
 * @param {string} uri the URI
 * @returns {object} the promise
 */
 function deferredAuthRestGet(uri) {
    var deferred = $.Deferred();
    restGet(uri, deferred.resolve,
        authRetrieveToken(retrieveCurrentUser()), null,
        deferred.reject);
    return deferred.promise();
}

/**
 * Validates a user with the backend getting a token
 *
 * This function validates a user with the backend. If successful the
 * returned token is stored for that user. On success the success callback
 * is called if supplied. On error the error callback is called if
 * supplied.
 *
 * @param {number} user the user id
 * @param {string} password the password
 * @param {function} [success] the success callback (optional)
 * @param {Object} [errorHandlers] the failure error handler callbacks (optional)
 */
function authValidateUser(user, password, success, errorHandlers) {

    var uri = REST_URI_V1_PATH + "/user/";

    uri += user ? user + "/tokens" : "login";

    restAJAX(
        uri,
        'POST',
        function(data) {
            // Store user first
            if (!user) {
                user = data.created.userId;
                getStorage().setItem('current_user', user);
            }

            authStoreToken(user, data.created.token);
            authStoreUserLevel(user, data.created.userLevel);

            if (typeof success === 'function') {
                success();
            }
        }, {
            password: password
        },
        null, null, errorHandlers);
}

/**
 * Invalidates the user removing the sessions token
 *
 * @param {number} user the user id
 * @param {function} [callback] the callback function (optional)
 */
function authInvalidateUser(user, callback) {
    authRestDelete(
        REST_URI_V1_PATH + "/user/" + user + "/token/" + authRetrieveToken(user),
        function() {
            removeCurrentUser();
            authRemoveToken(user);
            authRemoveUserLevel(user);

            if (typeof callback === 'function') {
                callback(user);
            }
        }
    );
}
