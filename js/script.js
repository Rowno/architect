/*jslint browser: true */
/*globals Hogan: false, ace: false, require: false */

if (!Architect) {
    var Architect = {};
}


/**
 * Singleton that encapsulates the defined templating engines.
 */
(function (Architect) {
    'use strict';

    var engines = [
            {
                id: 'dot',
                name: 'doT.js',
                version: '0.1.7',
                size: '1.2',
                source: 'https://github.com/olado/doT'
            },
            {
                id: 'ejs',
                name: 'EJS',
                version: '0.6.1',
                size: '2.5',
                source: 'https://github.com/visionmedia/ejs'
            },
            {
                id: 'handlebars',
                name: 'Handlebars.js',
                version: '1.0.6beta',
                size: '9.6',
                source: 'https://github.com/wycats/handlebars.js'
            },
            {
                id: 'hogan',
                name: 'Hogan.js',
                version: '2.0.0',
                size: '2.8',
                source: 'https://github.com/twitter/hogan.js'
            },
            {
                id: 'jade',
                name: 'Jade',
                version: '0.21.0',
                size: '9.3',
                source: 'https://github.com/visionmedia/jade'
            },
            {
                id: 'mustache',
                name: 'Mustache.js',
                version: '0.4.2',
                size: '2.2',
                source: 'https://github.com/janl/mustache.js'
            },
            {
                id: 'underscore',
                name: 'Underscore.js',
                version: '1.3.1',
                size: '4.4',
                source: 'https://github.com/documentcloud/underscore'
            }
        ],
        activeEngine = engines[0],
        exports = {};


    // Initialise engines' default template
    engines.forEach(function (engine) {
        engine.template = document.getElementById('template-default-' +
            engine.id).innerHTML;
    });


    /**
     * Gets the active engine.
     *
     * @returns {object} Map of the engine's info.
     */
    function getActiveEngine() {
        return activeEngine;
    }
    exports.getActiveEngine = getActiveEngine;


    /**
     * Sets the active engine.
     *
     * @param {string} engineId ID of the engine.
     */
    function setActiveEngine(engineId) {
        engines.forEach(function (engine) {
            if (engine.id === engineId) {
                activeEngine = engine;
            }
        });
    }
    exports.setActiveEngine = setActiveEngine;


    /**
     * Get all of the defined engines.
     *
     * @returns {array.<object>} Array of maps of the engine info.
     */
    function getEngines() {
        return engines;
    }
    exports.getEngines = getEngines;


    Architect.Engines = exports;
}(Architect));


(function (Architect) {
    'use strict';

    /**
     * A basic object for listening to and emitting events.
     */
    function EventEmitter() {
        if (!(this instanceof EventEmitter)) {
            return new EventEmitter();
        }

        var listeners = {};

        /**
         * Registers an event listener.
         *
         * @param {string} topic Name of the event to listen to.
         * @param {function(data)} callback Function to register as a listener.
         */
        this.on = function (topic, callback) {
            if (!listeners[topic]) {
                listeners[topic] = [];
            }

            listeners[topic].push(callback);
        };

        /**
         * Emits an event.
         *
         * @param {string} topic Name of the event to emit.
         * @param {*} data Data to pass to the event listeners.
         */
        this.emit = function (topic, data) {
            if (listeners[topic]) {
                listeners[topic].forEach(function (callback) {
                    callback(data);
                });
            }
        };
    }
    Architect.EventEmitter = EventEmitter;
}(Architect));


(function (Architect, EventEmitter, Worker) {
    'use strict';

    /**
     * Encaspulates a web worker that renders templates using various engines.
     *
     * @param {string} initEngine Initial templating engine to use.
     */
    function RenderWorker(initEngine) {
        if (!(this instanceof RenderWorker)) {
            return new RenderWorker(initEngine);
        }

        var engine = initEngine,
            worker = new Worker('js/worker.js'),
            events = new EventEmitter(),
            commands = {
                init: function () {
                    worker.postMessage({
                        cmd: 'init',
                        id: engine.id
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


        /**
         * Initialises the web worker.
         */
        function init() {
            worker.addEventListener('message', function (event) {
                events.emit('complete', event.data);
            }, false);

            commands.init();
        }


        /**
         * Changes the templating engine.
         *
         * @param {string} newEngine New templating engine to use.
         */
        this.changeEngine = function (newEngine) {
            engine = newEngine;

            worker.terminate();
            worker = new Worker('js/worker.js');
            init();
        };

        /**
         * Requests a template to be rendered.
         *
         * The 'complete' event is emitted when the template has been rendered.
         *
         * @param {string} template Template to render.
         * @param {object} view Variables to pass to the template.
         * @see RenderWorker.on()
         */
        this.render = function (template, view) {
            commands.render(template, view);
        };

        /**
         * Registers an event listener.
         *
         * Available events:
         * 'complete' - Emitted when a template has been rendered. Is passed an
         *              object containing 'result' and 'error' properties.
         *
         * @param {string} topic Name of the event to listen to.
         * @param {function(data)} callback Function to register as a listener.
         */
        this.on = function (topic, callback) {
            events.on.call(events, topic, callback);
        };

        init();
    }
    Architect.RenderWorker = RenderWorker;
}(Architect, Architect.EventEmitter, window.Worker));


(function (Architect, Engines, RenderWorker, Hogan, ace, require, document, location, applicationCache, localStorage, setInterval, confirm) {
    'use strict';

        // Constants
    var SAVE_INTERVAL = 5000,

        // Misc
        renderingWorker,
        temp,

        // Editors
        JSONMode = require('ace/mode/json').Mode,
        HTMLMode = require('ace/mode/html').Mode,
        templateEditor = ace.edit('template'),
        templateEditorContent = '',
        viewEditor = ace.edit('view'),
        viewEditorDefault = document.getElementById('view-default').innerHTML,
        viewEditorContent = '',
        resultEditor = ace.edit('result'),

        // Cached DOM elements
        templateElement = document.getElementById('template'),
        templateErrorElement = document.getElementById('template-error'),
        viewElement = document.getElementById('view'),
        viewErrorElement = document.getElementById('view-error'),
        engineElement = document.getElementById('engine'),
        engineInfoElement = document.getElementById('engine-info'),
        resetElement = document.getElementById('reset'),

        // Hogan templates
        engineTemplate = Hogan.compile(
            document.getElementById('engine-template').innerHTML
        ),
        engineInfoTemplate = Hogan.compile(
            document.getElementById('engine-info-template').innerHTML
        );


    /**
     * Sends the current state of the editors to be rendered by the web worker.
     */
    function render() {
        var json = {},
            view = viewEditor.getSession().getValue(),
            template = templateEditor.getSession().getValue();

        try {
            json = JSON.parse(view);
            viewElement.setAttribute('aria-invalid', false);
            viewErrorElement.setAttribute('aria-hidden', true);
        } catch (error) {
            viewElement.setAttribute('aria-invalid', true);
            viewErrorElement.textContent = 'syntax error';
            viewErrorElement.setAttribute('aria-hidden', false);
        }

        renderingWorker.render(template, json);
    }


    // Load application state
    if (localStorage) {
        try {
            temp = localStorage.getItem('architect.engine');
            if (temp) {
                Engines.setActiveEngine(temp);
            }

            templateEditorContent = localStorage.getItem('architect.template') ||
                Engines.getActiveEngine().template;

            viewEditorContent = localStorage.getItem('architect.view') ||
                viewEditorDefault;
        } catch (error) {}
    }


    // Initialise the web worker
    renderingWorker = new RenderWorker(Engines.getActiveEngine());


    // Initialise the engine select
    temp = '';
    Engines.getEngines().forEach(function (engine) {
        temp += engineTemplate.render({
            id: engine.id,
            name: engine.name,
            selected: engine.id === Engines.getActiveEngine().id
        });
    });
    engineElement.innerHTML = temp;

    engineInfoElement.innerHTML = engineInfoTemplate.render(
        Engines.getActiveEngine()
    );


    // Initialise the editors
    templateEditor.getSession().setMode(new HTMLMode());
    templateEditor.getSession().setValue(templateEditorContent);
    viewEditor.getSession().setMode(new JSONMode());
    viewEditor.getSession().setValue(viewEditorContent);
    resultEditor.getSession().setMode(new HTMLMode());
    resultEditor.setReadOnly(true);


    // Event handlers

    templateEditor.getSession().on('change', render);
    viewEditor.getSession().on('change', render);


    engineElement.addEventListener('change', function () {
        var previousEngine = Engines.getActiveEngine();

        Engines.setActiveEngine(engineElement.value);

        engineInfoElement.innerHTML = engineInfoTemplate.render(
            Engines.getActiveEngine()
        );

        // Only reset the template editor if the content has been changed
        if (previousEngine.template === templateEditor.getSession().getValue()) {
            templateEditor.getSession().setValue(Engines.getActiveEngine().template);
        }

        renderingWorker.changeEngine(Engines.getActiveEngine());
        render();
    }, false);


    resetElement.addEventListener('click', function () {
        templateEditor.getSession().setValue(Engines.getActiveEngine().template);
        viewEditor.getSession().setValue(viewEditorDefault);
    }, false);


    renderingWorker.on('complete', function (data) {
        if (data.error) {
            templateElement.setAttribute('aria-invalid', true);
            templateErrorElement.textContent = data.error;
            templateErrorElement.setAttribute('aria-hidden', false);
            resultEditor.getSession().setValue('');
        } else {
            templateElement.setAttribute('aria-invalid', false);
            templateErrorElement.setAttribute('aria-hidden', true);
            resultEditor.getSession().setValue(data.result);
        }
    });


    // Initial render
    render();


    // Notify about new cache version
    if (applicationCache) {
        applicationCache.addEventListener('updateready', function () {
            if (applicationCache.status === applicationCache.UPDATEREADY) {
                if (confirm('An updated version of Architect is available. Load it?')) {
                    location.reload(true);
                }
            }
        }, false);
    }


    // Save application state
    if (localStorage) {
        setInterval(function () {
            var view = viewEditor.getSession().getValue(),
                template = templateEditor.getSession().getValue();

            try {
                localStorage.setItem('architect.engine', Engines.getActiveEngine().id);
                localStorage.setItem('architect.template', template);
                localStorage.setItem('architect.view', view);
            } catch (error) {}
        }, SAVE_INTERVAL);
    }
}(Architect, Architect.Engines, Architect.RenderWorker, Hogan, ace, require, document, location, window.applicationCache, window.localStorage, window.setInterval, window.confirm));
