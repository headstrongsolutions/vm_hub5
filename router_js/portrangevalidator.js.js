/**
 * Constructs a new Port range validator object.
 *
 * This constructs Port range validator object. Used to determine if
 * port range contains reserved ports.
 * Reserved ports depend on the used protocol (TCP/UDP)
 *
 * @param {string} protocol determines restricted ports (tcp, udp, tcp_udp)
 * @param {number} start range start port
 * @param {number} end range end port
 */
function PortRangeValidator(protocol, start, end) {
    var reservedPortsProtocols = {
        'tcp': [25, 53, 135, 137, 138, 139, 161, 162, 445, 1080],
        'udp': [53, 135, 137, 139, 161, 162],
        'tcp_udp': [25, 53, 135, 137, 138, 139, 161, 162, 445, 1080],
    };

    this.start = start;
    this.end = end;
    this.reservedPorts = reservedPortsProtocols[protocol];
}

/**
 * Checks for reserved ports within the port range.
 *
 * This checks for restricted port within port range (bounds exclusive)
 *
 * @returns {boolean} true if range contains reserved ports otherwise false.
 */
PortRangeValidator.prototype.containsRestrictedPort = function() {
    for (var i = 0; i < this.reservedPorts.length; i++) {
        if (this.reservedPorts[i] > this.start && this.reservedPorts[i] < this.end) {
            return true;
        }
    }

    return false;
};

/**
 * Checks if range start port is reserved.
 *
 * @returns {boolean} true if range start port is reserved otherwise false.
 */
PortRangeValidator.prototype.isStartPortRestricted = function() {
    return this.reservedPorts.indexOf(this.start) !== -1;
};

/**
 * Checks if range end port is reserved.
 *
 * @returns {boolean} true if range end port is reserved otherwise false.
 */
PortRangeValidator.prototype.isEndPortRestricted = function() {
    return this.reservedPorts.indexOf(this.end) !== -1;
};

/**
 * Returns reserved ports as comman-seperated string
 *
 * @returns {string} true if range end port is reserved otherwise false.
 */
PortRangeValidator.prototype.getRestrictedPortsString = function() {
    return this.reservedPorts.join(',');
};
