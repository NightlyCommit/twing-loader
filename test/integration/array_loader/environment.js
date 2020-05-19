const {TwingEnvironment, TwingLoaderRelativeFilesystem, TwingLoaderChain, TwingLoaderArray} = require("twing");

module.exports = new TwingEnvironment(
    new TwingLoaderChain([
        new TwingLoaderRelativeFilesystem(),
        new TwingLoaderArray({
            bar: 'BAR FROM THE ARRAY LOADER'
        })
    ])
);
