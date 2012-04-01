/*jslint browser: true */
/*globals Mustache: false, ace: false, require: false */

(function (mustache, ace, require, document, localStorage, Worker, console, setInterval) {
    'use strict';

    var SAVE_INTERVAL = 5000,
        activeEngine = 'mustache',
        renderingWorker,
        JSONMode = require('ace/mode/json').Mode,
        HTMLMode = require('ace/mode/html').Mode,
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
            mustache: {
                name: 'Mustache.js',
                version: '0.4.2',
                size: '4.5',
                url: 'https://github.com/janl/mustache.js'
            },
            underscore: {
                name: 'Underscore.js',
                version: '1.3.1',
                size: '12.1',
                url: 'https://github.com/documentcloud/underscore'
            }
        };


    function EventEmitter() {
        if (!(this instanceof EventEmitter)) {
            return new EventEmitter();
        }

        var listeners = {};

        this.on = function (topic, callback) {
            if (!listeners[topic]) {
                listeners[topic] = [];
            }

            listeners[topic].push(callback);
        };

        this.emit = function (topic, data) {
            if (listeners[topic]) {
                listeners[topic].forEach(function (callback) {
                    callback(data);
                });
            }
        };
    }


    function RenderingWorker(initEngine) {
        if (!(this instanceof RenderingWorker)) {
            return new RenderingWorker(initEngine);
        }

        var engine = initEngine,
            worker = new Worker('js/worker.js'),
            events = new EventEmitter(),
            commands = {
                init: function () {
                    worker.postMessage({
                        cmd: 'init',
                        id: engine
                    });
                },
                render: function (template, view) {
                    worker.postMessage({
                        cmd: 'render',
                        template: template,
                        view: view
                    });
                }
            };


        function init() {
            worker.addEventListener('message', function (event) {
                events.emit('message', event.data);
            }, false);

            commands.init();
        }


        this.changeEngine = function (newEngine) {
            engine = newEngine;

            worker.terminate();
            worker = new Worker('js/worker.js');
            init();
        };

        this.render = function (template, view) {
            commands.render(template, view);
        };

        this.on = function (topic, callback) {
            events.on.call(events, topic, callback);
        };

        init();
    }


    // Restore application state
    try {
        activeEngine = localStorage.getItem('architect.engine') || activeEngine;
        defaultTemplate = localStorage.getItem('architect.template') || defaultTemplate;
        defaultView = localStorage.getItem('architect.view') || defaultView;
    } catch (error) {}


    // Initialise the web worker
    renderingWorker = new RenderingWorker(activeEngine);


    // Initialise the engine select
    for (i in engines) {
        if (engines.hasOwnProperty(i)) {
            selectHtml += mustache.to_html(engineTemplate, {
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
        } catch (error) {
            viewElement.classList.add('error');
        }

        renderingWorker.render(template, json);
    }


    // Event handlers
    templateEditor.getSession().on('change', render);
    viewEditor.getSession().on('change', render);

    engineElement.addEventListener('change', function () {
        activeEngine = engineElement.value;
        renderingWorker.changeEngine(activeEngine);
        render();
    }, false);

    renderingWorker.on('message', function (data) {
        if (data.error) {
            if (console) {
                console.error(data.error);
            }
            templateElement.classList.add('error');
            resultEditor.getSession().setValue('');
        } else {
            templateElement.classList.remove('error');
            resultEditor.getSession().setValue(data.result);
        }
    });


    // Initial render
    render();


    // Save application state
    setInterval(function () {
        var view = viewEditor.getSession().getValue(),
            template = templateEditor.getSession().getValue();

        try {
            localStorage.setItem('architect.engine', activeEngine);
            localStorage.setItem('architect.template', template);
            localStorage.setItem('architect.view', view);
        } catch (error) {}
    }, SAVE_INTERVAL);
}(Mustache, ace, require, document, localStorage, Worker, console, setInterval));
