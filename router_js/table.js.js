/**
 * Table component prototype
 *
 * @param {Object} config configuration object
 * @param {string} config.emptyMessage language id for text row
 *  displayed when there is no data
 * @param {TableRow[]|TableHeader[]} config.headers table header definition.
 *  This can be either array of TableHeaders or array of TableRows. The latter
 *  means you can have multiple header rows (useful for eg.: header grouping).
 *  If there are many header rows defined, the last one is assumed to be the row
 *  which contains `name` values mapping input data to appropriate cells
 * @param {string} config.selector jquery selector to attach the table
 * */
function Table(config) {
    this.emptyMessage = config.emptyMessage;
    this.headers = config.headers;
    this.body = typeof config.selector == "string" ? $(config.selector) : config.selector;
    this.body.empty();
    this.tableBody = $('<tbody>');
    var container = $('<table>');
    var thead = $('<thead>');
    container.append(thead);
    container.append(this.tableBody);
    this.body.append(container);
    this.data = null;

    if (config.class) {
        container.addClass(config.class);
    }

    if (this.headers) {
        if (this.headers[0] instanceof TableHeader) {
            this.headers = [new TableRow(this.headers)];
        }
        //Last header row assumed to contain field definitions
        this.fields = Array.from(this.headers).pop().elements;

        this.headers
            .map(function (row) {
                var tr = $('<tr>');
                var cells = row.elements.map(function (h) {
                    return h.render();
                });
                tr.append(cells);
                return tr;
            })
            .forEach(function (tr) {
                thead.append(tr);
            });
    }
}

/**
 * Set the table content
 *
 * Sets the data and renders the table.
 *
 * @param {Array} data input data
 * */
Table.prototype.setData = function (data) {
    this.data = data;
    this.render();
};

/**
 * Render the table
 *
 * Create and populate table HTML
 * */
Table.prototype.render = function () {
    this.tableBody.empty();

    if (!this.data || !this.data.length) {
        var row = $('<tr>');
        var td = {
            class: "langHtml",
            text: getLanguageStringForCurrentUserAndId(this.emptyMessage),
            "data-lang-id": this.emptyMessage
        };

        if (this.fields) {
            td.colspan = this.fields.length;
        }

        row.append($('<td>', td));
        return this.tableBody.append(row);
    }

    this.data.forEach(function (d) {
        var row = $('<tr>');
        if (d instanceof TableRow) {
            row.append(d.elements.map(function (c) {
                return c.render();
            }));
        } else {
            var cells = this.fields
                .map(function (h) {
                    var value = d[h.name];
                    if (value instanceof jQuery) {
                        return $('<td>').append(value);
                    }
                    if (value instanceof TableCell) {
                        return value.render();
                    }
                    if (typeof value === 'string') {
                        return $('<td>').text(value);
                    }
                    if (typeof value != 'undefined') {
                        return $('<td>').html(value);
                    }
                    return "";
                });
            row.append(cells);
        }
        this.tableBody.append(row);
    }.bind(this));
};

/**
 * Add row to the table
 *
 * Insert row at a position idx or last if idx is undefined
 *
 * @param {Object} row data
 * @param {number} [idx] index row position
 **/
Table.prototype.add = function (row, idx) {
    if (this.data == null) {
        this.data = [];
    }
    if (undefined !== idx) {
        this.data.splice(idx, 0, row);
    } else {
        this.data.push(row);
    }
    this.render();
};

/**
 * Removes a row if predicate is satisfied
 *
 * If none element matches, nothing will be removed
 *
 * @param {function} predicate if true element
 *  will be removed
 **/
Table.prototype.removeIf = function (predicate) {
    var idx = this.data.findIndex(predicate);
    if (idx >= 0) {
        this.data.splice(idx, 1);
        this.render();
    }
};

/**
 * Table header definition prototype
 *
 * @param {Object} config header config object
 * @param {string} [config.languageId] language id for header cell text
 * @param {string} [config.name] field name reference
 * @param {number} [config.span] span columns together
 * @param {string} [config.text] cell text
 */
function TableHeader(config) {
    this.languageId = config.languageId;
    this.name = config.name;
    this.span = config.span;
    this.text = config.text;
}

/**
 * Creates header cell html object
 *
 * @returns {Object} jquery table header cell object
 */
 TableHeader.prototype.render = function () {
     if (this.languageId) {
         if (Array.isArray(this.languageId)) {
             var th = $('<th>', { colspan: this.span });
             for (var i = 0; i < this.languageId.length; i++) {
                th.append(setLanguageStringOfHtmlForCurrentUserAndId($('<div>'),
                    this.languageId[i]));
             }
             return th;
         }
         return setLanguageStringOfHtmlForCurrentUserAndId($('<th>', {
             colspan: this.span
         }), this.languageId);
     }
     return $('<th>', {
         colspan: this.span,
         text: this.text
     });
};

/**
 * Table row definition prototype
 *
 * @param {TableHeader[]} elements table header array
 **/
function TableRow(elements) {
    this.elements = elements;
}

/**
 * Table cell definition prototype
 *
 * @param {Object} config properties map used in
 *  jquery construction of a cell object
 **/
function TableCell(config) {
    this.config = config;
}

/**
 * Creates cell html object
 *
 * @returns {Object} jquery table cell object
 **/
TableCell.prototype.render = function () {
    return $('<td>', this.config);
};
