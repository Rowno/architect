/*globals self: false, importScripts: false */

(function () {
    'use strict';

    var activeEngine,
        engines = {
            dot: function (template, view, callback) {
            },
            ejs: function (template, view, callback) {
                callback(null, require('ejs').render(template, view));
            },
            haml: function (template, view, callback) {
            },
            handlebars: function (template, view, callback) {
            },
            hogan: function (template, view, callback) {
            },
            jade: function (template, view, callback) {
            },
            'john-resig-micro': function (template, view, callback) {
            },
            mustache: function (template, view, callback) {
                callback(null, Mustache.to_html(template, view));
            },
            pure: function (template, view, callback) {
            },
            underscore: function (template, view, callback) {
            }
        };


    self.addEventListener('message', function (e) {
        switch (e.data.cmd) {
        case 'init':
            activeEngine = e.data.id;
            importScripts('engines/' + activeEngine + '.min.js');
            break;

        case 'render':
            engines[activeEngine](e.data.template, e.data.view, function (error, result) {
                self.postMessage({
                    error: error,
                    result: result
                });
            });
            break;
        }
    }, false);
}());
