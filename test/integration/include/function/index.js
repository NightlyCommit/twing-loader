module.exports = `${require('./index.twig')({
    foo: true
})}
===
${require('./index.twig')({
    foo: false
})}`;