Architect - Javascript Template Editor
======================================

Web app for editing Javascript templates in various engines.


Making and Credits
------------------
Architect started life as a simple page for testing Mustache templates, but quickly evolved into a web app for editing templates in all the popular Javascript templating engines.

Architect was made using vanilla DOM methods (no jQuery) and without any polyfills. I did this as a learning experience and to avoid jQuery and polyfill bloat. Since the app is targeted at web developers, browser support shouldn't be a problem (if you're a web developer using an outdated browser, shame on you!).

Below are all the HTML5 features and open source components used by Architect, and what they're used for:

### HTML5

 * JSON - JSON view parsing.
 * Application Cache and LocalStorage - offline access.
 * Web Workers - threaded template rendering and template engine sandboxing.
 * Media Queries - responsive layout.
 * WAI-ARIA - accessibility.

### Components

 * [HTML5 Boilerplate](http://html5boilerplate.com/) - base HTML and app structure.
 * [Twitter Bootstrap](http://twitter.github.com/bootstrap/) - base CSS, components and responsive layout.
 * [Modernizr](http://modernizr.com/) - feature detection and script loading ([yepnope.js](http://yepnopejs.com/)).
 * [Ace](https://github.com/ajaxorg/ace) - code editors.
 * [Hogan.js](https://github.com/twitter/hogan.js) - mustache templates.
 * [HTML5 Please API](http://api.html5please.com/) - user friendly unsupported browser message.


License
-------
Architect is licensed under the [Creative Commons Attribution-ShareAlike 3.0 Unported License](http://creativecommons.org/licenses/by-sa/3.0/).

Copyright 2012, Roland Warmerdam.
