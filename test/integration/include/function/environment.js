const {TwingEnvironment, TwingLoaderRelativeFilesystem, TwingLoaderChain} = require("twing");

module.exports = new TwingEnvironment(
    new TwingLoaderChain([
        new TwingLoaderRelativeFilesystem()
    ])
);