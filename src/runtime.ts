import {TwingEnvironment, TwingLoaderChain, TwingLoaderArray, TwingCacheNull, TwingTemplate} from "twing";

class CustomCache extends TwingCacheNull {
    private _templates: Map<string, string>;

    constructor() {
        super();

        /**
         * @type {Map<string, string>}
         */
        this._templates = new Map();
        this.TwingCacheInterfaceImpl = this;
    }

    /**
     * Generates a cache key for the given template class name.
     *
     * @param {string} name The template name
     * @param {string} className The template class name
     *
     * @return string
     */
    generateKey(name: string, className: string): string {
        return className;
    }

    /**
     * Writes the compiled template to cache.
     *
     * @param {string} key The cache key
     * @param {string} content The template representation as a PHP class
     */
    write(key: string, content: any) {
        if (typeof content === 'string') {
            content = new Function(`let module = {
    exports: undefined
};

${content}

return module.exports;
`);
        }

        this._templates.set(key, content);
    };

    /**
     * Loads a template from the cache.
     *
     * @param {string} key The cache key
     */
    load(key: string): (Runtime: any) => { [s: string]: new(e: TwingEnvironment) => TwingTemplate } {
        if (!this._templates.has(key)) {
            return super.load(key);
        }

        return this._templates.get(key) as any;
    }

    /**
     * Returns the modification timestamp of a key.
     *
     * @param {string} key The cache key
     *
     * @returns {number}
     */
    getTimestamp(key: string): number {
        return null;
    }
}

/**
 * Custom loader used to provide a predictable cache key.
 */
class CustomLoader extends TwingLoaderArray {
    private _templatesMap: Map<string, string>;

    constructor(templatesMap: Map<string, string> = new Map()) {
        super({});

        this._templatesMap = templatesMap;
    }

    getCacheKey(name: string) {
        return name;
    }

    addTemplateKey(name: string, key: string) {
        this._templatesMap.set(name, key);
    }

    /**
     * Needed because TwingLoaderChain::getCacheKey calls exists() on the loaders.
     */
    exists(name: string): boolean {
        return this._templatesMap.has(name);
    }
}

let environment: TwingEnvironment;

export const cache = new CustomCache();
export const loader = new CustomLoader();
export const getEnvironment = (env: TwingEnvironment) => {
    if (!environment) {
        env.setLoader(new TwingLoaderChain([loader, env.getLoader()]));
        env.setCache(cache);

        environment = env;
    }

    return environment;
};
