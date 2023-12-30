let tpl = require('./index.twig');

if (typeof tpl === 'function') {
    tpl = tpl({
        foo: true,
        bar: false
    });
}

module.exports = tpl;