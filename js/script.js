/*jslint browser: true */
/*globals Mustache: false, ace: false, require: false */

(function (Mustache, ace, require) {
    'use strict';

    var SAVE_INTERVAL = 5000,
        activeEngine = 'mustache',
        worker = new Worker('js/worker.js'),
        JSONMode = require("ace/mode/json").Mode,
        HTMLMode = require("ace/mode/html").Mode,
        templateEditor = ace.edit('template'),
        viewEditor = ace.edit('view'),
        resultEditor = ace.edit('result'),
        templateElement = document.getElementById('template'),
        viewElement = document.getElementById('view'),
        engineElement = document.getElementById('engine'),
        engineTemplate = document.getElementById('engine-template').innerHTML,
        defaultTemplate = document.getElementById('default-template').innerHTML,
        defaultView = document.getElementById('default-view').innerHTML,
        i,
        selectHtml = '',
        engines = {
            dot: {
                name: 'doT.js',
                version: '0.1.7',
                size: '2.2',
                url: 'https://github.com/olado/doT'
            },
            ejs: {
                name: 'EJS',
                version: '0.6.1',
                size: '6.1',
                url: 'https://github.com/visionmedia/ejs'
            },
            haml: {
                name: 'Haml.js',
                version: '0.4.2',
                size: '8.6',
                url: 'https://github.com/creationix/haml-js'
            },
            handlebars: {
                name: 'Handlebars.js',
                version: '1.0.6beta',
                size: '30.3',
                url: 'https://github.com/wycats/handlebars.js'
            },
            hogan: {
                name: 'Hogan.js',
                version: '2.0.0',
                size: '5.9',
                url: 'https://github.com/twitter/hogan.js'
            },
            jade: {
                name: 'Jade',
                version: '0.21.0',
                size: '34.6',
                url: 'https://github.com/visionmedia/jade'
            },
            'john-resig-micro': {
                name: 'John Resig Micro',
                version: 'N/A',
                size: '0.5',
                url: 'http://ejohn.org/blog/javascript-micro-templating/'
            },
            mustache: {
                name: 'Mustache.js',
                version: '0.4.2',
                size: '4.5',
                url: 'https://github.com/janl/mustache.js',
                render: function (template, view, callback) {
                    callback(null, Mustache.to_html(template, view));
                }
            },
            pure: {
                name: 'PURE',
                version: '2.73',
                size: '11.3',
                url: 'https://github.com/pure/pure'
            },
            underscore: {
                name: 'Underscore.js',
                version: '1.3.1',
                size: '12.1',
                url: 'https://github.com/documentcloud/underscore'
            }
        };


    // Restore application state
    try {
        defaultTemplate = localStorage.getItem('architect.template') || defaultTemplate;
        defaultView = localStorage.getItem('architect.view') || defaultView;
    } catch (e) {}


    // Initialise the engine select
    for (i in engines) {
        if (engines.hasOwnProperty(i)) {
            selectHtml += Mustache.to_html(engineTemplate, {
                id: i,
                name: engines[i].name,
                selected: i === activeEngine
            });
        }
    }
    engineElement.innerHTML = selectHtml;


    // Initialise the editors
    templateEditor.getSession().setMode(new HTMLMode());
    templateEditor.getSession().setValue(defaultTemplate);
    viewEditor.getSession().setMode(new JSONMode());
    viewEditor.getSession().setValue(defaultView);
    resultEditor.getSession().setMode(new HTMLMode());
    resultEditor.setReadOnly(true);


    function render() {
        var json = {},
            view = viewEditor.getSession().getValue(),
            template = templateEditor.getSession().getValue();

        try {
            json = JSON.parse(view);
            viewElement.classList.remove('error');
        } catch (e) {
            viewElement.classList.add('error');
        }

        engines[activeEngine].render(template, json, function (error, result) {
            if (error) {
                templateElement.classList.add('error');
            } else {
                templateElement.classList.remove('error');
                resultEditor.getSession().setValue(result);
            }
        });
    }


    // Event handlers
    templateEditor.getSession().on('change', render);
    viewEditor.getSession().on('change', render);

    engineElement.addEventListener('change', function () {
        activeEngine = engineElement.value;
    }, false);


    // Initial render
    render();


    // Save application state
    setInterval(function () {
        var view = viewEditor.getSession().getValue(),
            template = templateEditor.getSession().getValue();

        try {
            localStorage.setItem('architect.template', template);
            localStorage.setItem('architect.view', view);
        } catch (e) {}
    }, SAVE_INTERVAL);
}(Mustache, ace, require));
