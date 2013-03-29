/*global
    self: false,
    doT: false,
    dust: false,
    ejs: false,
    Handlebars: false,
    Hogan: false,
    jade: false,
    Mustache: false,
    _: false
*/

(function (self) {
    'use strict';

    var activeEngine,
        engines = {
            dot: function (template, view, callback) {
                var compiledTemplate = doT.template(template);
                callback(null, compiledTemplate(view));
            },
            dust: function (template, view, callback) {
                dust.renderSource(template, view, callback);
            },
            ejs: function (template, view, callback) {
                try {
                    callback(null, ejs.render(template, view));
                } catch (error) {
                    // Strip the ReferenceError cruft
                    if (error.name === 'ReferenceError') {
                        var lastLineIndex = error.message.lastIndexOf('\n');
                        callback(error.message.substring(lastLineIndex));
                    } else {
                        throw error;
                    }
                }
            },
            handlebars: function (template, view, callback) {
                var compiledTemplate = Handlebars.compile(template);
                callback(null, compiledTemplate(view));
            },
            hogan: function (template, view, callback) {
                var compiledTemplate = Hogan.compile(template);
                callback(null, compiledTemplate.render(view));
            },
            jade: function (template, view, callback) {
                var compiledTemplate = jade.compile(template);
                callback(null, compiledTemplate(view));
            },
            mustache: function (template, view, callback) {
                /*jshint camelcase: false */
                callback(null, Mustache.to_html(template, view));
            },
            underscore: function (template, view, callback) {
                callback(null, _.template(template, view));
            }
        };


    self.addEventListener('message', function (event) {
        switch (event.data.cmd) {
        case 'init':
            activeEngine = event.data.id;
            self.importScripts('engines/' + activeEngine + '.min.js');
            break;

        case 'render':
            try {
                engines[activeEngine](event.data.template, event.data.view, function (error, result) {
                    self.postMessage({
                        error: error,
                        result: result
                    });
                });
            } catch (error) {
                self.postMessage({
                    error: error.message,
                    result: null
                });
            }
            break;
        }
    }, false);
}(self));
