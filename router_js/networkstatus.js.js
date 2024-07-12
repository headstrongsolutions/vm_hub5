/**
 * Parent class for Network Status Tabs
 *
 * @param {string} id the HTML ID for the tab
 * @param {Object} config the tab configuration object
 */
function NetworkStatusTab(id, config) {
    this.id = id;
    this.config = config ? config : {};
    this.elements = {};
}

/**
 * Creates the tab content
 */
NetworkStatusTab.prototype.createTab = function() {
    var tabContent = $(this.id).empty();
    var tabBody = tabContent;

    if (this.config.displaySpinner) {
        tabBody = $("<div>").hide();
        var spinner = NetworkStatusTab.createSpinner();
        this.elements.spinner = spinner;
        tabContent.append(spinner);
        tabContent.append(tabBody);
    }

    this.elements.body = tabBody;

    if (this.config.addRefreshButton) {
        // click handler will be added later
        tabBody.append(NetworkStatusTab.createRefreshButton());
    }
};

/**
 * Updates the tab content
 */
NetworkStatusTab.prototype.updateTab = $.noop;

/**
 * Creates a new spinner
 *
 * @returns {Object} the jQuery HTML object
 */
NetworkStatusTab.createSpinner = function() {
    return $("<div>", {
        class: "loading-spinner"
    }).append($("<img>", {
        src: "/resources/images/animations/loading.gif",
        alt: ""
    }));
};

/**
 * Creates a new tab refresh button
 *
 * @returns {Object} the jQuery refresh button object
 */
NetworkStatusTab.createRefreshButton = function() {
    return $("<div>", {
        class: "button-area" }).append($("<span>", {
        class: "change-link langHtml refresh-data-button",
        "data-lang-id": "rs32"
    }).text(getLanguageStringForCurrentUserAndId("rs32")));
};

/**
 * Creates a new jQuery heading object
 *
 * @param {string} stringId the translation string Id
 * @returns {Object} the jQuery HTML object
 */
NetworkStatusTab.createTitle = function(stringId) {
    return $("<p>", {
        class: "langHtml heading",
        text: getLanguageStringForCurrentUserAndId(stringId),
        "data-lang-id": stringId
    });
};

/**
 * Creates a new empty table row spanning the specified columns
 *
 * @param {number} span the number of table columns to span
 * @returns {TableRow} The empty table row object
 */
NetworkStatusTab.createEmptyTableRow = function(span) {
    return new TableRow([
        new TableCell({
            class: "langHtml",
            "data-lang-id": "c_st42",
            text: getLanguageStringForCurrentUserAndId("c_st42"),
            colspan: span
        })
    ]);
};

/**
 * Creates a new Network Status Status tab object
 *
 * @param {string} id the HTML ID for the tab
 * @param {Object} config the tab configuration object
 */
function NetworkStatusStatusTab(id, config) {
    NetworkStatusTab.call(this, id, config);
}

NetworkStatusStatusTab.prototype = Object.create(NetworkStatusTab.prototype);

NetworkStatusStatusTab.prototype.constructor = NetworkStatusStatusTab;

/**
 * Creates the tab content
 */
NetworkStatusStatusTab.prototype.createTab = function() {
    NetworkStatusTab.prototype.createTab.call(this);

    var tabBody = this.elements.body;

    var headers = [];

    if (!this.config.noTitle) {
        if (this.config.titleInTable) {
            headers.push(new TableRow([
                new TableHeader({languageId: "rs17", span: 3})
            ]));
        } else {
            tabBody.append(NetworkStatusTab.createTitle("rs17"));
        }
    }

    // add the table div
    var statusTableContainer = $("<div>");
    tabBody.append(statusTableContainer);

    headers.push(new TableRow([
        new TableHeader({languageId: 'rs19', name: 'item'}),
        new TableHeader({languageId: 'rs20', name: 'status'}),
        new TableHeader({ languageId: this.config.ofdSupport ?
            'rs50' : 'rs21', name: 'comments' })
    ]));
    this.elements.statusTable = new Table({
        emptyMessage: 'c_fi71',
        selector: statusTableContainer,
        headers: headers
    });
};

/**
 * Updates the tab content
 */
NetworkStatusStatusTab.prototype.updateTab = function() {
    var statusTable = this.elements.statusTable;
    var spinner = this.elements.spinner;
    var body = this.elements.body;
    var ofdSupport = this.config.ofdSupport;

    function getPrimaryChannel(direction) {
        var deferred = $.Deferred();
        restGet(REST_URI_V1_PATH + "/cablemodem/" + direction + "/primary_",
            function(data) {
                deferred.resolve(data.channel);
            },
            null,
            null,
            {
                // Primary channel has not been found - proceed with error values
                404: function() {
                    deferred.resolve({});
                }
            }
        );
        return deferred.promise();
    }

    function hideSpinner() {
        if (spinner && body) {
            spinner.fadeOut(DEFAULT_FADE_TIME_MS, function () {
                body.fadeIn(DEFAULT_FADE_TIME_MS);
            });
        }
    }

    function getContent() {
        statusTable.setData(null);
        if (ofdSupport) {
            $.when(getCableModemState(), getPrimaryChannel("downstream"),
                getChannels("upstream"), getChannels("downstream")).then(function (cablemodem,
                    primaryDownstreamChannel, upstreamChannels, downstreamChannels) {
                    statusTable.setData(NetworkStatusStatusTab.createOfdmData(cablemodem,
                        primaryDownstreamChannel, upstreamChannels, downstreamChannels));
                    hideSpinner();
                });
        } else {
            $.when(getCableModemState(), getPrimaryChannel("upstream"),
                getPrimaryChannel("downstream")).then(function (cablemodem,
                    upstreamChannel, downstreamChannel) {
                    statusTable.setData(NetworkStatusStatusTab.createDocsisData(downstreamChannel,
                        upstreamChannel, cablemodem));
                    hideSpinner();
                });
        }
    }

    if (spinner && body) {
        body.hide(0, function() {
            spinner.fadeIn(DEFAULT_FADE_TIME_MS, getContent);
        });
    } else {
        getContent();
    }
};

/**
 * Creates DOCSIS 3.0 and below network status table rows
 *
 * @param {Object} downstreamChannel downstream primary channel object
 * @param {Object} upstreamChannel upstream primary channel object
 * @param {Object} cablemodem cable modem state object
 * @returns {Array} the table data object array
 */
NetworkStatusStatusTab.createDocsisData = function(downstreamChannel, upstreamChannel, cablemodem) {

    function createDownstreamRow(downstreamChannelPrimaryData) {
        // Populate downstream row Comment cell.
        var comment = downstreamChannelPrimaryData.lockStatus ? "rs36" : "rs33";
        return {
            item: new TableCell({
                class: "langHtml",
                'data-lang-id': "rs06",
                html: getLanguageStringForCurrentUserAndId("rs06")
            }),
            status: downstreamChannelPrimaryData.frequency != undefined ?
                downstreamChannelPrimaryData.frequency : 0,
            comments: new TableCell({
                class: "langHtml",
                'data-lang-id': comment,
                html: getLanguageStringForCurrentUserAndId(comment)
            })
        };
    }

    function createUpstreamRow(upstreamChannelPrimaryData, cableModemStateData) {
        var comment = "rs08";
        var status = "0";

        if (upstreamChannelPrimaryData.frequency != undefined) {
            status = upstreamChannelPrimaryData.frequency;
            switch(cableModemStateData.status){
                case "operational":
                case "ranging_complete":
                    comment = 'rs27';
                    break;
                case "us_parameters_acquired":
                case "ranging_in_progress":
                    comment = 'rs28';
                    break;
                default:
                    comment = 'rs08';
                    break;
            }
        }

        return {
            item: new TableCell({
                class: "langHtml",
                'data-lang-id': 'rs07',
                html: getLanguageStringForCurrentUserAndId('rs07')
            }),
            status: status,
            comments: new TableCell({
                class: "langHtml",
                'data-lang-id': comment,
                html: getLanguageStringForCurrentUserAndId(comment)
            })
        };
    }

    function createProvisioningRow(cableModemStateData) {
        var status = processProvisioningStatus(cableModemStateData.status);
        var comment = networkStatusProvisioningCommentsMap(cableModemStateData.status);
        if (!comment) {
            comment = cableModemStateData.status;
        } else {
            comment = new TableCell({
                class: "langHtml",
                'data-lang-id': comment,
                html: getLanguageStringForCurrentUserAndId(comment)
            });
        }

        return {
            item: new TableCell({
                class: "langHtml",
                'data-lang-id': 'rs05',
                html: getLanguageStringForCurrentUserAndId('rs05')
            }),
            status: new TableCell({
                class: "langHtml",
                'data-lang-id': status,
                html: getLanguageStringForCurrentUserAndId(status)
            }),
            comments: comment
        };
    }

    return [
        createDownstreamRow(downstreamChannel),
        createUpstreamRow(upstreamChannel, cablemodem),
        createProvisioningRow(cablemodem)
    ];
};

/**
 * Creates DOCSIS 3.1+ network status table rows
 *
 * @param {Object} cablemodem the cable modem state object
 * @param {Object} primaryDownstreamChannel the primary downstream channel object
 * @param {Array} upstreamChannels the array of all upstream channels
 * @param {Array} downstreamChannels the array of all downstream channels
 * @returns {Array} the table data row array
 */
NetworkStatusStatusTab.createOfdmData = function(cablemodem, primaryDownstreamChannel,
    upstreamChannels, downstreamChannels) {
    var cmStatus = processProvisioningStatus(cablemodem.status);
    var lockStatus = primaryDownstreamChannel.lockStatus ? "rs36" : "rs33";
    upstreamChannels = filterArrayByPropertyValue(upstreamChannels,
        "channelType", ["ofdma"]);
    downstreamChannels = filterArrayByPropertyValue(downstreamChannels,
        "channelType", ["ofdm"]);
    var data = [
        {
            item: new TableCell({
                class: "langHtml",
                'data-lang-id': "rs17",
                html: getLanguageStringForCurrentUserAndId("rs17")
            }),
            status: new TableCell({
                class: "langHtml",
                'data-lang-id': cmStatus,
                html: getLanguageStringForCurrentUserAndId(cmStatus)
            }),
            comments: "DOCSIS 3." + (primaryDownstreamChannel.channelType == "ofdm" ? "1" : "0")
        },
        {
            item: new TableCell({
                class: "langHtml",
                'data-lang-id': "c_ns28",
                html: getLanguageStringForCurrentUserAndId("c_ns28")
            }),
            status: new TableCell({
                class: "langHtml",
                'data-lang-id': lockStatus,
                html: getLanguageStringForCurrentUserAndId(lockStatus)
            }),
            comments: new TableCell(getHtmlAttributes(getChannelType(primaryDownstreamChannel.channelType)))
        },
        new TableRow([
            new TableHeader({languageId: 'c_ns29'}),
            new TableHeader({languageId: 'rs29'}),
            new TableHeader({languageId: 'rs30'})
        ]),
        new TableRow([
            new TableCell({
                class: "langHtml",
                'data-lang-id': "c_ns22",
                html: getLanguageStringForCurrentUserAndId("c_ns22")
            }),
            new TableCell({ text: downstreamChannels[1].length }),
            new TableCell({ text: upstreamChannels[1].length })
        ]),
        new TableRow([
            new TableCell({
                class: "langHtml",
                'data-lang-id': "c_ns23",
                html: getLanguageStringForCurrentUserAndId("c_ns23")
            }),
            new TableCell({ text: downstreamChannels[0].length }),
            new TableCell({ text: upstreamChannels[0].length })
        ])
    ];

    return data;
};

/**
 * Creates a new Network Status Downstream tab object
 *
 * @param {string} id the HTML ID for the tab
 * @param {Object} config the tab configuration object
 */
function NetworkStatusDownstreamTab(id, config) {
    NetworkStatusTab.call(this, id, config);
}

NetworkStatusDownstreamTab.prototype = Object.create(NetworkStatusTab.prototype);

NetworkStatusDownstreamTab.prototype.constructor = NetworkStatusDownstreamTab;

/**
 * Creates the tab content
 */
NetworkStatusDownstreamTab.prototype.createTab = function() {
    NetworkStatusTab.prototype.createTab.call(this);

    var tabBody = this.elements.body;

    // add table title
    var titleId = this.config.ofdSupport ? "c_ns24" : "c_ns02";
    tabBody.append(NetworkStatusTab.createTitle(titleId));
    // first table
    var tableContainer = $("<div>");
    tabBody.append(tableContainer);

    this.elements.downstreamTable1 = new Table({
        emptyMessage: "c_fi71",
        selector: tableContainer,
        headers: [
            new TableRow([
                new TableHeader({languageId: "c_03", name: "channel"}),
                new TableHeader({languageId: "c_ns03", name: "frequency"}),
                new TableHeader({languageId: "c_ns04", name: "power"}),
                new TableHeader({languageId: "c_ns05", name: "snr"}),
                new TableHeader({languageId: "c_ns06", name: "modulation"}),
                new TableHeader({languageId: "c_ns07", name: "channelId"})
            ])
        ]
    });

    // second table
    tabBody.append(NetworkStatusTab.createTitle(titleId));
    tableContainer = $("<div>");
    tabBody.append(tableContainer);

    this.elements.downstreamTable2 = new Table({
        emptyMessage: "c_fi71",
        selector: tableContainer,
        headers: [
            new TableRow([
                new TableHeader({languageId: "c_03", name: "channel"}),
                new TableHeader({languageId: "rs37", name: "lockStatus"}),
                new TableHeader({languageId: "c_ns17", name: "rxMer"}),
                new TableHeader({languageId: "c_ns18", name: "preErrors"}),
                new TableHeader({languageId: "c_ns19", name: "postErrors"})
            ])
        ]
    });

    // DOCSIS 3.1+
    if (this.config.ofdSupport) {
        var ofdContainer = $("<div>").hide();
        this.elements.ofdContainer = ofdContainer;

        ofdContainer.append(NetworkStatusTab.createTitle("c_ns26"));
        tableContainer = $("<div>");
        ofdContainer.append(tableContainer);

        this.elements.downstreamOfdmTable1 = new Table({
            emptyMessage: "c_fi71",
            selector: tableContainer,
            headers: [
                new TableRow([
                    new TableHeader({languageId: "c_03", name: "channel"}),
                    new TableHeader({languageId: "c_ns30", name: "channelWidth"}),
                    new TableHeader({languageId: "c_ns31", name: "fftType"}),
                    new TableHeader({languageId: "c_ns32", name: "activeSubcarriers"}),
                    new TableHeader({languageId: "c_ns33", name: "modulation"}),
                    new TableHeader({languageId: "c_ns34", name: "firstActiveSubcarrier"})
                ])
            ]
        });

        ofdContainer.append(NetworkStatusTab.createTitle("c_ns26"));
        tableContainer = $("<div>");
        ofdContainer.append(tableContainer);

        this.elements.downstreamOfdmTable2 = new Table({
            emptyMessage: "c_fi71",
            selector: tableContainer,
            headers: [
                new TableRow([
                    new TableHeader({languageId: "c_ns07", name: "channelId"}),
                    new TableHeader({languageId: "rs37", name: "lockStatus"}),
                    new TableHeader({languageId: "c_ns35", name: "rxMer"}),
                    new TableHeader({languageId: "c_ns36", name: "plcPower"}),
                    new TableHeader({languageId: "c_ns37", name: "preErrors"}),
                    new TableHeader({languageId: "c_ns38", name: "postErrors"})
                ])
            ]
        });

        tabBody.append(ofdContainer);
    }
};

/**
 * Updates the tab content
 */
NetworkStatusDownstreamTab.prototype.updateTab = function() {
    var self = this;
    var elements = this.elements;

    function getContent() {
        elements.downstreamTable1.setData(null);
        elements.downstreamTable2.setData(null);
        if (self.config.ofdSupport) {
            // hide ofdm channels while updating
            elements.ofdContainer.hide();
            elements.downstreamOfdmTable1.setData(null);
            elements.downstreamOfdmTable2.setData(null);
        }
        getChannels("downstream").then(function(channels) {
            self.populateTableData(channels);

            if (elements.spinner) {
                elements.spinner.fadeOut(DEFAULT_FADE_TIME_MS, function () {
                    elements.body.fadeIn(DEFAULT_FADE_TIME_MS);
                });
            }
        });
    }

    if (elements.spinner) {
        elements.body.hide(0, function() {
            elements.spinner.fadeIn(DEFAULT_FADE_TIME_MS, getContent);
        });
    } else {
        getContent();
    }
};

/**
 * Add data rows to the two 'Downstream bonded channels' tables on the Downstream tab.
 *
 * @param {Object} downstream channels array retreived from REST response
 */
NetworkStatusDownstreamTab.prototype.populateTableData = function(downstreamChannelData) {
    if (this.config.ofdSupport) {
        var filteredChannelData = filterArrayByPropertyValue(downstreamChannelData,
            "channelType", ["ofdm"]);
        var ofdmChannelData = filteredChannelData[0];
        downstreamChannelData = filteredChannelData[1];

        if (ofdmChannelData.length) {
            var ofdmTable1Rows = [];
            var ofdmTable2Rows = [];
            ofdmChannelData.forEach(function (channel) {
                ofdmTable1Rows.push({
                    channel: channel.channelId, // unclear if this should be the Id or not
                    channelWidth: channel.channelWidth / 1000000,   // Hz to MHz
                    fftType: channel.fftType,
                    activeSubcarriers: channel.numberOfActiveSubCarriers,
                    modulation: new TableCell(getHtmlAttributes(getModulationString(channel.modulation))),
                    firstActiveSubcarrier: channel.firstActiveSubcarrier
                });

                var lockStatus = channel.lockStatus ? "rs36" : "rs33";

                ofdmTable2Rows.push({
                    channelId: channel.channelId,
                    lockStatus: new TableCell({
                        class: "langHtml",
                        "data-lang-id": lockStatus,
                        html: getLanguageStringForCurrentUserAndId(lockStatus)
                    }),
                    rxMer: channel.rxMer / 10,
                    plcPower: (channel.power / 10).toFixed(1),
                    preErrors: channel.correctedErrors,
                    postErrors: channel.uncorrectedErrors
                });
            });

            this.elements.downstreamOfdmTable1.setData(ofdmTable1Rows);
            this.elements.downstreamOfdmTable2.setData(ofdmTable2Rows);
            this.elements.ofdContainer.show();
        }
    }

    if (downstreamChannelData.length > 0) {
        var table1Rows = [];
        var table2Rows = [];
        downstreamChannelData.forEach(function (channel, index) {
            table1Rows.push({
                channel: index+1,
                frequency: channel.frequency,
                power: channel.power,
                snr: Math.round(channel.snr),
                modulation: new TableCell(getHtmlAttributes(getModulationString(channel.modulation))),
                channelId: channel.channelId
            });

            var lockStatus = channel.lockStatus ? "rs36" : "rs33";

            table2Rows.push({
                channel: index+1,
                lockStatus: new TableCell({
                    class: "langHtml",
                    "data-lang-id": lockStatus,
                    html: getLanguageStringForCurrentUserAndId(lockStatus)
                }),
                rxMer: channel.rxMer,
                preErrors: channel.correctedErrors,
                postErrors: channel.uncorrectedErrors
            });
        });

        this.elements.downstreamTable1.setData(table1Rows);
        this.elements.downstreamTable2.setData(table2Rows);
    } else {
        // Add something to say nothing found.
        this.elements.downstreamTable1.setData([NetworkStatusTab.createEmptyTableRow(6)]);
        this.elements.downstreamTable2.setData([NetworkStatusTab.createEmptyTableRow(6)]);
    }
};

/**
 * Creates a new Network Status Upstream tab object
 *
 * @param {string} id the HTML ID for the tab
 * @param {Object} config the tab configuration object
 */
function NetworkStatusUpstreamTab(id, config) {
    NetworkStatusTab.call(this, id, config);
}

NetworkStatusUpstreamTab.prototype = Object.create(NetworkStatusTab.prototype);

NetworkStatusUpstreamTab.prototype.constructor = NetworkStatusUpstreamTab;

/**
 * Creates the tab content
 */
NetworkStatusUpstreamTab.prototype.createTab = function() {
    NetworkStatusTab.prototype.createTab.call(this);

    var tabBody = this.elements.body;

    // add table title
    var titleId = this.config.ofdSupport ? "c_ns25" : "c_ns11";
    tabBody.append(NetworkStatusTab.createTitle(titleId));
    // first table
    var tableContainer = $("<div>");
    tabBody.append(tableContainer);

    this.elements.upstreamTable1 = new Table({
        emptyMessage: "c_fi71",
        selector: tableContainer,
        headers: [
            new TableRow([
                new TableHeader({languageId: "c_03", name: "channel"}),
                new TableHeader({languageId: "c_ns03", name: "frequency"}),
                new TableHeader({languageId: "c_ns04", name: "power"}),
                new TableHeader({languageId: "c_ns08", name: "symbolRate"}),
                new TableHeader({languageId: "c_ns06", name: "modulation"}),
                new TableHeader({languageId: "c_ns07", name: "channelId"})
            ])
        ]
    });

    // second table
    tabBody.append(NetworkStatusTab.createTitle(titleId));
    tableContainer = $("<div>");
    tabBody.append(tableContainer);

    this.elements.upstreamTable2 = new Table({
        emptyMessage: "c_fi71",
        selector: tableContainer,
        headers: [
            new TableRow([
                new TableHeader({languageId: "c_03", name: "channel"}),
                new TableHeader({languageId: "rs38", name: "channelType"}),
                new TableHeader({languageId: "c_ns13", name: "t1Timeouts"}),
                new TableHeader({languageId: "c_ns14", name: "t2Timeouts"}),
                new TableHeader({languageId: "c_ns15", name: "t3Timeouts"}),
                new TableHeader({languageId: "c_ns16", name: "t4Timeouts"})
            ])
        ]
    });

    // DOCSIS 3.1+
    if (this.config.ofdSupport) {
        var ofdContainer = $("<div>").hide();
        this.elements.ofdContainer = ofdContainer;

        ofdContainer.append(NetworkStatusTab.createTitle("c_ns27"));
        tableContainer = $("<div>");
        ofdContainer.append(tableContainer);

        this.elements.upstreamOfdmaTable1 = new Table({
            emptyMessage: "c_fi71",
            selector: tableContainer,
            headers: [
                new TableRow([
                    new TableHeader({languageId: "c_03", name: "channel"}),
                    new TableHeader({languageId: "c_ns30", name: "channelWidth"}),
                    new TableHeader({languageId: "c_ns04", name: "power"}),
                    new TableHeader({languageId: "c_ns31", name: "fftType"}),
                    new TableHeader({languageId: "c_ns06", name: "modulation"})
                ])
            ]
        });

        ofdContainer.append(NetworkStatusTab.createTitle("c_ns27"));
        tableContainer = $("<div>");
        ofdContainer.append(tableContainer);

        this.elements.upstreamOfdmaTable2 = new Table({
            emptyMessage: "c_fi71",
            selector: tableContainer,
            headers: [
                new TableRow([
                    new TableHeader({languageId: "c_03", name: "channel"}),
                    new TableHeader({languageId: "rs38", name: "channelType"}),
                    new TableHeader({languageId: "c_ns32", name: "activeSubcarriers"}),
                    new TableHeader({languageId: "c_ns34", name: "firstActiveSubcarrier"}),
                    new TableHeader({languageId: "c_ns15", name: "t3Timeouts"}),
                    new TableHeader({languageId: "c_ns16", name: "t4Timeouts"}),
                ])
            ]
        });

        tabBody.append(ofdContainer);
    }
};

/**
 * Updates the tab content
 */
NetworkStatusUpstreamTab.prototype.updateTab = function() {
    var self = this;
    var elements = this.elements;

    function getContent() {
        elements.upstreamTable1.setData(null);
        elements.upstreamTable2.setData(null);
        if (self.config.ofdSupport) {
            elements.ofdContainer.hide();
            elements.upstreamOfdmaTable1.setData(null);
            elements.upstreamOfdmaTable2.setData(null);
        }

        getChannels("upstream").then(function(channels) {
            self.populateTableData(channels.filter(function(channel) {
                return channel.lockStatus;
            }));
            if (elements.spinner) {
                elements.spinner.fadeOut(DEFAULT_FADE_TIME_MS, function() {
                    elements.body.fadeIn(DEFAULT_FADE_TIME_MS);
                });
            }
        });
    }

    if (elements.spinner) {
        elements.body.hide(0, function() {
            elements.spinner.fadeIn(DEFAULT_FADE_TIME_MS, getContent);
        });
    } else {
        getContent();
    }
};

/**
 * Add data rows to the two 'Upstream bonded channels' tables on the Upstream tab.
 *
 * @param {Object} upstream channels array retreived from REST response
 */
NetworkStatusUpstreamTab.prototype.populateTableData = function(upstreamChannelData) {
    if (this.config.ofdSupport) {
        var filteredChannelData = filterArrayByPropertyValue(upstreamChannelData,
            "channelType", ["ofdma"]);
        var ofdmaChannelData = filteredChannelData[0];
        upstreamChannelData = filteredChannelData[1];

        if (ofdmaChannelData.length) {
            var ofdmaTable1Rows = [];
            var ofdmaTable2Rows = [];
            ofdmaChannelData.forEach(function (channel) {
                ofdmaTable1Rows.push({
                    channel: channel.channelId,
                    channelWidth: channel.channelWidth / 1000000,  // Hz to MHz
                    power: (channel.power / 10).toFixed(1),
                    fftType: channel.fftType,
                    modulation: new TableCell(getHtmlAttributes(getModulationString(channel.modulation)))
                });

                var lockStatus = channel.lockStatus ? "rs36" : "rs33";

                ofdmaTable2Rows.push({
                    channel: channel.channelId,
                    channelType: new TableCell(getHtmlAttributes(getChannelType(channel.channelType))),
                    activeSubcarriers: channel.numberOfActiveSubCarriers,
                    firstActiveSubcarrier: channel.firstActiveSubcarrier * 1000000, // MHz to Hz
                    t3Timeouts: channel.t3Timeout,
                    t4Timeouts: channel.t4Timeout
                });
            });

            this.elements.upstreamOfdmaTable1.setData(ofdmaTable1Rows);
            this.elements.upstreamOfdmaTable2.setData(ofdmaTable2Rows);
            this.elements.ofdContainer.show();
        }
    }

    if (upstreamChannelData.length > 0) {
        var table1Rows = [];
        var table2Rows = [];

        upstreamChannelData.forEach(function(channel, index){
            table1Rows.push({
                channel: index,
                frequency: channel.frequency,
                power: channel.power,
                symbolRate: channel.symbolRate,
                modulation: new TableCell(getHtmlAttributes(getModulationString(channel.modulation))),
                channelId: channel.channelId
            });

            table2Rows.push({
                channel: index,
                channelType: new TableCell(getHtmlAttributes(getChannelType(channel.channelType))),
                t1Timeouts: channel.t1Timeout,
                t2Timeouts: channel.t2Timeout,
                t3Timeouts: channel.t3Timeout,
                t4Timeouts: channel.t4Timeout,
            });
        });

        this.elements.upstreamTable1.setData(table1Rows);
        this.elements.upstreamTable2.setData(table2Rows);
    } else {
        // Add something to say nothing found.
        this.elements.upstreamTable1.setData([NetworkStatusTab.createEmptyTableRow(6)]);
        this.elements.upstreamTable2.setData([NetworkStatusTab.createEmptyTableRow(6)]);
    }
};

/**
 * Creates a new Network Status Configuration tab object
 *
 * @param {string} id the HTML ID for the tab
 * @param {Object} config the tab configuration object
 */
function NetworkStatusConfigTab(id, config) {
    NetworkStatusTab.call(this, id, config);
}

NetworkStatusConfigTab.prototype = Object.create(NetworkStatusTab.prototype);

NetworkStatusConfigTab.prototype.constructor = NetworkStatusConfigTab;

/**
 * Creates the tab content
 */
NetworkStatusConfigTab.prototype.createTab = function() {
    NetworkStatusTab.prototype.createTab.call(this);

    var tabBody = this.elements.body;

    // add table title
    tabBody.append(NetworkStatusTab.createTitle("rs14"));

    // first table
    var tableContainer = $("<div>");
    tabBody.append(tableContainer);

    this.elements.configTable = new Table({
        emptyMessage: "c_fi71",
        selector: tableContainer,
        class: "vertical",
    });

    tabBody.append(NetworkStatusTab.createTitle("rs15"));
    tableContainer = $("<div>");
    tabBody.append(tableContainer);

    this.elements.downstreamServiceFlowTable = new Table({
        emptyMessage: "c_fi71",
        selector: tableContainer,
        class: "vertical",
    });

    tabBody.append(NetworkStatusTab.createTitle("rs16"));
    tableContainer = $("<div>");
    tabBody.append(tableContainer);

    this.elements.upstreamServiceFlowTable = new Table({
        emptyMessage: "c_fi71",
        selector: tableContainer,
        class: "vertical",
    });
};

/**
 * Updates the tab content
 */
NetworkStatusConfigTab.prototype.updateTab = function() {
    var self = this;
    var elements = this.elements;

    function getServiceFlows() {
        var deferred = $.Deferred();
        restGet(REST_URI_V1_PATH + "/cablemodem/serviceflows", function(data) {
            deferred.resolve(data.serviceFlows);
        });
        return deferred.promise();
    }

    function getContent() {
        elements.downstreamServiceFlowTable.setData(null);
        elements.upstreamServiceFlowTable.setData(null);
        $.when(getCableModemState(), getServiceFlows()).then(function(state, flows) {
            self.populateTableData(state, flows);
            if (elements.spinner) {
                elements.spinner.fadeOut(DEFAULT_FADE_TIME_MS, function() {
                    elements.body.fadeIn(DEFAULT_FADE_TIME_MS);
                });
            }
        });
    }

    if (elements.spinner) {
        elements.body.hide(0, function() {
            elements.spinner.fadeIn(DEFAULT_FADE_TIME_MS, getContent);
        });
    } else {
        getContent();
    }
};

/**
 * Populates the tab table data
 *
 * @param {Object} state The modem state object
 * @param {Object} flows The service flows object
 */
NetworkStatusConfigTab.prototype.populateTableData = function(state, flows) {
    // populate config table
    this.elements.configTable.setData(NetworkStatusConfigTab.createConfigData(state));

    // populate service flows
    var data = NetworkStatusConfigTab.createServiceFlowData(flows);
    this.elements.downstreamServiceFlowTable.setData(data.downstream.length ?
        data.downstream : [NetworkStatusTab.createEmptyTableRow(2)]);
    this.elements.upstreamServiceFlowTable.setData(data.upstream.length ?
        data.upstream : [NetworkStatusTab.createEmptyTableRow(2)]);
};

/**
 * Creates data cells for the 'General Configuration' table on the 'Configuration' tab.
 *
 * @param {Object} cableModemStateData cablemodem state object received from backend
 * @returns {Array} the array of Table Rows
 */
NetworkStatusConfigTab.createConfigData = function(cableModemStateData) {
    var access = cableModemStateData.accessAllowed ? "c_66" : "c_67";
    var bpi = cableModemStateData.baselinePrivacyEnabled ? "c_00" : "c_01";

    return [
        new TableRow([ // Network Access
            new TableHeader({languageId: "c_if09"}),
            new TableCell({
                class: "langHtml",
                text: getLanguageStringForCurrentUserAndId(access),
                "data-lang-id": access
            })
        ]),
        new TableRow([ // Maximum Number of CPEs
            new TableHeader({languageId: "rs02"}),
            new TableCell({
                text: cableModemStateData.maxCPEs,
            })
        ]),
        new TableRow([ // Baseline Privacy
            new TableHeader({languageId: "rs03"}),
            new TableCell({
                class: "langHtml",
                text: getLanguageStringForCurrentUserAndId(bpi),
                "data-lang-id": bpi
            })
        ]),
        new TableRow([ // DOCSIS Mode
            new TableHeader({languageId: "rs04"}),
            new TableCell({
                text: cableModemStateData.docsisVersion,
            })
        ]),
        new TableRow([ // Config File
            new TableHeader({languageId: "rs01"}),
            new TableCell({
                text: cableModemStateData.bootFilename,
            })
        ])
    ];
};

/**
 * Creates data rows for the 'Primary Downstream Service Flow' table
 * and the 'Primary Upstream Service Flow' table on the 'Configuration' tab.
 *
 * @param {Object} flows the service flows data received from backend
 */
NetworkStatusConfigTab.createServiceFlowData = function(flows) {
    var unitBps = " bps";

    var downstreamRows = [];
    var upstreamRows = [];

    flows.forEach(function (flow) {
        var data = flow.serviceFlow;

        var rows = [
            new TableRow([
                new TableHeader({languageId: "c_st43"}),
                new TableCell({
                    text: data.serviceFlowId,
                })
            ]),
            new TableRow([
                new TableHeader({languageId: "rs09"}),
                new TableCell({
                    text: data.maxTrafficRate + unitBps,
                })
            ]),
            new TableRow([
                new TableHeader({languageId: "rs10"}),
                new TableCell({
                    html: $("<span>", {
                        text: data.maxTrafficBurst
                    }).append($('<span>', {
                        class: "langHtml",
                        text: getLanguageStringForCurrentUserAndId("c_11"),
                        "data-lang-id": "c_11"
                    }))
                })
            ]),
            new TableRow([
                new TableHeader({languageId: "rs11"}),
                new TableCell({
                    text: data.minReservedRate + unitBps,
                })
            ]),
        ];

        if (data.direction == "upstream") {
            rows.push(new TableRow([
                new TableHeader({languageId: "rs12"}),
                new TableCell({
                    html: $("<span>", {
                        text: data.maxConcatenatedBurst
                    }).append($('<span>', {
                        class: "langHtml",
                        text: getLanguageStringForCurrentUserAndId("c_11"),
                        "data-lang-id": "c_11"
                    }))
                })
            ]));

            var scheduleType = getSchedulingType(data.scheduleType);
            rows.push(new TableRow([
                new TableHeader({languageId: "rs13"}),
                new TableCell({
                    class: "langHtml",
                    text: getLanguageStringForCurrentUserAndId(scheduleType),
                    "data-lang-id": scheduleType
                })
            ]));

            upstreamRows.push.apply(upstreamRows, rows);
        } else {
            downstreamRows.push.apply(downstreamRows, rows);
        }
    });

    return {
        downstream: downstreamRows,
        upstream: upstreamRows
    };
};

/**
 * Creates a new Network STatus Log tab
 *
 * @param {string} id the HTML ID for the tab
 * @param {Object} config the tab configuration object
 */
function NetworkStatusLogTab(id, config) {
    NetworkStatusTab.call(this, id, config);
}

NetworkStatusLogTab.prototype = Object.create(NetworkStatusTab.prototype);

NetworkStatusLogTab.prototype.constructor = NetworkStatusLogTab;

/**
 * Creates the tab content
 */
NetworkStatusLogTab.prototype.createTab = function() {
    NetworkStatusTab.prototype.createTab.call(this);

    var tabBody = this.elements.body;

    tabBody.append(NetworkStatusTab.createTitle("rs22"));

    var tableContainer = $("<div>");
    tabBody.append(tableContainer);

    this.elements.logTable = new Table({
        emptyMessage: "c_fi71",
        selector: tableContainer,
        headers: [
            new TableRow([
                new TableHeader({languageId: "rs23", name: "time"}),
                new TableHeader({languageId: "rs24", name: "priority"}),
                new TableHeader({languageId: "rs25", name: "description"})
            ])
        ]
    });
};

/**
 * Updates the tab content
 */
NetworkStatusLogTab.prototype.updateTab = function() {
    var elements = this.elements;

    function getContent() {
        // Delete any rows from body of Network Log table
        elements.logTable.setData(null);
        restGet(REST_URI_V1_PATH + "/cablemodem/eventlog", function(data) {
            elements.logTable.setData(data.eventlog.length ?
                NetworkStatusLogTab.createLogTableData(data.eventlog) :
                    [NetworkStatusTab.createEmptyTableRow(3)]);
            if (elements.spinner) {
                elements.spinner.fadeOut(DEFAULT_FADE_TIME_MS, function() {
                    elements.body.fadeIn(DEFAULT_FADE_TIME_MS);
                });
            }
        });
    }

    if (elements.spinner) {
        elements.body.hide(0, function() {
            elements.spinner.fadeIn(DEFAULT_FADE_TIME_MS, getContent);
        });
    } else {
        getContent();
    }
};

/**
 * Creates the network log table data
 *
 * @param {Object} eventlog the network event log object retrieved from backend
 * @returns {Array} the table rows data array
 */
NetworkStatusLogTab.createLogTableData = function(eventlog) {
    var rows = [];
    eventlog.forEach(function (entry) {
        // Convert ISO-8601 formatted string YYYY-MM-DDTHH:mm:ss.sssZ (e.g. '2020-12-07T11:14:47.040Z') to match legacy format DD-MM-YYYY HH:mm:ss
        var date = new Date(entry.time.slice(0,-1));
        var timeString = date.getDate().toString().padStart(2, '0') + "-" +
            (date.getMonth() + 1).toString().padStart(2, '0') + "-" +
            date.getFullYear() + " " +
            date.getHours().toString().padStart(2, '0') + ":" +
            date.getMinutes().toString().padStart(2, '0') + ":" +
            date.getSeconds().toString().padStart(2, '0');

        rows.push({
            time: timeString,
            priority: entry.priority,
            description: entry.message
        });
    });
    return rows;
};

/**
* Function to process the Provisioning Status
*
* @param {string} Provisioning status from rest call
*
* @returns {string} Corresponding Status.
*/
function processProvisioningStatus(status) {
    switch (status) {
        case "not_ready":
        case "not_synchronized":
            // There's no pre DS scanning state so go to DS scanning
            // from the start. Could use the change from NOT_READY
            // to NOT_SYNCRONIZED to start some kind of time tracking
            // and switch to "No RF signal detected".
            return "c_st07"; // DS scanning
        case "phy_synchronized":
        case "ds_topology_resolution_in_progress":
            return "c_st07"; // DS scanning
        case "ranging_in_progress":
        case "us_parameters_acquired":
            return "c_st08"; // US ranging
        case "ranging_complete":
        case "dhcp_v4_in_progress":
        case "dhcp_v6_in_progress":
            return "c_st09"; // Requesting CM IP address
        case "dhcp_v4_complete":
        case "dhcp_v6_complete":
            return "c_st10"; // Obtaining ToD
        case "tod_established":
            return "c_st35"; // Obtaining Configuration File
        case "config_file_download_complete":
        case "registration_in_progress":
            // Technically configuration file download is complete however
            // there's no CBN step before 'Online' so stay in that state.
            return "c_st35"; // Obtaining Configuration File
        case "operational":
            return "c_st11"; // Online
        case "access_denied":
            return "c_st13"; // Access denied
        default:
            // If unrecognised use this default
            return "c_st06"; // Unsupported Status
    }
}
/**
* Function to map the Provisioning Comment to data-lang-id
*
* @param {string}  Provisioning status from rest call
*
* @returns {string} Corresponding data-lang-id
 */
function networkStatusProvisioningCommentsMap(status) {
    switch (status) {
        case "operational" :
            return "rs49";
        case "access_denied" :
            return "c_st13";
        case "not_ready" :
            return "c_st03";
        case "unsupported_status":
            return "c_st06";
        case "other":
            return "rs46";
        default:
            // If unrecognised use this default
            return "";
    }
}

// TODO update map values to translation string ids once available.
var MODULATION_MAP = {
    qpsk        : "QPSK",
    qam_8       : "QAM 8",
    qam_16      : "QAM 16",
    qam_32      : "QAM 32",
    qam_64      : "QAM 64",
    qam_128     : "QAM 128",
    qam_256     : "QAM 256",
    qam_512     : "QAM 512",
    qam_1024    : "QAM 1024",
    qam_2048    : "QAM 2048",
    qam_4096    : "QAM 4096",
    other       : "rs46",
    unsupported : "c_st30",
    error       : "c_st30",
    unknown     : "c_cd04" // 'Unknown'
};

/**
 * Returns the ui string corresponding to the modulation string provided in REST response.
 *
 * @param {string} string from REST response
 * @returns {string} the string ID for the language
 */
function getModulationString(restModulationString) {
    if (MODULATION_MAP.hasOwnProperty(restModulationString)) {
        return MODULATION_MAP[restModulationString];
    }
    return MODULATION_MAP.unknown;
}

/**
 * Returns the appropriate HTML attribues for the given string value
 *
 * Workaround for lack of translations of different channel and modulation types
 *
 * @param {string} value the string to translate
 * @returns {Object} the HTML attributes
 */
function getHtmlAttributes(value) {
    switch (value) {
        case "c_cd04":
        case "rs46":
        case "c_st30":
            return {
                class: "langHtml",
                'data-lang-id': value,
                html: getLanguageStringForCurrentUserAndId(value)
            };
        default:
            return {
                text: value
            };
    }
}

var CHANNEL_TYPE_MAP = {
    tdma        : "TDMA",
    atdma       : "ATDMA",
    scdma       : "SCDMA",
    tdma_atdma  : "TDMA and ATDMA",
    ofdm        : "OFDM",
    ofdma       : "OFDMA",
    sc_qam      : "SC-QAM",
    unknown     : "c_cd04" // 'Unknown'
};

/**
 * Returns the ui string corresponding to the string provided in the REST response.
 *
 * @param {string} string from REST response
 * @returns {string} the language string ID
 */
function getChannelType(restChannelType) {
    if (CHANNEL_TYPE_MAP.hasOwnProperty(restChannelType)) {
        return CHANNEL_TYPE_MAP[restChannelType];
    }
    return CHANNEL_TYPE_MAP.unknown;
}

var SCHEDULING_TYPE_MAP = {
    "best_effort": "rs41", //Best Effort
    "non_real_time_polling_service": "rs42", //Non Real Time Polling Service
    "real_time_polling_service": "rs43", //Real Time Polling Service
    "unsolicited_grant_service_with_ad": "rs44", //Unsolicited Grant Service With AD
    "unsolicited_grant_service": "rs45", //Unsolicited Grant Service
    "undefined": "rs40", //Type Undefined
};

/**
 * Returns the ui string corresponding to the string provided in the REST response.
 *
 * @param {string} string from REST response
 * @returns {string} the language string ID
 */
function getSchedulingType(restSchedulingType) {
    if (SCHEDULING_TYPE_MAP.hasOwnProperty(restSchedulingType)) {
        return SCHEDULING_TYPE_MAP[restSchedulingType];
    }
    return SCHEDULING_TYPE_MAP.undefined;
}

/**
 * Gets the specified DOCSIS channels
 *
 * @param {string} direction which channels to get e.g. upstream or downstream
 * @returns {Object} the promise
 */
function getChannels(direction) {
    var deferred = $.Deferred();
    restGet(REST_URI_V1_PATH + "/cablemodem/" + direction, function (data) {
        deferred.resolve(data[direction].channels);
    });
    return deferred.promise();
}

/**
 * Creates a new Network Status Tabs object and builds to provided tabs
 *
 * @param {string} id the HTML element ID for the tabs content
 * @param {Object} config the tab configuration object
 * @param {Object} [extraContent] additional content to be injected at the bottom of each tab
 */
function NetworkStatusTabs(id, config, extraContent) {
    this.id = id;
    this.content = $(id);

    if (config.tabs) {
        this.tabs = config.tabs;
        // create tabs
        config.tabs.forEach(function(tab) {
            tab.createTab();
        });

        var self = this;

        var initTabs = function () {
            self.loadTab();
        };

        this.content.tabs({
            // Handle tab creation.
            create: initTabs,
            // Handle tab selection.
            activate: initTabs
        });

        $(".refresh-data-button").click(initTabs);

        if (extraContent) {
            this.content.children("div").append(extraContent);
        }
    }
}

/**
 * Update content of a tab.
 *
 * @param {number} index the tab index to load
 */
NetworkStatusTabs.prototype.loadTab = function(index) {
    var currentIndex = this.content.tabs("option", "active");
    if (typeof index == "undefined" || index == currentIndex) {
        this.tabs[currentIndex].updateTab();
    } else {
        // active event will trigger updateTab
        this.content.tabs("option", "active", index);
    }
};
