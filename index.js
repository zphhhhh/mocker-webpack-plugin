/*!
 * mocker-webpack-plugin
 * (c) 2019-2019 zphhhhh
 * Released under the MIT License.
 */
const fs = require('fs');
const path = require('path');
const micromatch = require('micromatch');
const bodyParser = require('body-parser');

class MockerWebpackPlugin {
    options = {
        path: '',
        mode: 'before'
    };

    /**
     * store keys of devServer.proxy
     * @type {string[]}
     */
    proxyUrls = [];

    /**
     * pad the mock file in turn, `/api/user` may be mapped to
     * `/api/user.js`, `/api/user.json`, `/api/user/index.js`
     * and so on.
     * @type {string[]}
     */
    FILES = ['.js', '.json', '/index.js', '/index.json', ''];

    /**
     * generete options
     * @param {MockerOptions} options
     */
    constructor(options) {
        this.options = Object.assign(this.options, options);
        this.mockMiddleware = this.mockMiddleware.bind(this);
        this.checkProxyMiddleware = this.checkProxyMiddleware.bind(this);
        this.urlEncodedMiddleware = this.urlEncodedMiddleware.bind(this);
    }

    apply(compiler) {
        compiler.hooks.afterPlugins.tap('MockerWebpackPlugin', compiler => {
            const { context, devServer } = compiler.options;

            if (!devServer) {
                throw Error('The mocker-webpack-plugin could run only with WebpackDevServer!');
            }

            if (devServer.proxy) {
                if (Array.isArray(devServer.proxy)) {
                    // proxy ===
                    // [
                    //     { context, target },
                    //     { context, target },
                    //     ...
                    // ]
                    this.proxyUrls = devServer.proxy.map(item => item.context).flat();
                } else {
                    // proxy ===
                    // {
                    //     'api1': { target },
                    //     'api2': { target },
                    //     ...
                    // }
                    this.proxyUrls = Object.keys(devServer.proxy);
                }
            }

            this.options.path = this.options.path || path.join(context, 'mocks');

            this.mock(devServer);
        });
    }

    /**
     * install devServer mock
     * @param {Object} devServer 
     */
    mock(devServer) {
        const mode = this.options.mode;
        const preMode = devServer[mode];

        devServer[mode] = app => {
            if (preMode && typeof preMode === 'function') {
                preMode(app);
            }

            app.use(this.checkProxyMiddleware);
            app.use(this.urlEncodedMiddleware);
            app.use(this.mockMiddleware);
        };
    }

    /**
     * check-proxy middleware for WebpackDevServer(Express),
     * tag `_isMatched` to `req`
     * @param {Object} req ref: `http://expressjs.com/en/4x/api.html#req` 
     * @param {Object} res ref: `http://expressjs.com/en/4x/api.html#res`
     * @param {function} next invoke function `next`
     */
    checkProxyMiddleware(req, res, next) {
        const pathname = req.url.split('?')[0];
        req._isMatched = this.proxyUrls.some(item => micromatch.isMatch(pathname, item));

        next();
    }

    /**
     * body-parser middleware for WebpackDevServer(Express),
     * parser body if not be matched, or delete the `_isMatched` tag from `req`
     * @param {Object} req ref: `http://expressjs.com/en/4x/api.html#req` 
     * @param {Object} res ref: `http://expressjs.com/en/4x/api.html#res`
     * @param {function} next invoke function `next`
     */
    urlEncodedMiddleware(req, res, next) {
        if (req._isMatched) {
            next();
        } else {
            bodyParser.urlencoded({ extended: false })(req, res, next);
        }
    }

    /**
     * mock middleware for WebpackDevServer(Express)
     * @param {Object} req ref: `http://expressjs.com/en/4x/api.html#req` 
     * @param {Object} res ref: `http://expressjs.com/en/4x/api.html#res`
     * @param {function} next invoke function `next`
     */
    mockMiddleware(req, res, next) {
        if (req._isMatched) {
            delete req._isMatched;
            next();
            return;
        }

        const pathname = req.url.split('?')[0];
        const base = this.options.path + pathname;

        const success = this.FILES.map(n => base + n).some(file => {
            if (fs.existsSync(file) && fs.statSync(file).isFile()) {
                let result = require(file);

                if (typeof result === 'function') {
                    result = result(req, res);
                }

                if (typeof result === 'object') {
                    res.send(result);
                }

                delete require.cache[require.resolve(file)];
                return true;
            }
            return false;
        });

        if (!success) {
            next();
        }
    };
}

module.exports = MockerWebpackPlugin;
