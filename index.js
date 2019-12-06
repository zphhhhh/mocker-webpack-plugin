/*!
 * mocker-webpack-plugin
 * (c) 2019-2019 zphhhhh
 * Released under the MIT License.
 */
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

class MockerWebpackPlugin {
    /**
     * generete options
     * @param {MockerOptions} options
     */
    constructor(options) {
        this.options = Object.assign({
            path: ''
        }, options);

        /**
         * pad the mock file in turn, `/api/user` may be mapped to
         * `/api/user.js`, `/api/user.json`, `/api/user/index.js`
         * and so on.
         */
        this.FILES = ['.js', '.json', '/index.js', '/index.json', ''];

        this.mockMiddleware = this.mockMiddleware.bind(this);
    }

    apply(compiler) {
        compiler.hooks.afterPlugins.tap('MockerWebpackPlugin', compiler => {
            const { context, devServer } = compiler.options;

            if (!devServer) {
                throw Error('The mocker-webpack-plugin could run only with WebpackDevServer!');
            }

            if (!this.options.path) {
                this.options.path = path.join(context, 'mocks');
            }

            this.mock(devServer);
        });
    }

    /**
     * install devServer mock
     * @param {Object} devServer 
     */
    mock(devServer) {
        const preAfter = devServer.after;

        devServer.after = app => {
            if (preAfter && typeof preAfter === 'function') {
                preAfter(app);
            }

            app.use(bodyParser({extended: false}));
            app.use(this.mockMiddleware);
        };
    }

    /**
     * mock middleware for WebpackDevServer(Express)
     * @param {Object} req ref: `http://expressjs.com/en/4x/api.html#req` 
     * @param {Object} res ref: `http://expressjs.com/en/4x/api.html#res`
     * @param {function} next invoke function `next`
     */
    mockMiddleware(req, res, next) {
        const base = this.options.path + req.url.split('?')[0];

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
