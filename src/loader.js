const twing = require('twing');
const path = require('path');

module.exports = async function loader() {
    const loader = new twing.TwingLoaderRelativeFilesystem();
    const tw = new twing.TwingEnvironment(loader);

    tw.on('template', (tplName, from) => {
        from = from ? from : {path: ''};
        let toLoad = path.normalize(path.dirname(from.path) + '/' + tplName);
        this.addDependency(toLoad);
    });

    try {
        return await tw.render(this.resource);
    }
    catch (e) {
        console.log(e);
    }
}
