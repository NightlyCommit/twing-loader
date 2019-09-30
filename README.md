# twing-loader
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage percentage][coveralls-image]][coveralls-url]

Webpack loader for Twig templates, based on [Twing](https://www.npmjs.com/package/twing).

## Prerequisites

* Webpack 4
* Twing 3.0.1

## Installation

`npm install twing-loader`

## Usage

twing-loader comes with two available behaviors. Depending on your need, you can use one or the other by setting the `renderContext` option accordingly.

### Render at runtime

By default, twing-loader transforms a Twig template to a function that, when called with some optional data, renders the template:

<sub>webpack.config.js</sub>

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
                            environmentModulePath: require.resolve('./environment.js')
                        }
                    }
                ]
            }
        ]
    }
}
```

<sub>environment.js</sub>

```javascript
const {TwingEnvironment, TwingLoaderRelativeFilesystem} = require("twing");

module.exports = new TwingEnvironment(
    new TwingLoaderRelativeFilesystem()
);
```

<sub>index.twig</sub>

```twig
{{ foo }}
```

<sub>index.js</sub>

```javascript
let template = require('./index.twig');

let renderedTemplate = template({
    foo: 'bar'
}); // "bar"
```

This behavior, known as _render at runtime_, comes at the cost of having Twing as part of the bundle.

### Render at compile time

When `renderContext` is _defined_, twing-loader transforms a Twig template to the result of the template rendering:

<sub>webpack.config.js</sub>

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
                            environmentModulePath: require.resolve('./environment.js'),
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

<sub>environment.js</sub>

```javascript
const {TwingEnvironment, TwingLoaderRelativeFilesystem} = require("twing");

module.exports = new TwingEnvironment(
    new TwingLoaderRelativeFilesystem()
);
```

<sub>index.twig</sub>

```twig
{{ foo }}
```

<sub>index.js</sub>

```javascript
let renderedTemplate = require('./index.twig'); // "bar"
```

This second behavior, known as _render at compile time_, comes with the benefit of not having Twing as part of the bundle.

## Options

|Name|Required|Type|Default|Description|
|---|:---:|:---:|:---:|---|
|environmentModulePath|`true`|string|`undefined`| The absolute path or the identifier to the module that exports the `TwingEnvironment` instance that will be used by the loader to compile (and render) the templates at compile time and in the bundle to render them at runtime.|
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
