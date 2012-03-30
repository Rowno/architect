/*jslint browser: true */
/*globals Mustache: false, ace: false, require: false */

(function (document, Mustache, ace, require) {
    'use strict';

    var JSONMode = require("ace/mode/json").Mode,
        HTMLMode = require("ace/mode/html").Mode,
        template = ace.edit('template'),
        view = ace.edit('view'),
        viewElement = document.getElementById('view'),
        result = ace.edit('result');


    template.getSession().setMode(new HTMLMode());
    template.getSession().setValue(document.getElementById('template-default').innerHTML);
    view.getSession().setMode(new JSONMode());
    view.getSession().setValue(document.getElementById('view-default').innerHTML);
    result.getSession().setMode(new HTMLMode());
    result.setReadOnly(true);

    function render() {
        var json = {};

        try {
            json = JSON.parse(view.getSession().getValue());
            viewElement.classList.remove('error');
        } catch (e) {
            viewElement.classList.add('error');
        }

        result.getSession().setValue(Mustache.to_html(template.getSession().getValue(), json));
    }

    template.getSession().on('change', render);
    view.getSession().on('change', render);

    render();
}(document, Mustache, ace, require));