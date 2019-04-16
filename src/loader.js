const twing = require('twing');

module.exports = function loader() {
    try {
        const loader = new twing.TwingLoaderRelativeFilesystem();
        const tw = new twing.TwingEnvironment(loader);
        const html = tw.render(this.resource);
        return html;
    }
    catch (e) {
        console.log(e);
    }
}