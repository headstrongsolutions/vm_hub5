
/** The time between polling the backend when doing a ping */
var PING_POLL_TIMEOUT_MS = 2000;

/** The time between polling the backend when doing a traceroute */
var TRACEROUTE_POLL_TIMEOUT_MS = 2000;

/** Store the job id and associated timer */
var pingJobs = {};

/** Store the job id and associated timer */
var traceRouteJobs = {};

/**
 * Ping timer poll callback, do not call directly!
 *
 * @param {number} id the job id
 * @param {function} finished the ping finished callback
 */
function diagnosticsPingPoll(id, finished) {
    if (pingJobs.hasOwnProperty(id)) {
        var uri = REST_URI_V1_PATH + "/system/diagnostics/ping/job/" + id + "?stateOnly=true";
        var handle404Error = function() {
            finished(id, 'aborted');
        };
        restGet(uri, function(data) {
            if (data.hasOwnProperty('pingJob') && pingJobs.hasOwnProperty(id)) {
                var state = data.pingJob.state;
                switch (state) {
                    // Ping is still running
                    case 'requested':
                        // Reschedule another poll
                        pingJobs[id] = setTimeout(
                            diagnosticsPingPoll, PING_POLL_TIMEOUT_MS, id, finished);
                        break;
                    // Ping terminated successfully
                    case 'complete':
                        // Get the full results
                        uri = REST_URI_V1_PATH + "/system/diagnostics/ping/job/" + id;
                        restGet(uri, function(data) {
                            if (data.hasOwnProperty('pingJob') &&
                                data.pingJob.hasOwnProperty('results') &&
                                pingJobs.hasOwnProperty(id)) {
                                    finished(id, state, data.pingJob.results);
                            }
                        }, null, null, { 404: handle404Error });
                        break;
                    // Ping terminated with an error
                    default:
                        finished(id, state);
                        break;
                }
            }
        }, null, null,
        {404: handle404Error});
    }
}

/**
 * Starts a ping job
 *
 * This method starts a ping job. 'host' is the host name or IP address.
 * When ping completes the 'finished' callback is called with the
 * following arguments:
 *
 * - the job id
 * - the state of the job
 * - the results (if the state is 'complete')
 *
 * The 'started' is an optional callback which is called when the
 * ping job first starts. It returns the job id for the ping.
 *
 * The 'iface' parameter is an optional parameter which specified the
 * interface to ping from. The 'numberOfPings' parameter is an optional
 * parameter that indicates the number of pings to send. And the 'dataBlockSize'
 * parameter is an optional parameter that indicates the size of the data
 * to send in each ping.
 *
 * @param {string} host the host name or ip
 * @param {function} finished the status callback
 * @param {function} [started] the ping started callback (optional)
 * @param {string} [iface] the interface to use (optional)
 * @param {number} [numberOfPings] number of pings (optional)
 * @param {number} [dataBlockSize] the ping payload size in bytes (optional)
 */
function diagnosticsPingStart(host, finished, started, iface, numberOfPings, dataBlockSize) {
    var uri = REST_URI_V1_PATH + "/system/diagnostics/ping/jobs";

    var parameters = {
        host: host
    };

    if (typeof iface != 'undefined' && iface != null) {
        parameters.interface = iface;
    }

    if (typeof numberOfPings != 'undefined' && numberOfPings != null) {
        parameters.numberOfPings = parseInt(numberOfPings);
    }

    if (typeof dataBlockSize != 'undefined' && dataBlockSize != null) {
        parameters.dataBlockSize = parseInt(dataBlockSize);
    }

    var requestData = {
        pingJob: {
            parameters: parameters
        }
    };

    restPost(uri, requestData, function(data) {
        if (data.hasOwnProperty('created') && data.created.hasOwnProperty('id')) {
            var id = data.created.id;

            pingJobs[id] = setTimeout(diagnosticsPingPoll, PING_POLL_TIMEOUT_MS, id, finished);

            if (typeof started != 'undefined' && started != null) {
                started(id);
            }
        }
    }, null, null, {
        400: function() {
            finished(null, 'error_hostname', null);
        }
    });
}

/**
 * Cancels and cleans up an outstanding ping job
 *
 * @param {number} id the job id
 * @param {function} callback to call when cleaned up
 */
function diagnosticsPingCancel(id, callback) {
    if (pingJobs.hasOwnProperty(id)) {
        // Stop interval timer repeating
        clearTimeout(pingJobs[id]);

        var onComplete = function() {
            delete pingJobs[id];
            if (typeof callback == 'function') {
                callback();
            }
        };

        var uri = REST_URI_V1_PATH + "/system/diagnostics/ping/job/" + id;
        restDelete(uri, onComplete, null, null, { 404: onComplete });
    } else if (typeof callback == 'function') {
        callback();
    }
}

/**
 * Cleans up any outstanding ping jobs
 *
 * @param {function} callback to call when cleaned up
 */
function diagnosticsPingCleanup(callback) {
    var uri = REST_URI_V1_PATH + "/system/diagnostics/ping/jobs?stateOnly=true";
    restGet(uri, function(data) {
        if (data.hasOwnProperty('jobs') && data.jobs.hasOwnProperty('pingJobs')) {
            var pingJobs = data.jobs.pingJobs;
            var numJobsToDelete = data.jobs.pingJobs.length;
            var numJobsDeleted = 0;
            var deletionCallback = function() {
                numJobsDeleted++;
                if (numJobsDeleted == numJobsToDelete &&
                    typeof callback == 'function') {
                    callback();
                }
            };

            if (numJobsToDelete > 0) {
                for(var key in pingJobs) {
                    uri = REST_URI_V1_PATH + "/system/diagnostics/ping/job/" + pingJobs[key].id;
                    restDelete(uri, deletionCallback, null, null, { 404: deletionCallback });
                }
            } else if (typeof callback == 'function') {
                callback();
            }
        }
    });
}

/**
 * Traceroute timer poll callback, do not call directly!
 *
 * @param {number} id the job id
 * @param {function} finished the traceroute finished callback
 */
function diagnosticsTraceRoutePoll(id, finished) {
    if (traceRouteJobs.hasOwnProperty(id)) {
        var uri = REST_URI_V1_PATH + "/system/diagnostics/traceroute/job/" + id + "?stateOnly=true";
        authRestGet(uri, function(data) {
            if (data.hasOwnProperty('traceRouteJob')) {
                var state = data.traceRouteJob.state;
                switch (state) {
                    // Traceroute is still running
                    case 'requested':
                        // Reschedule another poll
                        traceRouteJobs[id] = setTimeout(
                            diagnosticsTraceRoutePoll, TRACEROUTE_POLL_TIMEOUT_MS, id, finished);
                        break;
                    // Traceroute terminated successfully
                    case 'complete':
                        // Get the full results
                        uri = REST_URI_V1_PATH + "/system/diagnostics/traceroute/job/" + id;
                        authRestGet(uri, function(data) {
                            if (data.hasOwnProperty('traceRouteJob') &&
                                data.traceRouteJob.hasOwnProperty('results')) {
                                    finished(id, state, data.traceRouteJob.results);
                            }
                        });
                        break;
                    // Traceroute terminated with an error
                    default:
                        finished(id, state);
                        break;
                }
            }
        });
    }
}

/**
 * Starts a traceroute job
 *
 * This method starts a traceroute job. 'host' is the host name or IP
 * address. When traceroute completes the 'finished' callback is called
 * with the following arguments:
 *
 * - the job id
 * - the state of the job
 * - the results (if the state is 'complete')
 *
 * The 'started' is an optional callback which is called when the
 * traceroute job first starts. It returns the job id for the traceroute.
 *
 * The 'iface' parameter is an optional parameter which specified the
 * interface to traceroutes from. The 'maxHops' parameter is an optional
 * parameter that indicates the maximum number of hops to trace. And the
 * 'port' parameter is an optional parameter that indicates the port to use
 * for traceroute.
 *
 * @param {string} host the host name or ip
 * @param {function} finished the status callback
 * @param {function} started the traceroute started callback (optional)
 * @param {string} [iface] the interface to use (optional)
 * @param {number} [maxHopCount] maximum number of hops (optional)
 * @param {number} [port] the port (optional)
 */
function diagnosticsTraceRouteStart(host, finished, started, iface, maxHopCount, port) {
    var uri = REST_URI_V1_PATH + "/system/diagnostics/traceroute/jobs";

    var parameters = {
        host: host
    };

    if (typeof iface != 'undefined' && iface != null) {
        parameters.interface = iface;
    }

    if (typeof maxHopCount != 'undefined' && maxHopCount != null) {
        parameters.maxHopCount = parseInt(maxHopCount);
    }

    if (typeof port != 'undefined' && port != null) {
       parameters.port = parseInt(port);
    }

    var requestData = {
        traceRouteJob: {
            parameters: parameters
        }
    };

    authRestPost(uri, requestData, function(data) {
        if (data.hasOwnProperty('created') && data.created.hasOwnProperty('id')) {
            var id = data.created.id;

            traceRouteJobs[id] = setTimeout(diagnosticsTraceRoutePoll, TRACEROUTE_POLL_TIMEOUT_MS, id, finished);

            if (typeof started != 'undefined' && started != null) {
                started(id);
            }
        }
    }, {
        400: function() {
            finished(null, 'error_hostname', null);
        }
    });
}

/**
 * Cancels and cleans up an outstanding traceroute job
 *
 * @param {number} id the job id
 */
function diagnosticsTraceRouteCancel(id) {
    if (traceRouteJobs.hasOwnProperty(id)) {
        // Stop interval timer repeating
        clearTimeout(traceRouteJobs[id]);

        var uri = REST_URI_V1_PATH + "/system/diagnostics/traceroute/job/" + id;
        authRestDelete(uri, function() {
            delete traceRouteJobs[id];
        });
    }
}

/**
 * Cleans up any outstanding traceroute jobs
 *
 * @param {function} callback to call when cleaned up
 */
function diagnosticsTraceRouteCleanup(callback) {
    var uri = REST_URI_V1_PATH + "/system/diagnostics/traceroute/jobs?stateOnly=true";
    authRestGet(uri, function(data) {
        if (data.hasOwnProperty('jobs') && data.jobs.hasOwnProperty('traceRouteJobs')) {
            var traceRouteJobs = data.jobs.traceRouteJobs;

            for(var key in traceRouteJobs) {
                uri = REST_URI_V1_PATH + "/system/diagnostics/traceroute/job/" + traceRouteJobs[key].id;
                authRestDelete(uri);
            }

            if (typeof callback != 'undefined' && callback != null) {
                callback();
            }
        }
    });
}
