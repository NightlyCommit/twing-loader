# Twing loader
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage percentage][coveralls-image]][coveralls-url]

Webpack loader that compiles Twig templates with [Twing](https://www.npmjs.com/package/twing).

## Prerequisites

* Webpack 4
* Twing 2.3.3

## Installation

`npm install twing-loader`

## Usage

Add twing-loader to your Webpack configuration:

```js
module.exports = {
  //...
 
  module: {
    rules: [
      {
        test: /\.twig$/,
        use: {
          loader: 'twing-loader',
          options: {
              environment_module_path: 'path/to/your/environment/module',
          }
        }
      }
    ]
  }
};
```

From there, you can require Twig templates and run the returned function to render it, optionally passing some data:

```js
let template = require('./index.twig');

let renderedTemplate = template({
    foo: 'bar'
});
```

## Options

* `environment_module_path`: a path to the module that exports the `TwingEnvironment` instance that will be used by the loader to compile the templates and by the bundle to render them at runtime.

## Contributing

* Fork this repository
* Code
* Implement tests using [tape](https://github.com/substack/tape)
* Issue a pull request keeping in mind that all pull requests must reference an issue in the issue queue

[npm-image]: https://badge.fury.io/js/twing-loader.svg
[npm-url]: https://npmjs.org/package/twing-loader
[travis-image]: https://travis-ci.org/nicolasRdr/twing-loader.svg?branch=master
[travis-url]: https://travis-ci.org/nicolasRdr/twing-loader
[coveralls-image]: https://coveralls.io/repos/github/nicolasRdr/twing-loader/badge.svg
[coveralls-url]: https://coveralls.io/github/nicolasRdr/twing-loader
