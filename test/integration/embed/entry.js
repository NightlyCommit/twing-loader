let tpl = require('./index.twig');

if (typeof tpl === 'function') {
    tpl = tpl({
        foo: 'BAR'
    });
}

module.exports = tpl;