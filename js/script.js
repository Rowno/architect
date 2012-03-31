/*jslint browser: true */
/*globals Mustache: false, ace: false, require: false */

(function (Mustache, ace, require) {
    'use strict';

    var SAVE_INTERVAL = 5000,
        JSONMode = require("ace/mode/json").Mode,
        HTMLMode = require("ace/mode/html").Mode,
        templateEditor = ace.edit('template'),
        viewEditor = ace.edit('view'),
        viewElement = document.getElementById('view'),
        resultEditor = ace.edit('result'),
        defaultTemplate = document.getElementById('default-template').innerHTML,
        defaultView = document.getElementById('default-view').innerHTML;


    // Restore application state
    try {
        defaultTemplate = localStorage.getItem('template-tester.template') || defaultTemplate;
        defaultView = localStorage.getItem('template-tester.view') || defaultView;
    } catch (e) {}


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

        result.getSession().setValue(Mustache.to_html(template, json));
    }

    templateEditor.getSession().on('change', render);
    viewEditor.getSession().on('change', render);

    render();

    // Save application state
    setInterval(function () {
        var view = viewEditor.getSession().getValue(),
            template = templateEditor.getSession().getValue();

        try {
            localStorage.setItem('template-tester.template', template);
            localStorage.setItem('template-tester.view', view);
        } catch (e) {}
    }, SAVE_INTERVAL);
}(Mustache, ace, require));
