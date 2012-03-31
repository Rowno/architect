(function () {
    'use strict';

    importScripts('engines/mustache.min.js');

    var engines = {
        dot: function (template, view, callback) {
        },
        ejs: function (template, view, callback) {
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

    self.addEventListener('message', function(e) {
        engines.mustache(e.data.template, e.data.view, function (error, result) {
            self.postMessage(result);
        });
    }, false);
}());
