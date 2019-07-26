const {TwingEnvironment, TwingLoaderRelativeFilesystem, TwingLoaderChain, TwingLoaderArray} = require("twing");

module.exports = new TwingEnvironment(
    new TwingLoaderChain([
        new TwingLoaderRelativeFilesystem()
    ])
);