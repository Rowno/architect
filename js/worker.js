/*globals self: false, importScripts: false */

(function () {
    'use strict';

    var activeEngine,
        engines = {
            dot: function (template, view, callback) {
                var compiledTemplate = doT.template(template);
                callback(null, compiledTemplate(view));
            },
            ejs: function (template, view, callback) {
                callback(null, require('ejs').render(template, view));
            },
            haml: function (template, view, callback) {
                var compiledTemplate = Haml(template);
                callback(null, compiledTemplate(view));
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
                callback(null, Mustache.to_html(template, view));
            },
            underscore: function (template, view, callback) {
                callback(null, _.template(template, view));
            }
        };


    self.addEventListener('message', function (e) {
        switch (e.data.cmd) {
        case 'init':
            activeEngine = e.data.id;
            importScripts('engines/' + activeEngine + '.min.js');
            break;

        case 'render':
            try {
                engines[activeEngine](e.data.template, e.data.view, function (error, result) {
                    self.postMessage({
                        error: error,
                        result: result
                    });
                });
            } catch (e) {
                self.postMessage({
                    error: {
                        name: e.name,
                        message: e.message
                    },
                    result: null
                });
            }
            break;
        }
    }, false);
}());
