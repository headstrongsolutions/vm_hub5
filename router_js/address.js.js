/* ADDRESS FORMAT ERROR CODES */
/** Unknown error */
var ADDRESS_FORMAT_ERROR_UNKNOWN = 0x0000;
/** Invalid address type */
var ADDRESS_FORMAT_ERROR_INVALID_ADDRESS_TYPE = 0x0001;
/** Invalid octets type */
var ADDRESS_FORMAT_ERROR_INVALID_OCTETS_TYPE = 0x0002;
/** Invalid octet value */
var ADDRESS_FORMAT_ERROR_INVALID_OCTET_VALUE = 0x0003;
/** Invalid number of octets */
var ADDRESS_FORMAT_ERROR_INVALID_NUMBER_OF_OCTETS = 0x0004;
/** Empty octet */
var ADDRESS_FORMAT_ERROR_EMPTY_OCTET = 0x0005;
/** Invalid hextets type */
var ADDRESS_FORMAT_ERROR_INVALID_HEXTETS_TYPE = 0x0006;
/** Invalid hextet value */
var ADDRESS_FORMAT_ERROR_INVALID_HEXTET_VALUE = 0x0007;
/** Invalid number of hextets */
var ADDRESS_FORMAT_ERROR_INVALID_NUMBER_OF_HEXTETS = 0x0008;
/** Empty hextet */
var ADDRESS_FORMAT_ERROR_EMPTY_HEXTET = 0x0009;


/**
 * Constructs a new AddressFormatError object
 *
 * @param {string} message the error message
 * @param {number} errorCode the error code
 */
function AddressFormatError(message, errorCode) {
    Error.call(this, message);

    this.name = "AddressFormatError";
    this.message = (message || "");

    if (typeof errorCode !== 'undefined') {
        this.errorCode = errorCode;
    } else {
        this.errorCode = ADDRESS_FORMAT_ERROR_UNKNOWN;
    }
}

AddressFormatError.prototype = Object.create(Error.prototype);

/**
 * Constructs a new base Address object
 */
function Address() {
    this.address = [];
}

Address.prototype.getAddress = function() {
    return this.address;
};

Address.prototype.toString = function() {
    return "";
};

Address.prototype.toJSON = function() {
    return this.toString();
};

/**
 * Checks an array of octets is a valid IPv4 address throwing an error is not.
 *
 * @param {Array} octets the octets
 * @throws {AddressFormatError} when provided invalid octet(s)
 */
function validateIPv4Address(octets) {
    if (typeof octets !== 'object' || !(octets.length)) {
        throw new AddressFormatError("Invalid octets type", ADDRESS_FORMAT_ERROR_INVALID_OCTETS_TYPE);
    }

    if (octets.length != 4) {
        throw new AddressFormatError("Invalid number of octets", ADDRESS_FORMAT_ERROR_INVALID_NUMBER_OF_OCTETS);
    } else {
        for (var idx in octets) {
            if (octets[idx] === "") {
                throw new AddressFormatError("Empty octet", ADDRESS_FORMAT_ERROR_EMPTY_OCTET);
            }
            if (!(/^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/.test(octets[idx]))) {
                throw new AddressFormatError("Invalid octet value", ADDRESS_FORMAT_ERROR_INVALID_OCTET_VALUE);
            }
        }
    }
}

/**
 * Constructs a new IPv4 address object.
 *
 * This constructs an new IPv4 address. The address can be provided as
 * a dotted string, an array of octets or a number, or an IPv4Address.
 *
 * @param {string|number|Array} address the address
 * @throws {AddressFormatError} when provided invalid address
 */
function IPv4Address(address) {
    Address.call(this);

    var octets;
    if (typeof address === 'string') {
        octets = address.split('.');

        validateIPv4Address(octets);
        this.address = octets;
    } else if (typeof address === 'number') {
        octets = [];

        octets.push(Math.floor(address / 0x1000000) & 0xff);
        octets.push(Math.floor(address / 0x10000) & 0xff);
        octets.push(Math.floor(address / 0x100) & 0xff);
        octets.push(Math.floor(address) & 0xff);

        this.address = octets;
    } else if (typeof address === 'object' && address.length) {
        validateIPv4Address(address);
        this.address = address.slice();
    } else if (typeof address === 'object' && typeof address.address === 'object' && address.address.length) {
        validateIPv4Address(address.address);
        this.address = address.address.slice();
    } else {
        throw new AddressFormatError("Invalid address type", ADDRESS_FORMAT_ERROR_INVALID_ADDRESS_TYPE);
    }
}

IPv4Address.prototype = Object.create(Address.prototype);

IPv4Address.prototype.toString = function() {
    return this.address.join('.');
};

IPv4Address.prototype.toNumber = function() {
    return (parseInt(this.address[0]) * 0x1000000) +
        (parseInt(this.address[1]) * 0x10000) +
        (parseInt(this.address[2]) * 0x100) +
        (parseInt(this.address[3]));
};

IPv4Address.prototype.inSubnet = function(testIp, testMask) {

    var testBaseAddress = new IPv4Address(testIp);
    var testSubnetMask = new IPv4Address(testMask);

    if (this.maskWith(testSubnetMask).toString() === testBaseAddress.maskWith(testSubnetMask).toString()) {
        return true;
    }

    return false;
};

IPv4Address.prototype.overlapsSubnet = function(ownMask,testIp,testMask) {

    var testBaseAddress;
    var testSubnetMask;

    if (typeof(testIp) == 'string' || typeof(testIp) == 'object') {
        testBaseAddress = new IPv4Address(testIp);
    } else {
        throw new AddressFormatError("Invalid address type", ADDRESS_FORMAT_ERROR_INVALID_ADDRESS_TYPE);
    }

    if (typeof(testMask) == 'string' || typeof(testMask) == 'object') {
        testSubnetMask = new IPv4Address(testMask);
    } else {
        throw new AddressFormatError("Invalid address type", ADDRESS_FORMAT_ERROR_INVALID_ADDRESS_TYPE);
    }

    // Calculate limits of our and test subnets
    var ownBaseNumber = this.maskWith(ownMask).toNumber();
    var ownEndNumber = this.getLastAddress(ownMask).toNumber();
    var testBaseNumber = testBaseAddress.maskWith(testSubnetMask).toNumber();
    var testEndNumber = testBaseAddress.getLastAddress(testSubnetMask).toNumber();

    // Test any part of our subnet falls inside test subnet
    if ((ownBaseNumber >= testBaseNumber && ownBaseNumber <= testEndNumber) ||
    (ownEndNumber >= testBaseNumber && ownEndNumber <= testEndNumber) ||
    (ownBaseNumber <= testBaseNumber && ownEndNumber >= testEndNumber)) {
        return true;
    }
    return false;
};

IPv4Address.prototype.maskWith = function(mask) {
    var maskedAddress = new IPv4Address(this.address);
    for (var i = 0 ; i < 4 ; i++) {
        maskedAddress.address[i] = this.address[i] & mask.address[i];
    }
    return maskedAddress;
};

IPv4Address.prototype.getLastAddress = function(mask) {
    var lastAddress = new IPv4Address(this.address);
    for (i = 0 ; i < 4 ; i++) {
        lastAddress.address[i] = this.address[i] | ((~mask.address[i])&0xff);
    }
    return lastAddress;
};

IPv4Address.prototype.getMaskCIDR = function() {
    var cidrNumber = this.toNumber();
    var cidr = cidrNumber.toString(2).split('1').length - 1;
    return cidr.toString();
};

IPv4Address.prototype.isContiguous = function() {
    var cidrNumber = this.toNumber();
    var cidrBinary = cidrNumber.toString(2);
    return ((cidrBinary.split('1').length - 1) == cidrBinary.search('0'));
};

IPv4Address.prototype.inDhcpRange = function(minInAddress, maxInAddress) {
    var minAddress;
    if (typeof(minInAddress) == 'string') {
        minAddress = convertIPv4AddressToNumber(minInAddress);
    } else if (typeof(minInAddress) == 'object') {
        minAddress = minInAddress.toNumber();
    } else {
        throw new AddressFormatError("Invalid address type", ADDRESS_FORMAT_ERROR_INVALID_ADDRESS_TYPE);
    }

    var maxAddress;
    if (typeof(maxInAddress) == 'string') {
        maxAddress = convertIPv4AddressToNumber(maxInAddress);
    } else if (typeof(maxInAddress) == 'object') {
        maxAddress = maxInAddress.toNumber();
    } else {
        throw new AddressFormatError("Invalid address type", ADDRESS_FORMAT_ERROR_INVALID_ADDRESS_TYPE);
    }

    var thisAddress = this.toNumber();

    return thisAddress >= minAddress && thisAddress <= maxAddress;
};

/**
 * Checks an array of octets is a valid IPv6 address throwing an error is not.
 *
 * @param {Array} hextet the hextet
 * @throws {AddressFormatError} when provided invalid hextet(s)
 */
function validateIPv6Address(hextet) {
    if (typeof hextet !== 'object' || !(hextet.length)) {
        throw new AddressFormatError("Invalid hextets type", ADDRESS_FORMAT_ERROR_INVALID_HEXTETS_TYPE);
    }

    if (hextet.length < 4 || hextet.length > 8) {
        throw new AddressFormatError("Invalid number of hextets", ADDRESS_FORMAT_ERROR_INVALID_NUMBER_OF_HEXTETS);
    } else {
        for (var idx in hextet) {
            if (hextet[idx] < 0 || hextet[idx] > 0xffff) {
                throw new AddressFormatError("Invalid hextet value", ADDRESS_FORMAT_ERROR_INVALID_HEXTET_VALUE);
            }
        }
    }
}

/**
 * Constructs a new IPv6 address object.
 *
 * This constructs an new IPv6 address. The address can be provided as
 * a dotted string or an array of hextets (16 bit values).
 *
 * @param {string|Array} address the address
 * @throws {AddressFormatError} when provided invalid address
 */
function IPv6Address(address) {
    Address.call(this);

    if (typeof address === 'string') {
        var parts = address.split(':');
        var hextets = [];

        for (var idx in parts) {
            if (isNaN(parseInt(parts[idx], 16))) {
                parts[idx] = 0;
            }
            hextets.push(parseInt(parts[idx], 16));
        }

        validateIPv6Address(hextets);
        this.address = hextets;
    } else if (typeof address === 'object' && address.length) {
        validateIPv6Address(address);
        this.address = address;
    } else {
        throw new AddressFormatError("Invalid address type", ADDRESS_FORMAT_ERROR_INVALID_ADDRESS_TYPE);
    }
}

IPv6Address.prototype = Object.create(Address.prototype);

IPv6Address.prototype.toString = function() {
    var hextets = [];

    for (var idx in this.address) {
        var str = this.address[idx].toString(16).padStart(4,'0');
        hextets.push(str.slice(-4));
    }

    return hextets.join(':');
};

/**
 * Validates a given MAC address.
 *
 * @param {Array} address the address
 * @throws {AddressFormatError} when provided invalid octet(s), address type or length
 */
function validateMacAddress(address) {
    if (!Array.isArray(address) || !(address.length)) {
        throw new AddressFormatError("Invalid address type", ADDRESS_FORMAT_ERROR_INVALID_ADDRESS_TYPE);
    }

    if (address.length != 6) {
        throw new AddressFormatError("Invalid number of octets", ADDRESS_FORMAT_ERROR_INVALID_NUMBER_OF_OCTETS);
    } else {
        var regex = new RegExp("^([a-fA-F0-9][a-fA-F0-9]{1})$");
        for (var idx = 0; idx < address.length; idx++) {
            if (!(regex.test(address[idx]))) {
                throw new AddressFormatError("Invalid octet value", ADDRESS_FORMAT_ERROR_INVALID_OCTET_VALUE);
            }
        }
    }
}

/**
 * Constructs a new MAC address object.
 *
 * This constructs an new MAC address. The address can be provided as
 * a dotted string or an array of octets (16 bit values).
 *
 * @param {string|Array} address the address
 * @throws {AddressFormatError} when provided invalid address type
 */
function MacAddress(address) {
    Address.call(this);

    if (typeof address === 'string') {
        var parts = address.split(':');
        validateMacAddress(parts);
        this.address = parts;
    } else if (typeof address === 'object' && address.length) {
        validateMacAddress(address);
        this.address = address;
    } else {
        throw new AddressFormatError("Invalid address type", ADDRESS_FORMAT_ERROR_INVALID_ADDRESS_TYPE);
    }
}

MacAddress.prototype = Object.create(Address.prototype);

MacAddress.prototype.toString = function() {
    return this.address.join(':');
};

MacAddress.prototype.isMulticastAddress = function() {
    if (parseInt(this.address[0],16) & 0x01) {
        return true;
    } else {
        return false;
    }
};
