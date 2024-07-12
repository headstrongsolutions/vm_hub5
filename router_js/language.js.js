//
//
//
//
//
//

/** The location of language resources */
var LANGUAGE_RESOURCE_PATH = "/resources/languages";

/** The language translation ids */
var LANGUAGE_STRING_IDS = {
    "en"     : "c_lg01",
    "de"     : "c_lg02",
    "es"     : "c_lg03",
    "es_cwc" : "c_lg03",
    "tw"     : "c_lg04",
    "cn"     : "c_lg05",
    "nl"     : "c_lg06",
    "fr"     : "c_lg07",
    "cz"     : "c_lg08",
    "pl"     : "c_lg09",
    "sk"     : "c_lg10",
    "it"     : "c_lg11",
    "tr"     : "c_lg12",
    "ro"     : "c_lg13",
    "hu"     : "c_lg14",
    "ru"     : "c_lg15",
    "uk"     : "c_lg01"
 };

/** The languages supported by the backend */
var supportedLanguages = [];

/** The strings for each language downloaded */
var languageStrings = {};

/** Any conversion mapping for specific products */
var languageProductMap = {};

/** Currently applied language */
var uiCurrentLanguage = "";

/**
 * Returns the string ID for the specified language.
 *
 * @param {string} language the language identifier
 * @returns {string} the string ID for the language
 */
function getLanguageStringId(language) {
    if (LANGUAGE_STRING_IDS.hasOwnProperty(language)) {
        return LANGUAGE_STRING_IDS[language];
    } else {
        console.log("Warning: Unrecognised language!");
        return undefined;
    }
}

/**
 * Gets the supported languages from the server
 *
 * @param {function} [callback] a function to call when complete (optional)
 */
function getSupportedLanguages(callback) {
    var uri = REST_URI_V1_PATH + "/system/languages";

    restGetRetry(uri, function(data) {
        // Global variable
        supportedLanguages = data.languages.languages;

        // Call any callback
        if (typeof callback != 'undefined' && callback != null) {
            callback(data.languages.languages);
        }
    });
}

/**
 * Loads a language resource (JSON file)
 *
 * @param {string} language the language idenfier
 * @param {function} [callback] a function to call when complete (optional)
 */
function loadLanguageResource(language, callback) {
    var languageFile = language + ".json";

    // This map maps between the selected language and the
    // one to be used on the product. For example en -> uk
    // The map is populated when the product ID is read.
    if (languageProductMap.hasOwnProperty(language)) {
        languageFile = languageProductMap[language] + ".json";
    }

    var uri = LANGUAGE_RESOURCE_PATH + "/" + languageFile;

    $.ajax(uri, {
        cache: true, // cache for efficiency
        dataType: 'json',
        error:  ajaxError,
        success: function (data, textStatus, xhr) {
            // Global variable
            languageStrings[language] = data;

            if (typeof callback != 'undefined' && callback != null) {
                callback(language, data);
            }
        }
    });
}

/**
 * Updates the text used in the DOM.
 *
 * This function iterates through the entire DOM updating the content of
 * all elements which implement the classes "langHtml" or "langValue" and
 * set the strings to be appropriate language translation based on the
 * specified language file.
 *
 * Elements which contain text should either inherit from class langHtml
 * and/or class langValue. They should also have an id which uniquely
 * identifies the string to be used as the textual content. Calling this
 * function will update all the content to that for the selected language.
 * Elements with class langHtml have their inner HTML updated and elements
 * with class langValue have their value properties updated.
 *
 * @param {string} language the language identifier
 */
function updateLanguageContent(language) {
    if (languageStrings.hasOwnProperty(language)) {
        var strings = languageStrings[language];

        // Iterate over the selector for class .langHtml and update the inner
        // HTML for each element
        $(".langHtml").each(function (idx, elem) {
            var id = this.getAttribute("data-lang-id");
            if (strings.hasOwnProperty(id)) {
                $(elem).html(strings[id]);
            }
        });

        $(".langValue").each(function (idx, elem) {
            var id = this.getAttribute("data-lang-id");
            if (strings.hasOwnProperty(id)) {
                $(elem).val(strings[id]);
            }
        });

        var productName = getProductName();
        if (productName) {
            $('span[data-placeholder="ProductName"]').html(productName);
        }

        // Cloud UI
        var appName = getCloudAppName();
        if (appName) {
            $('span[data-placeholder="MobileAppName"]').html(appName);
        }
        var websiteHelpUrl = getCloudWebsiteHelpUrl();
        if (websiteHelpUrl) {
            $('span[data-placeholder="WebHelpURL"]').html(websiteHelpUrl);
        }
    }
    uiCurrentLanguage = language;
}

/**
 * Returns the webui skin from localization
 *
 * @returns {string} the skin value
 */
function getSkin() {
    return getStorage().getItem('skin');
}

/**
 * Sets the webui skin from localization
 *
 * @param {string} skin the skin value
 */
 function setSkin(skin) {
    getStorage().setItem('skin', skin);
}

/**
 * Returns the product name
 *
 * @returns {string} product name
 */
function getProductName() {
    return getStorage().getItem('productName');
}

/**
 * Sets the product name
 *
 * @param {string} name the product name to set and store
 */
function setProductName(name) {
    getStorage().setItem('productName', name);
}

/**
 * Returns the cloud app name
 *
 * @returns {string} cloud app name
 */
 function getCloudAppName() {
    return getStorage().getItem('appName');
}

/**
 * Sets the cloud app name
 *
 * @param {string} appName the cloud app name to set and store
 */
function setCloudAppName(appName) {
    getStorage().setItem('appName', appName);
}

/**
 * Returns the cloud website help URL
 *
 * @returns {string} cloud website help URL
 */
 function getCloudWebsiteHelpUrl() {
    return getStorage().getItem('websiteHelpUrl');
}

/**
 * Returns the cloud website help URL
 *
 * @param {string} websiteHelpUrl the cloud website help URL to set and store
 */
function setCloudWebsiteHelpUrl(websiteHelpUrl) {
    getStorage().setItem('websiteHelpUrl', websiteHelpUrl);
}

/**
 * Returns the style name
 *
 * @returns {string} style name
 */
 function getStyleName() {
    return getStorage().getItem('styleName');
}

/**
 * Sets the style name
 *
 * @param {string} name the style name to store
 */
function setStyleName(name) {
    getStorage().setItem('styleName', name);
}

/**
 * Gets the localization from the server
 *
 * @param {function} callback
 */
function getLocalization(callback) {
    var uri = REST_URI_V1_PATH + "/system/localization";

    restGetRetry(uri, function(data) {
        var skin = data.localization.skin;
        var productName = data.localization.productName;

        setSkin(skin);
        setProductName(productName);

        // default to upc styling
        var styleName = "upc";
        if (skin.indexOf("virgin_media") !== -1) {
            languageProductMap.en = "uk";
            styleName = "virgin_media";
        } else if (skin == "ziggo" || skin == "sunrise" || skin == "yallo") {
            styleName = skin;
        }
        setStyleName(styleName);

        // Call any callback
        if (typeof callback === 'function') {
            callback(styleName, productName);
        }
    }, 30000, INFINITE_RETRY_COUNT);
}

/**
 * Stores the user's language preference to local storage
 *
 * @param {number} user the user
 * @param {string} language the language
 */
function storeUsersLanguage(user, language) {
    getStorage().setItem('lang_' + user, language);
}

/**
 * Retrieves the user's language preference from local storage
 *
 * @param {number} user the user
 */
function retrieveUsersLanguage(user) {
    return getStorage().getItem('lang_' + user);
}

/**
 * Stores the current user's language preference to local storage
 *
 * @param {string} language the language
 */
function storeCurrentUsersLanguage(language) {
    // Always use default user
    storeUsersLanguage(DEFAULT_USER, language);
}

/**
 * Retrieves the current user's language preference
 */
function retrieveCurrentUsersLanguage() {
    // Always use default user
    return retrieveUsersLanguage(DEFAULT_USER);
}

/**
 * Retrieves a user's language selection.
 *
 * This function retrieves a user's language selection.
 *
 * @param {number} user the user number
 * @param {function} callback a callback to call on completion
 */
function getUsersLanguage(user, callback) {
    var uri = REST_URI_V1_PATH + "/user/" + user + "/language";

    restGetRetry(uri, function(data) {
        storeUsersLanguage(user, data.language.language);
        callback(user, data.language.language);
    });
}

/**
 * Sets a user's language selection
 *
 * @param {number} user the user number
 * @param {string} language the language selected
 * @param {function} [callback] a callback to call on completion (optional)
 */
function setUsersLanguage(user, language, callback) {

    storeUsersLanguage(user, language);

    var uri = REST_URI_V1_PATH + "/user/" + user + "/language";
    var data = {
        language: {
            language: language
        }
    };

    // Update the backend
    restPut(uri, data, function() {
        if (typeof callback === 'function') {
            callback(user, language);
        }
    });
}

/**
 * Updates the text used based on the user's preference
 *
 * @param {number} user the user number
 */
function updateLanguageContentForUser(user) {
    updateLanguageContent(retrieveUsersLanguage(user));
}

/**
 * Updates the text used based on the user's preference in the id
 *
 * @param {number} user the user number
 * @param {string} id the element id
 */
function updateLanguageContentForUserForId(user, id) {
    updateLanguageContent(retrieveUsersLanguage(user), id);
}

/**
 * Returns the translation string for the specified language and id
 *
 * @param {string} language the language
 * @param {string} id the string id
 */
function getLanguageStringForId(language, id) {
    if (languageStrings.hasOwnProperty(language)) {
        var strings = languageStrings[language];

        if (strings.hasOwnProperty(id)) {
            return strings[id];
        }
    }

    return undefined;
}

/**
 * Returns the translation string for the specified user and id
 *
 * @param {number} user the user
 * @param {string} id the string id
 */
function getLanguageStringForUserAndId(user, id) {
    return getLanguageStringForId(retrieveUsersLanguage(user), id);
}

/**
 * Updates the text used based on the current user's preference
 */
function updateLanguageContentForCurrentUser() {
    // Always use default user
    updateLanguageContentForUser(DEFAULT_USER);
}

/**
 * Updates the text used based on the current user's preference in the id
 *
 * @param {string} id the element id
 */
function updateLanguageContentForCurrentUserForId(id) {
    // Always use default user
    updateLanguageContentForUserForId(DEFAULT_USER, id);
}

/**
 * Returns the translation string for the specified user and id
 *
 * @param {number} user the user
 * @param {string} id the string id
 */
function getLanguageStringForCurrentUserAndId(id) {
    // Always use default user
    return getLanguageStringForUserAndId(DEFAULT_USER, id);
}

/**
 * Sets the content of the element to translated language string by id
 *
 * @param {Object} elem the jQuery object to set the content of
 * @param {string} id the string id
 * @param {Object} data dynamic data to populate place holders
 * @returns {Object} the jQuery object
 */
function setLanguageStringOfHtmlForCurrentUserAndId(elem, id, data) {
    elem.attr("data-lang-id", id).addClass("langHtml").html(
        getLanguageStringForCurrentUserAndId(id)).find(
            "span[data-placeholder=\"ProductName\"]").text(
                getProductName());
    if (data && typeof data === "object") {
        for (var key in data) {
            elem.find("span[data-placeholder=\"" +
                key + "\"]").text(data[key]);
        }
    }
    return elem;
}

/**
 * An event handler called when a language option is selected
 *
 * This function uses the specified language to update the currently
 * selected language. The value of the selected item must be a valid
 * language identifier.
 *
 * @param {string} language the selected language id.
 */
function onLanguageSelected(language) {
    // Load the resources and translate.
    // Update session storage and backend.
    if (uiCurrentLanguage != language) {
        loadLanguageResource(language, function() {
            updateLanguageContent(language);
            if (retrieveCurrentUsersLanguage() != uiCurrentLanguage) {
                setUsersLanguage(DEFAULT_USER, uiCurrentLanguage);
            }
        });
    }
}
