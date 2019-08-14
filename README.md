# Twing loader
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage percentage][coveralls-image]][coveralls-url]

Webpack loader that compiles Twig templates with [Twing](https://www.npmjs.com/package/twing).

## Prerequisites

* Webpack 4
* Twing 2.3.3

## Installation

`npm install twing-loader`

## Usage

twing-loader comes with two available behaviors. Depending on your need, you can use one or the other by setting the `renderContext` option accordingly.

### Render at runtime

By default, twing-loader transforms a Twig template to a function that, when called with some optional data, renders the template:

> webpack.config.js

```javascript
module.exports = {
    entry: 'index.js',
    // ...
    module: {
        rules: [
            {
                test: /\.twig$/,
                use: [
                    {
                        loader: 'twing-loader',
                        options: {
                            environmentModulePath: 'environment.js'
                        }
                    }
                ]
            }
        ]
    }
}
```

> environment.js

```javascript
const {TwingEnvironment, TwingLoaderRelativeFilesystem} = require("twing");

module.exports = new TwingEnvironment(
    new TwingLoaderRelativeFilesystem()
);
```

> index.twig

```twig
{{ foo }}
```

> index.js

```javascript
let template = require('./index.twig');

let renderedTemplate = template({
    foo: 'bar'
}); // "bar"
```

This behavior, known as _render at runtime_, comes at the price of having Twing as part of the bundle.

### Render at compile time

When `renderContext` is _defined_, twing-loader transforms a Twig template to the result of the template rendering:

> webpack.config.js

```javascript
module.exports = {
    entry: 'index.js',
    // ...
    module: {
        rules: [
            {
                test: /\.twig$/,
                use: [
                    {
                        loader: 'twing-loader',
                        options: {
                            environmentModulePath: 'environment.js',
                            renderContext: {
                                foo: 'bar'
                            }
                        }
                    }
                ]
            }
        ]
    }
}
```

> environment.js

```javascript
const {TwingEnvironment, TwingLoaderRelativeFilesystem} = require("twing");

module.exports = new TwingEnvironment(
    new TwingLoaderRelativeFilesystem()
);
```

> index.twig

```twig
{{ foo }}
```

> index.js

```javascript
let renderedTemplate = require('./index.twig'); // "bar"
```

This second behavior, known as _render at compile time_, comes with the benefit of not having Twing as part of the bundle.

## Options

|Name|Required|Type|Default|Description|
|---|:---:|:---:|:---:|---|
|environmentModulePath|`true`|string|`undefined`| A path to the module that exports the `TwingEnvironment` instance that will be used by the loader to compile (and render) the templates at compile-time and by the bundle to render them at runtime.|
|renderContext|`false`|any|`undefined`|If different from `undefined`, enables the _render at compile time_ behavior and serves as context for the rendering of the templates.|

## Contributing

* Fork this repository
* Code
* Implement tests using [tape](https://github.com/substack/tape)
* Issue a pull request keeping in mind that all pull requests must reference an issue in the issue queue

[npm-image]: https://badge.fury.io/js/twing-loader.svg
[npm-url]: https://npmjs.org/package/twing-loader
[travis-image]: https://travis-ci.com/NightlyCommit/twing-loader.svg?branch=master
[travis-url]: https://travis-ci.com/NightlyCommit/twing-loader
[coveralls-image]: https://coveralls.io/repos/github/NightlyCommit/twing-loader/badge.svg
[coveralls-url]: https://coveralls.io/github/NightlyCommit/twing-loader
