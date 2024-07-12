var colorFail = "#cc0022";
var RSSI_THRESHOLD = -60; // < is a fail, >= is a pass.
var UNKNOWN = "unknown";
var DISABLED = "disabled";
var REQUEST_TIMEOUT = 10000;
var ethernetTest;   // Destination for ethernet ping test.
var loading; // Loading circle instance
var isTroubleshoot = false;
var loggedOut = false;

var diagnosticStates = {
    checkTunerTemperature: {
        enter: diagnosticWizardCheckTunerTemperatureEntry,
        exit: diagnosticWizardCheckTunerTemperatureExit,
        timeout: function() {},
        appendLog: diagnosticWizardCheckTunerTemperatureComments,
        okay: false,
        percentage: 10
    },
    checkCablemodem: {
        enter: diagnosticWizardCheckCablemodemEntry,
        exit: diagnosticWizardCheckCablemodemExit,
        timeout: diagnosticWizardCheckCablemodemTimeout,
        appendLog: diagnosticWizardCheckCablemodemComments,
        okay: false,
        percentage: 20
    },
    checkProvisioningMode: {
        enter: diagnosticWizardCheckProvisioningModeEntry,
        exit: diagnosticWizardCheckProvisioningModeExit,
        timeout: diagnosticWizardCheckProvisioningModeTimeout,
        appendLog: diagnosticWizardCheckProvisioningModeComments,
        ipv4AddressValid: false,
        ipv6AddressValid: false,
        percentage: 30
    },
    checkBroadbandPing: {
        enter: diagnosticWizardCheckBroadbandPingEntry,
        exit: diagnosticWizardCheckBroadbandPingExit,
        timeout: diagnosticWizardCheckBroadbandPingTimeout,
        appendLog: diagnosticWizardCheckBroadbandPingComments,
        pingJobId: -1, // Store any current running Ping IDs.
        okay: false,
        percentage: 40
    },
    checkTelephony: {
        enter: diagnosticWizardCheckTelephonyEntry,
        exit: diagnosticWizardCheckTelephonyExit,
        timeout: diagnosticWizardCheckTelephonyTimeout,
        appendLog: diagnosticWizardCheckTelephonyComments,
        status: UNKNOWN,
        percentage: 60
    },
    checkWired: {
        enter: diagnosticWizardCheckWiredEntry,
        exit: diagnosticWizardCheckWiredExit,
        timeout: diagnosticWizardCheckWiredTimeout,
        appendLog: diagnosticWizardCheckWiredComments,
        okay: false,
        percentage: 60
    },
    checkWireless2g: {
        enter: diagnosticWizardCheckWireless2gEntry,
        exit: diagnosticWizardCheckWireless2gExit,
        timeout: diagnosticWizardCheckWireless2gTimeout,
        appendLog: diagnosticWizardCheckWireless2gComments,
        okay: false,
        percentage: 80
    },
    checkWireless5g: {
        enter: diagnosticWizardCheckWireless5gEntry,
        exit: diagnosticWizardCheckWireless5gExit,
        timeout: diagnosticWizardCheckWireless5gTimeout,
        appendLog: diagnosticWizardCheckWireless5gComments,
        okay: false,
        percentage: 90
    },
    checkWirelessClients: {
        enter: diagnosticWizardCheckWirelessClientsEntry,
        exit: diagnosticWizardCheckWirelessClientsExit,
        timeout: diagnosticWizardCheckWirelessClientsTimeout,
        appendLog: diagnosticWizardCheckWirelessClientsComments,
        okay: false,
        hostList: [],
        percentage: 95
    },
    idle: {
        enter: $.noop,
        exit: $.noop,
        timeout: $.noop,
        appendLog: $.noop,
        status: UNKNOWN,
        percentage: 0
    },
    complete: {
        enter: $.noop,
        exit: $.noop,
        timeout: $.noop,
        appendLog: $.noop,
        status: UNKNOWN,
        percentage: 0
    }
};

var currentState = diagnosticStates.idle; // State of machine.

/**
 * Instantiated when debug required
 *
 * @param {string} output string to be output
 */
function diagnosticWizardConsole(output) {
}

/**
 * Restarts the test sequence state machine
 **/
function diagnosticWizardStateMachineInitialise() {
    diagnosticWizardConsole("stateMachineInitialise");
    // Reset the font size, this may have been reduced to fit the
    // text inside the circle, depending on the language translation
    loading.getCircleText().css('font-size', '42px');
    loading.setEndColor(Loading.DEFAULT_END_COLOR);

    var stateKeys = Object.keys(diagnosticStates);
    for (var idx = 0; idx < stateKeys.length; idx++) {
        var key = stateKeys[idx];
        if (diagnosticStates[key].status != undefined) {
            diagnosticStates[key].status = UNKNOWN;
        }
        if (diagnosticStates[key].okay != undefined) {
            diagnosticStates[key].okay = false;
        }
    }

    currentState = diagnosticStates.checkTunerTemperature;
    diagnosticWizardShowDiagnosticProgress(currentState.percentage, true);
    currentState.enter(currentState);
}

/**
 * Called when response received from back-end to drive
 * state machine forward.
 *
 * @param {Object} data partially processed data from back-end
 */
function diagnosticWizardStateMachineExit(data) {

    diagnosticWizardConsole("stateMachineExit");

    if (currentState != diagnosticStates.idle && currentState != diagnosticStates.complete) {
        currentState = currentState.exit(currentState, data);

        if (currentState == diagnosticStates.complete) {
            diagnosticWizardDisplayResults(true);
        }

        if (currentState != diagnosticStates.idle &&
            currentState != diagnosticStates.complete) {
            diagnosticWizardShowDiagnosticProgress(currentState.percentage, true);

            currentState.enter(currentState);
        }
    } else {
        loading.enableButton(true);
    }
}

/**
 * Callback used for timeouts on responses from back-end
 **/
function diagnosticWizardStateMachineTimeout() {

    diagnosticWizardConsole("stateMachineTimeout");

    if (currentState != diagnosticStates.idle && currentState != diagnosticStates.complete) {

        if (typeof currentState.timeout == "function") {
            currentState = currentState.timeout(currentState);

            if (currentState == diagnosticStates.complete) {
                diagnosticWizardDisplayResults(true);
            }

            if (currentState != diagnosticStates.idle &&
                currentState != diagnosticStates.complete) {
                diagnosticWizardShowDiagnosticProgress(currentState.percentage, true);
                currentState.enter(currentState);
            }
        }
    }
}

/**
 * Send request to get the box temperature
 *
 * @param {Object} self diagnostic state object
 */
function diagnosticWizardCheckTunerTemperatureEntry(self) {
    diagnosticWizardConsole("checkTunerTemperatureEntry");
    diagnosticWizardStateMachineExit(true);
}

/**
 * Called when temperature data has been returned.
 *
 * @param {Object} self diagnostic state object
 * @param {boolean} data partially processed data from back-end
 * @returns {Object} the next state
 */
function diagnosticWizardCheckTunerTemperatureExit(self, data) {
    diagnosticWizardConsole("checkTunerTemperatureExit");
    self.okay = data;
    return diagnosticStates.checkCablemodem;
}

/**
 * Add relevant comments to check list re:temperature test
 *
 * @param {Object} self diagnostic state object
 * @param {number} row which row can be used for text
 */
function diagnosticWizardCheckTunerTemperatureComments(self, row) {
    diagnosticWizardConsole("checkTunerTemperatureComments");

    // Fill in the detailed lines
    if (self.okay) {
        diagnosticWizardAddCheckRow(row, 'c_lo13'); // temperature normal
    } else {
        diagnosticWizardAddCheckRow(row, 'c_lo12'); // temperature too high, check it is upright etc.
    }
    row = row + 1;
    return row;
}

/**
 * Send request to get the status of cablemodem
 *
 * @param {Object} self diagnostic state object
 */
function diagnosticWizardCheckCablemodemEntry(self) {

    diagnosticWizardConsole("checkCablemodemEntry");

    var uri = REST_URI_V1_PATH + '/cablemodem/state_';
    showDiagnosticStatus("#diagnostic-check-broadband-step");

    // Read in the cable modem status data
    restGet(uri, function(data) {
        diagnosticWizardStateMachineExit(data);
    }, null, null, { timeout: diagnosticWizardStateMachineTimeout }, null, REQUEST_TIMEOUT);
}

/**
 * Called when cablemodem back-end request times out.
 *
 * @param {Object} self diagnostic state object
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckCablemodemTimeout(self) {

    diagnosticWizardConsole("checkCablemodemTimeout");
    self.okay = false;
    setBroadbandStatus('error');
    return diagnosticStates.checkWired;
}

/**
 * Called when cablemodem data has been returned.
 *
 * @param {Object} self diagnostic state object
 * @param {Object} data partially processed data from back-end
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckCablemodemExit(self, data) {

    diagnosticWizardConsole("checkCablemodemExit");

    // TODO: Resolve back-end issue which results in invalid
    // data being returned.
    if (data == undefined || data.cablemodem == undefined) {
        diagnosticWizardConsole("undefined cm data");
        self.okay = false;
        setBroadbandStatus('error');
        return diagnosticStates.checkWired;
    }

    diagnosticWizardConsole("cablemodem.status " + data.cablemodem.status);

    if (data.cablemodem.status == "operational") {
        self.okay = true;
        return diagnosticStates.checkProvisioningMode;
    } else {
        self.okay = false;
        setBroadbandStatus('error');
        return diagnosticStates.checkWired;
    }
}

/**
 * Add relevant comments to check list re:cablemodem test
 *
 * @param {Object} self diagnostic state object
 * @param {number} row which row can be used for text
 */
function diagnosticWizardCheckCablemodemComments(self, row) {
    diagnosticWizardConsole("checkCablemodemComments");
    if (self.okay) {
        diagnosticWizardAddCheckRow(row, 'c_lo14'); // broadband is up
    } else {
        diagnosticWizardAddCheckRow(row, 'c_lo20'); // broadband is down, please check coax
    }
    row = row + 1;
    return row;
}

/**
 * Send request to get the provisioning information.
 *
 * @param {Object} self diagnostic state object
 */
function diagnosticWizardCheckProvisioningModeEntry(self) {
    diagnosticWizardConsole("checkProvisioningModeEntry");

    var uri = REST_URI_V1_PATH + '/system/gateway/provisioning';
    restGet(uri, function(data) {
        diagnosticWizardConsole(data.provisioning.mode);

        if (data.provisioning.ipv4) {
            diagnosticWizardConsole(data.provisioning.ipv4.address);
            self.ipv4AddressValid = isValidIPv4Address(data.provisioning.ipv4.address);
        }
        if (data.provisioning.ipv6) {
            diagnosticWizardConsole(data.provisioning.ipv6.globalAddress);
            self.ipv6AddressValid = isValidIPv6Address(data.provisioning.ipv6.globalAddress);
        }

        diagnosticWizardStateMachineExit();
    }, null, null, { timeout: diagnosticWizardStateMachineTimeout }, null, REQUEST_TIMEOUT);
}

/**
 * Called when provisioning back-end request times out.
 *
 * @param {Object} self diagnostic state object
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckProvisioningModeTimeout(self) {
    diagnosticWizardConsole("checkProvisioningModeTimeout");
    self.okay = false;
    setBroadbandStatus('error');
    return diagnosticStates.checkWired;
}

/**
 * Called when provisioning information data has been returned.
 *
 * If there is a valid IP address for use in the applicable provisioning mode
 * then next state is a ping check, otherwise next state is a local wired check.
 *
 * @param {Object} self diagnostic state object
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckProvisioningModeExit(self) {

    diagnosticWizardConsole("checkProvisioningModeExit");

    // Can we do a ping test?
    if ( (provisioningSupportsIPv6() && self.ipv6AddressValid) ||
         (provisioningSupportsIPv4() && self.ipv4AddressValid) ) {
        return diagnosticStates.checkBroadbandPing;
    } else {
        setBroadbandStatus('error');
        return diagnosticStates.checkWired;
    }
}

/**
 * Add relevant comments to check list re:provisioning information
 *
 * @param {Object} self diagnostic state object
 * @param {number} row which row can be used for text
 */
function diagnosticWizardCheckProvisioningModeComments(self, row) {

    diagnosticWizardConsole("checkProvisioningModeComments");

    if (provisioningSupportsDualstack()) {
        if (self.ipv6AddressValid && self.ipv4AddressValid) {
            diagnosticWizardAddCheckRow(row, 'c_lo17'); // IPv4/IPv6 address valid
            row = row + 1;
        } else if (self.ipv6AddressValid && !self.ipv4AddressValid) {
            diagnosticWizardAddCheckRow(row, 'c_lo15'); // IPv6 address valid
            row = row + 1;
            diagnosticWizardAddCheckRow(row, 'c_lo18'); // IPv4 address not valid
            row = row + 1;
        } else if (!self.ipv6AddressValid && self.ipv4AddressValid) {
            diagnosticWizardAddCheckRow(row, 'c_lo16'); // IPv4 address valid
            row = row + 1;
            diagnosticWizardAddCheckRow(row, 'c_lo19'); // IPv6 address not valid
            row = row + 1;
        } else {
            diagnosticWizardAddCheckRow(row, 'c_lo18'); // IPv4 address not valid
            row = row + 1;
            diagnosticWizardAddCheckRow(row, 'c_lo19'); // IPv6 address not valid
            row = row + 1;
        }
    } else if (provisioningSupportsIPv4Only()) {
        if (self.ipv4AddressValid) {
            diagnosticWizardAddCheckRow(row, 'c_lo16'); // IPv4 address valid
            row = row + 1;
        } else {
            diagnosticWizardAddCheckRow(row, 'c_lo18'); // IPv4 address not valid
            row = row + 1;
        }
    } else if (provisioningSupportsIPv6Only()) {
        if (self.ipv6AddressValid) {
            diagnosticWizardAddCheckRow(row, 'c_lo15'); // IPv6 address valid
            row = row + 1;
        } else {
            diagnosticWizardAddCheckRow(row, 'c_lo19'); // IPv6 address not valid
            row = row + 1;
        }
    }
    return row;
}

/**
 * Send request to do a ping over Broadband
 *
 * @param {Object} self diagnostic state object
 */
function diagnosticWizardCheckBroadbandPingEntry(self) {

    diagnosticWizardConsole("checkBroadbandPingEntry");
    self.okay = true;

    // Clear up any zombie pings
    diagnosticsPingCleanup(function() {

        // Prioritise ipv6 in dualstack but must have valid ipv6 addrees on erouter0.
        var targetUri;
        if (provisioningSupportsIPv6() && diagnosticStates.checkProvisioningMode.ipv6AddressValid) {
            targetUri = "ipv6.google.com";
        } else {
            targetUri = "www.google.com";
        }

        if (self.okay) {
            diagnosticsPingStart(targetUri, function (id, state, results) {
                // Ensure job is cancelled
                if (self.pingJobId != -1) {
                    self.pingJobId = -1;
                    diagnosticsPingCancel(id, function () {
                        if (state != 'complete' || results.failureCount > 2) {
                            diagnosticWizardConsole("ping failed ");
                            diagnosticWizardStateMachineExit(false);
                        } else {
                            diagnosticWizardStateMachineExit(true);
                        }
                    });
                }
            }, function (id) {
                // Start callback, store id
                if (self.okay) {
                    self.pingJobId = id;
                } else {
                    // we've aborted
                    diagnosticsPingCancel(id, diagnosticWizardStateMachineExit);
                }
            }, "wan0");
        } else {
            diagnosticWizardStateMachineExit();
        }
    });
}

/**
 * Called when broadband ping request times out.
 *
 * @param {Object} self diagnostic state object

 * @returns {Object} the next state
 */
 function diagnosticWizardCheckBroadbandPingTimeout(self) {

    diagnosticWizardConsole("checkBroadbandPingTimeout");

    if (self.pingJobId != -1) {
        diagnosticsPingCancel(self.pingJobId, diagnosticWizardStateMachineExit);
        self.pingJobId = -1;
    }

    self.okay = false;
    setBroadbandStatus('error');
    return diagnosticStates.checkWired;
}

/**
 * Called when broadband ping has completed.
 *
 * @param {Object} self diagnostic state object
 * @param {boolean} data partially processed data from back-end
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckBroadbandPingExit(self, data) {

    diagnosticWizardConsole("checkBroadbandPingExit");

    self.okay = data;
    if (self.okay) {
        setBroadbandStatus('success');
        return diagnosticStates.checkTelephony;
    } else {
        setBroadbandStatus('error');
        return diagnosticStates.checkWired;
    }
}

/**
 * Add relevant comments to check list re:broadband ping
 *
 * @param {Object} self diagnostic state object
 * @param {number} row which row can be used for text
 */
function diagnosticWizardCheckBroadbandPingComments(self, row) {

    diagnosticWizardConsole("checkBroadbandPingComments");

    if (self.okay) {
        diagnosticWizardAddCheckRow(row, 'c_lo21'); // broadband is ready
    } else {
        diagnosticWizardAddCheckRow(row, 'c_lo22'); // broadband is down
    }
    row = row + 1;
    return row;
}

/**
 * Send request to back-end to get telephone information.
 *
 * @param {Object} self diagnostic state object
 */
function diagnosticWizardCheckTelephonyEntry(self) {

    diagnosticWizardConsole("checkTelephonyEntry");
    var uri = REST_URI_V1_PATH + '/mta/lines';

    // Read in the provisioning data
    restGet(uri, function(data) {
        diagnosticWizardStateMachineExit(data.lines);
    }, null, null, { timeout: diagnosticWizardStateMachineTimeout }, null, REQUEST_TIMEOUT);
}

/**
 * Called when telephone information request times out.
 *
 * @param {Object} self diagnostic state object
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckTelephonyTimeout(self) {

    diagnosticWizardConsole("checkTelephonyTimeout");
    showDiagnosticStatus('#diagnostic-check-telephone-step');
    self.status = "failed";
    setTelephonyStatus('error');
    return diagnosticStates.checkWired;
}

/**
 * Called when telephone information is returned
 *
 * @param {Object} self diagnostic state object
 * @param {Array} data partially processed data from back-end
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckTelephonyExit(self, data) {

    diagnosticWizardConsole("checkTelephonyExit");

    var hasEnabledLines = false;
    var allLinesOperational = true;
    var unoperationalLines = [];

    // If no lines, assume disabled/success.
    if (data.length) {
        for (var i = 0; i < data.length; i++) {
            var element = data[i];
            if (element.line.enable) {
                hasEnabledLines = true;
                if (!element.line.operational) {
                    allLinesOperational = false;
                    unoperationalLines.push(element.id);
                }
            }
        }
    }

    if (!hasEnabledLines) {
        // no lines enabled, voice service considered disabled
        self.status = DISABLED;
    } else if (!allLinesOperational) {
        showDiagnosticStatus('#diagnostic-check-telephone-step');
        self.status = unoperationalLines;
        setTelephonyStatus('error');
    } else {
        // all good, no need to set status
        showDiagnosticStatus('#diagnostic-check-telephone-step');
        setTelephonyStatus('success');
    }

    return diagnosticStates.checkWired;
}

/**
 * Add relevant comments to check list re:telephone information
 *
 * @param {Object} self diagnostic state object
 * @param {number} row Checklist row index
 */
function diagnosticWizardCheckTelephonyComments(self, row) {

    diagnosticWizardConsole("checkTelephonyComments");
    diagnosticWizardConsole("line status: " + self.status);

    if (self.status === DISABLED) {
        diagnosticWizardAddCheckRow(row, 'c_dn18'); // no voice service
        return ++row;
    }

    if (Array.isArray(self.status)) {
        for (var i = 0; i < self.status.length; i++) {
            var lineNo = self.status[i];
            diagnosticWizardAddCheckRow(row, { code: 'c_dn16', data: { index: lineNo } }); // telephony line <n> not ready
            row++;
        }
    }

    return row;
}

/**
 * Send request to do ethernet ping
 *
 * @param {Object} self diagnostic state object
 */
function diagnosticWizardCheckWiredEntry(self) {
    // Maximum allowed test duration
    var maximumTestDuration = 30000;
    // Check connected devices every 2 seconds
    var stepInterval = 2000;
    // Max reconnections allowed
    var reconnectionsAllowed = 3;

    diagnosticWizardConsole("checkWiredEntry");
    showDiagnosticStatus('#diagnostic-check-ethernet-step');

    self.lowSpeed = false;
    self.noLink = false;
    self.okay = true;

    var maxDurationReached = false;

    var uri = REST_URI_V1_PATH + "/network/hosts_?connectedOnly=true&interface=ethernet";

    restGet(uri, function(data) {
        var hostsAmount = data.hosts.hosts.length;
        var reconnections = 0;

        // Monitor for flip flopping for 30 seconds
        setTimeout(function () {
            maxDurationReached = true;
        }, maximumTestDuration);

        var finish = function () {
            diagnosticWizardStateMachineExit(data.hosts.hosts);
        };

        // check amount of connected devices every 2 seconds over 30 seconds duration
        // set 'noLink' if it varies 3 times during test time
        var pollWiredHosts = function() {
            if (self.okay) {
                if (maxDurationReached) {
                    finish();
                } else {
                    restGet(uri, function(data_) {
                        if (self.okay) {
                            var updatedHostsAmount = data_.hosts.hosts.length;
                            if (updatedHostsAmount != hostsAmount) {
                                reconnections++;
                            }
                            hostsAmount = updatedHostsAmount;

                            if (reconnections > reconnectionsAllowed) {
                                self.noLink = true;
                                // no need to continue
                                finish();
                            } else if (maxDurationReached) {
                                // out of time
                                finish();
                            } else {
                                setTimeout(pollWiredHosts, stepInterval);
                            }
                        } else {
                            finish();
                        }
                    }, null, null, { timeout: diagnosticWizardStateMachineTimeout }, null, REQUEST_TIMEOUT);
                }
            } else {
                finish();
            }
        };

        setTimeout(pollWiredHosts, stepInterval);

    }, null, null, { timeout: diagnosticWizardStateMachineTimeout }, null, REQUEST_TIMEOUT);
}

/**
 * Called when ethernet ping times out.
 *
 * @param {Object} self diagnostic state object
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckWiredTimeout(self) {
    diagnosticWizardConsole("checkWiredTimeout");
    self.okay = false;
    setEthernetStatus('error');
    return diagnosticStates.checkWireless2g;
}

/**
 * Called when ethernet ping completes.
 *
 * @param {Object} self diagnostic state object
 * @param {Array} data list of hosts
 * @returns {Object} the next state
 */
function diagnosticWizardCheckWiredExit(self, hosts) {
    var failure = function () {
        setEthernetStatus('error');
        self.okay = false;
        return diagnosticStates.checkWireless2g;
    };

    var success = function () {
        setEthernetStatus('success');
        self.okay = true;
        return diagnosticStates.checkWireless2g;
    };

    for (var i in hosts) {
        if (hosts[i] == undefined ||
            hosts[i].config == undefined) {
                return failure();
            }
        if (hosts[i].config.speed < 1000) {
            self.lowSpeed = true;
            break;
        }
    }

    if (self.lowSpeed || self.noLink) {
        return failure();
    }

    return success();
}

/**
 * Add relevant comments to check list re:ethernet ping
 *
 * @param {Object} self diagnostic state object
 * @param {number} row which row can be used for text
 */
function diagnosticWizardCheckWiredComments(self, row) {
    diagnosticWizardConsole("checkWiredComments");
    if (!self.okay) {
        if (self.lowSpeed) {
            diagnosticWizardAddCheckRow(row, 'c_lo24');
            row = row + 1;
        }
        if (self.noLink) {
            diagnosticWizardAddCheckRow(row, 'c_lo23');
            row = row + 1;
        }
    }
    return row;
}

/**
 * Send request to back-end to get 2.4g wifi information.
 *
 * @param {Object} self diagnostic state object
 */
function diagnosticWizardCheckWireless2gEntry(self) {

    diagnosticWizardConsole("checkWireless2gEntry");
    showDiagnosticStatus('#diagnostic-check-wireless-step');

    // Read in the provisioning data
    restGet(REST_URI_V1_PATH + "/wifi/band2g/state_", function(data) {
        diagnosticWizardStateMachineExit(data.state);
    });
}

/**
 * Called when 2.4g information request times out.
 *
 * @param {Object} self diagnostic state object
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckWireless2gTimeout(self) {
    diagnosticWizardConsole("checkWireless2gTimeout");
    self.okay = false;
    return diagnosticStates.checkWireless5g;
}

/**
 * Called when 2.4g information is returned from back end.
 *
 * @param {Object} self diagnostic state object
 * @param {boolean} data partially processed data from back-end
 * @returns {Object} the next state
 */
function diagnosticWizardCheckWireless2gExit(self, data) {

    diagnosticWizardConsole("checkWireless2gExit");

    self.okay = (data.enable === true);
    return diagnosticStates.checkWireless5g;
}

/**
 * Add relevant comments to check list re:2.4g wifi
 *
 * @param {Object} self diagnostic state object
 * @param {number} row which row can be used for text
 */
function diagnosticWizardCheckWireless2gComments(self, row) {

    diagnosticWizardConsole("checkWireless2gComments " + self.okay);

    if (!self.okay) {
        diagnosticWizardAddCheckRow(row, 'c_dn05'); // primary wifi 2.4G is disabled
        row = row + 1;
    }
    return row;
}

/**
 * Send request to back-end to get 5g wifi information.
 *
 * @param {Object} self diagnostic state object
 */
function diagnosticWizardCheckWireless5gEntry(self) {
    diagnosticWizardConsole("checkWireless5gEntry");

    // Read in the provisioning data
    restGet(REST_URI_V1_PATH + "/wifi/band5g/state_", function(data) {
        diagnosticWizardStateMachineExit(data.state);
    });
}

/**
 * Called when 5g information request times out.
 *
 * @param {Object} self diagnostic state object
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckWireless5gTimeout(self) {

    diagnosticWizardConsole("checkWireless5gTimeout");

    self.okay = false;
    if (diagnosticStates.checkWireless2g.okay) {
        return diagnosticStates.checkWirelessClients;
    } else {
        // Wifi disabled so no point checking wireless clients.
        setWirelessStatus('error');
        return diagnosticStates.complete;
    }
}

/**
 * Called when 5g information is returned from back end.
 *
 * @param {Object} self diagnostic state object
 * @param {boolean} data partially processed data from back-end
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckWireless5gExit(self, data) {

    diagnosticWizardConsole("checkWireless5gExit");

    self.okay = (data.enable === true);

    if (self.okay || diagnosticStates.checkWireless2g.okay) {
        return diagnosticStates.checkWirelessClients;
    } else {
        // Wifi disabled so no point checking wireless clients.
        setWirelessStatus('error');
        return diagnosticStates.complete;
    }

}

/**
 * Add relevant comments to check list re:5g wifi
 *
 * @param {Object} self diagnostic state object
 * @param {number} row which row can be used for text
 */
function diagnosticWizardCheckWireless5gComments(self, row) {

    diagnosticWizardConsole("checkWireless5gComments " + self.okay);

    if (!self.okay) {
        diagnosticWizardAddCheckRow(row, 'c_dn19'); // primary wifi 5G is disabled
        row = row + 1;
    }
    return row;
}

/**
 * Send request to back-end to get information on connected wifi clients (if any).
 *
 * @param {Object} self diagnostic state object
 */
 function diagnosticWizardCheckWirelessClientsEntry(self) {
    diagnosticWizardConsole("checkWirelessClientsEntry");
    var uri = REST_URI_V1_PATH + '/network/hosts_?connectedOnly=true&interface=wifi';

    // Read in the connected wifi host data
    restGet(uri, function(data) {
        diagnosticWizardStateMachineExit(data.hosts.hosts);
    }, null, null, { timeout: diagnosticWizardStateMachineTimeout }, null, REQUEST_TIMEOUT);
}

/**
 * Called when wireless client information request times out.
 *
 * @param {Object} self diagnostic state object
 *
 * @returns {Object} the next state
 */
function diagnosticWizardCheckWirelessClientsTimeout(self) {
    diagnosticWizardConsole("checkWirelessClientsTimeout");
    self.okay = false;
    setWirelessStatus('error');
    return diagnosticStates.complete;
}

/**
 * Called when retrieved info on connected wifi clients.
 *
 * @param {Object} self diagnostic state object
 * @param {Array} data list of wireless clients
 *
 * @returns {Object} the next state
 */
 function diagnosticWizardCheckWirelessClientsExit(self, data) {

    self.hostList = data;

    diagnosticWizardConsole("checkWirelessClientsExit");

    if (data.length <= 0) {
        diagnosticWizardConsole("no wireless hosts found");
        self.okay = true;
        setWirelessStatus('success');
        return diagnosticStates.complete;
    }
    diagnosticWizardConsole("wireless hosts found: " + self.hostList.length);

    self.okay = true;
    for (var i in self.hostList) {
        var low;
        if (self.hostList[i].config.rssi < RSSI_THRESHOLD) {
            low = true;
            self.okay = false; // latch false on any low rssi
        } else {
            low = false;
        }
        diagnosticWizardConsole(" rssi " + self.hostList[i].config.rssi);
        diagnosticWizardConsole((low) ? " BAD" : " ok");
    }

    if (self.okay) {
        setWirelessStatus('success');
    } else {
        setWirelessStatus('error');
    }

    return diagnosticStates.complete;
}

/**
 * Add relevant comments to check list re:wifi client checks
 *
 * @param {Object} self diagnostic state object
 * @param {number} row which row can be used for text
 */
function diagnosticWizardCheckWirelessClientsComments(self, row) {
    diagnosticWizardConsole("checkWirelessClientsComments " + self.okay);
    if (!self.okay) {
        for (var i in self.hostList) {
            if (self.hostList[i].config.rssi < RSSI_THRESHOLD) {
                diagnosticWizardAddCheckRow(row, {
                    code: 'c_dn07',
                    data: { clientMac: self.hostList[i].macAddress }
                }); // device <span data-placeholder=\"clientMac\"></span> has low signal strength, please move it closer to gateway
                row = row + 1;
            }
        }
        diagnosticWizardAddCheckRow(row, 'c_dn04'); // place your WiFi device near the gateway
        row = row + 1;
    }
    return row;
}

/**
 * Add string to check list
 *
 * @param {number} row Which entry to add
 * @param {string|Object} data if string: language code,
 *      if object with `code` and `data`: language code and data to interpolate
 */
function diagnosticWizardAddCheckRow(row, data) {

    diagnosticWizardConsole("addCheckRow " + row + " " + data);

    var code = data;
    if (typeof data === 'object') {
        code = data.code;
    }

    $('.diagnostic-check-list-elements')
        .append($('<div>', {
            class: 'diagnostic-check-list-element',
            id: 'diagnostic-check-list-element-row' + row
        }));

    $('#diagnostic-check-list-element-row' + row)
        .append($('<div>', {
            class: 'diagnostic-check-list-element-number',
            text: row
        }))
        .append($('<p>', {
            class: 'langHtml diagnostic-check-list-element-text',
            id: 'diagnostic-check-text-row' + row
        }));

    setLanguageStringOfHtmlForCurrentUserAndId($("#diagnostic-check-text-row" +
        row), code, data.data);
}

/**
 * Do main icon and text displays of result
 *
 * @param {boolean} complete is the is the test complete
 */
function diagnosticWizardDisplayResults(complete) {

    diagnosticWizardConsole("display Results");

    toggleDiagnosticWizardCancelButton(false);

    if (complete) {

        diagnosticWizardConsole("checkTunerTemperature: " + diagnosticStates.checkTunerTemperature.okay);
        diagnosticWizardConsole("checkCablemodem: " + diagnosticStates.checkCablemodem.okay);
        diagnosticWizardConsole("checkProvisioningMode: " + globalSettings.gateway.provisioning.mode);
        diagnosticWizardConsole("checkBroadbandPing: " + diagnosticStates.checkBroadbandPing.okay);
        diagnosticWizardConsole("checkTelephony: " + diagnosticStates.checkTelephony.status);
        diagnosticWizardConsole("checkWired: " + diagnosticStates.checkWired.okay);
        diagnosticWizardConsole("checkWireless2g: " + diagnosticStates.checkWireless2g.okay);
        diagnosticWizardConsole("checkWireless5g: " + diagnosticStates.checkWireless5g.okay);
        diagnosticWizardConsole("checkWirelessClients: " + diagnosticStates.checkWirelessClients.okay);

        if (!diagnosticStates.checkTunerTemperature.okay ||
            !diagnosticStates.checkCablemodem.okay ||
            (!provisioningSupportsIPv4() && !provisioningSupportsIPv6()) ||
            !diagnosticStates.checkBroadbandPing.okay ||
            diagnosticStates.checkTelephony.status == "failed" ||
            !diagnosticStates.checkWired.okay ||
            !diagnosticStates.checkWireless2g.okay ||
            !diagnosticStates.checkWireless5g.okay ||
            !diagnosticStates.checkWirelessClients.okay) {

            diagnosticWizardShowDiagnosticProgress(100, false);
            $("#diagnostic-error-icon").show();
            var failureMessage = isTroubleshoot ? 'c_lo25' : 'c_dn06';
            $("#diagnostic-running-text").html(getLanguageStringForCurrentUserAndId(failureMessage))
                                        .attr('data-lang-id', failureMessage)
                                        .css("color", "#cc0022");
            $("#diagnostic-running").show();
        } else {
            diagnosticWizardShowDiagnosticProgress(100, true);
            if (!isTroubleshoot) {
                $("#diagnostic-running-text").html(getLanguageStringForCurrentUserAndId('c_dn02'))  // Your Broadband connection is working.
                .attr('data-lang-id', 'c_dn02')
                .css("color", "#11aa44");
                $("#diagnostic-running-text-2").hide();
            } else {
                $("#diagnostic-running-text").html(getLanguageStringForCurrentUserAndId('c_lo10'))  // The problem is fixed.
                .attr('data-lang-id', 'c_dn02')
                .css("color", "#11aa44");
                $("#diagnostic-running-text-2").html(getLanguageStringForCurrentUserAndId('c_lo11'))  // Enjoy your super fast broadband.
                .attr('data-lang-id', 'c_dn02')
                .css("color", "#11aa44")
                .show();
                $(".diagnostic-wizard-explanatory-text").hide();
            }

            $("#diagnostic-running").show();
            $("#diagnostic-tick-icon").show();
        }
        $("#diagnostic-check-list-header").show();
        var displayRow = 1;
        var stateKeys = Object.keys(diagnosticStates);
        for (var idx = 0; idx < stateKeys.length; idx++) {
            var key = stateKeys[idx];
            if (key != "idle" && key != "complete") {
                if (diagnosticStates[key].appendLog != undefined) {
                    displayRow = diagnosticStates[key].appendLog(diagnosticStates[key], displayRow);
                }
            }
        }
    } else {
        diagnosticWizardShowDiagnosticProgress(0, false);
        $("#diagnostic-running").hide();
        $("#diagnostic-tick-icon").show();
    }
}

/**
 * Update progress item, indicating error or not.
 *
 * @param {number} percentage of tests complete.
 * @param {boolean} okayStatus final status of tests.
 */
function diagnosticWizardShowDiagnosticProgress(percentage, okayStatus) {
    loading.setValue(percentage);
    if (!okayStatus) {
        loading.setEndColor(colorFail);
    }
    if (percentage == 0) {
        loading.enableButton(true);
    }
}

/**
 * Sets diagnostic status UI
 *
 * @param {string} status 'error' or 'success'
 * */
function setWirelessStatus(status) {
    setDiagnosticStatus('#diagnostic-check-wireless-step', status);
}

/**
 * Sets broadband diagnostic status UI
 *
 * @param {string} status 'error' or 'success'
 * */
function setBroadbandStatus(status) {
    setDiagnosticStatus('#diagnostic-check-broadband-step', status);
}

/**
 * Sets telephony diagnostic status UI
 *
 * @param {string} status 'error' or 'success'
 * */
function setTelephonyStatus(status) {
    setDiagnosticStatus('#diagnostic-check-telephone-step', status);
}

/**
 * Sets ethernet diagnostic status UI
 *
 * @param {string} status 'error' or 'success'
 * */
function setEthernetStatus(status) {
    setDiagnosticStatus('#diagnostic-check-ethernet-step', status);
}

/**
 * Sets diagnostic status UI
 *
 * @param {string} selector selector of the diagnostic element
 * @param {string} status 'error' or 'success'
 * */
function setDiagnosticStatus(selector, status) {
    var element = $(selector);
    element.addClass(status);
    var icon = (status === 'error' ? 'error-icon.svg' : 'check-icon.svg');
    $(selector + "-icon").attr('src', '/resources/images/icons/' + icon);
    element.find('.load-text').removeAttr('data-running');
}

/**
 * Gets checklist row DOM element by index
 *
 * @param {number} index row index
 * */
function getRow(index) {
    return $("#diagnostic-check-list-element-row" + index);
}

/**
 * Show/hide cancel diagnostic button.
 *
 * @param {boolean} show show button if true
 */
function toggleDiagnosticWizardCancelButton(show) {
    // Don't toggle button in troubleshoot mode.
    if (!isTroubleshoot) {
        var actionButton = $("#cancel-diagnostics");
        actionButton.toggle(show);
    }
}

/**
 * Resets diagnostic status list to their initial state
 * */
function resetDiagnosticStates() {
    var diagnostics = ['broadband', 'telephone', 'ethernet', 'wireless'];
    for (var i = 0; i < diagnostics.length; i++) {
        var selector = '#diagnostic-check-' + diagnostics[i] + '-step';
        $(selector).hide();
        $(selector + '-icon').attr('src', '/resources/images/icons/diagnostic-progress-background.svg');
        $(selector).find('.load-text').removeAttr('data-running');
    }
}

/**
 * Shows diagnostic element
 *
 * @param {string} selector dom selector of the diagnostic element to be shown
 * */
function showDiagnosticStatus(selector) {
    var element = $(selector);
    element.fadeIn(DEFAULT_FADE_TIME_MS);
    textAnimate(element);
}

/**
 * Animates text ellipsis for a given diagnostic element
 *
 * @param {Object} element jquery dom of the diagnostic element
 * */
function textAnimate(element) {
    var label = element.find('.load-text');
    label.attr('data-running', true);
    var anim = function () {
        if (!label.attr('data-running')) {
            return label.text('');
        }
        if (label.text() && label.text().length >= 3) {
            label.text('');
        } else {
            label.text(label.text() + '.');
        }

        setTimeout(requestAnimationFrame.bind(this, anim), 500);
    };
    requestAnimationFrame(anim);
}

/**
 * Restart diagnostics
 *
 * Reset all diagnostic elements to their initial state
 * and initialize state machine.
 **/
function restart() {
    toggleDiagnosticWizardCancelButton(true);
    if (!isTroubleshoot) {
        var text = $("#diagnostic-running-text");
        text.html(getLanguageStringForCurrentUserAndId('c_dn01'));
        text.attr('data-lang-id', 'c_dn01');
        text.css("color", "#11aa44");
        $("#diagnostic-running-text-2").hide();
    }
    $("#diagnostic-running").show();
    resetDiagnosticStates();
    $("#diagnostic-error-icon").hide();
    $("#diagnostic-tick-icon").hide();
    $("#diagnostic-check-list-header").hide();
    $(".diagnostic-check-list-element").hide();
    loading.enableButton(false);
    diagnosticWizardStateMachineInitialise();
}

/**
 * Initialises diagnostics state machine and appends to the provided jquery object
 *
 * @param {Object} element the jquery object to append to
 * @param {boolean} autoStart whether to automatically start the diagnostics run
 * @param {boolean} [loggedIn] is the user logged in for troubleshoot wizard (optional)
 */
 function initDiagnostics(element, autoStart, loggedIn) {

    // Flag only ever set by the Troubleshoot Wizard
    isTroubleshoot = typeof loggedIn != 'undefined';
    loggedOut = isTroubleshoot && !loggedIn;

    getGatewayProvisioning().then(
        element.load('/components/diagnostic-wizard/diagnostic-wizard.component.html',
            function() {
                updateLanguageContentForCurrentUserForId("#" + element.attr("id"));
                // Create new loading circle instance in current context
                loading = new Loading({
                    element: '.diagnostic-spinner',
                    idleColor: isTroubleshoot ? '#cc0022': null,
                    onClick: restart,
                    enabled: isTroubleshoot
                });

                var cancelButton = $("#cancel-diagnostics");
                var textArea = $('#diagnostic-running-text');

                // 'Cancel' button click
                cancelButton.click(function () {
                    diagnosticWizardConsole("click cancel");
                    diagnosticWizardConsole("set currentState idle");

                    currentState.timeout(currentState);
                    currentState = diagnosticStates.idle;
                    if (!isTroubleshoot) {
                        resetDiagnosticStates();
                        toggleDiagnosticWizardCancelButton(false);
                        loading.cancel();
                        setLanguageStringOfHtmlForCurrentUserAndId(textArea,
                            'c_dn00');
                    } else if (loggedOut) {
                        loadOverlay("/overlays/login.html");
                    }
                });

                // 'Close' button click
                $("#diagnostic-close-button").click(function () {
                    cancelButton.trigger( "click" );
                    indexFadeOutOverlay();
                });

                if (isTroubleshoot) {
                    textArea.attr("data-lang-id", "c_lo07").text(
                        getLanguageStringForCurrentUserAndId("c_lo07"))
                            .removeClass("success").addClass("error");
                    $(".diagnostic-wizard-explanatory-text").show();

                    if (loggedOut) {
                        cancelButton.val(getLanguageStringForCurrentUserAndId("c_50"))
                            .attr("data-lang-id", "c_50").removeClass("in-progress diagnostic-button");
                    } else {
                        cancelButton.hide();
                    }
                }

                if (autoStart) {
                    restart();
                }
            }.bind(this)
        )
    );
}
