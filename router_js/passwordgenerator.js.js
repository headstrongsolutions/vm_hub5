
var PASSWORD_LENGTH = 14;

var MINIMUM_LOWER_CASES = 3;
var MINIMUM_UPPER_CASES = 3;
var MINIMUM_NUMBERS = 3;
var MINIMUM_SPECIAL = 1;

var EMPTY_INDEX = -1;

var RANGE_LOWER_CASES = [[97, 122]];     // [a,z]
var RANGE_UPPER_CASES = [[65, 90]];      // [A,Z]
var RANGE_NUMBERS = [[48, 57]];          // [0,9]
var RANGE_SPECIAL = [[33, 47], [58, 64], [91, 96], [123, 126]];   // special character ranges

/**
 * Gets random number based on given maximum
 *
 * @param {number} max maximum value within range [1, 256]
 * @returns {number} integer with random from 0 up to (max - 1)
 */
function getRandom(max) {
    var array = new Uint8Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
}

/**
 * Inserts character at random position.
 * Empty positions (one at least) to fill up should be marked
 * with -1 (EMPTY_INDEX) value in passed 'word'.
 *
 * @param {string} character single character to insert
 * @param {string} word target string
 */
function insertCharacter(character, word) {
    var index = getRandom(word.length);
    var count = 0;
    while (word[index] != EMPTY_INDEX) {
        index = (index + 1) % word.length;
        if (++count == word.length) return;
    }
    word[index] = character;
}

/**
 * Selects random character from given ASCII range
 *
 * @param {number} first range start value
 * @param {number} last range end value
 * @returns {string} random character from given range
 */
function pickCharacterFromRange(first, last) {
    var characterCode = getRandom(last - first + 1) + first;
    return String.fromCharCode(characterCode);
}

/**
 * Inserts selected amount of random characters from given ranges
 * into password string
 *
 * @param {number} amount amount of characters to pick up
 * @param {Array} ranges array of arrays of ASCII value ranges
 * @param {string} password password to fill up
 */
function insertCharactersFromRange(amount, ranges, password) {
    for (var i = 0; i < amount; i++) {
        var selectedRange = 0;
        if (ranges.length > 1) {
            selectedRange = getRandom(ranges.length);
        }
        insertCharacter(pickCharacterFromRange(ranges[selectedRange][0],ranges[selectedRange][1]), password);
    }
}

/**
 * Puts values from given range into array
 *
 * @param {Array} ranges array of ranges
 * @returns {Array} target array
 */
function putRangeIntoArray(ranges) {
    var array = [];
    for (var i = 0; i < ranges.length; i++) {
        var first = ranges[i][0];
        var last = ranges[i][1];
        while (first <= last) {
            array.push(first);
            first++;
        }
    }
    return array;
}

/**
 * Generates random password based on defined requirements:
 * - password length: 14
 * - minimum lower case characters: 3
 * - minimum upper case characters: 3
 * - minimum number characters: 3
 * - minimum special characters: 1
 *
 * @returns {string} generated password
 */
function generatePassword() {

    var password = new Array(PASSWORD_LENGTH).fill(EMPTY_INDEX);
    insertCharactersFromRange(MINIMUM_LOWER_CASES, RANGE_LOWER_CASES, password);
    insertCharactersFromRange(MINIMUM_UPPER_CASES, RANGE_UPPER_CASES, password);
    insertCharactersFromRange(MINIMUM_NUMBERS, RANGE_NUMBERS, password);
    insertCharactersFromRange(MINIMUM_SPECIAL, RANGE_SPECIAL, password);

    var allCharacters = putRangeIntoArray(RANGE_LOWER_CASES)
                            .concat(putRangeIntoArray(RANGE_UPPER_CASES))
                            .concat(putRangeIntoArray(RANGE_NUMBERS))
                            .concat(putRangeIntoArray(RANGE_SPECIAL));

    var remainingPositions = new Uint8Array(PASSWORD_LENGTH -
        MINIMUM_LOWER_CASES -
        MINIMUM_UPPER_CASES -
        MINIMUM_NUMBERS -
        MINIMUM_SPECIAL
    );
    window.crypto.getRandomValues(remainingPositions);
    for (var i = 0; i < remainingPositions.length; i++) {
        var val = remainingPositions[i] % allCharacters.length;
        insertCharacter(String.fromCharCode(allCharacters[val]), password);
    }

    return password.join("");
}
