# mocker-webpack-plugin

🖐Mock data easily with webpack

### Install

``` shell
npm i -D mocker-webpack-plugin
```

> webpack >= 4.x is supported

### Use

``` javascript
// import
const MockerWebpackPlugin = require("mocker-webpack-plugin")

// Webpack plugin config
new MockerWebpackPlugin()
```

### How to mock?

If you want to request `/api/user`, consider your project path is:

```
Project
├── build
│   └── webpack.conf.js
├── mocks
│   └── api
│       └── user.js     <--- It's here
├── node_modules
└── src
    ├── components
    ├── configs
    ├── pages
    ├── public
    └── routers
```

And if you want to request `/multi/level/url/like/this`, just create multi-level directory.

This plugin supports files like:

- `user.js`
- `user.json`
- `user/index.js`
- `user/index.json`
- `user`

If using `.js` file:

- support returning pure object (JSON)
- support accessing `request` and `response` object (ref: [express api - req](http://expressjs.com/en/4x/api.html#req))

To specify your mock catalogue, pass `path` option like `new MockerWebpackPlugin({path})`, default is `${WebpackConfigContext}/mocks`.

### Examples

json

```json
{
    "status": 0,
    "msg": "",
    "data": {}
}
```

js

```js
modules.exports = {
    status: 0,
    msg: "",
    data: {
        // ...
    }
}
```

js (with express)

```js
// GET /search?user=zphhhhh
module.exports = (req, res) => {
    if (req.query.user) {
        return {
            status: 0,
            msg: "",
            data: {
                greet: `hello, ${req.query.user}!`
            }
        }
    } else {
        return {
            status: 1,
            msg: "please login",
            data: null
        }
    }
}
```

### Options

``` typescript
interface MockerOptions {
    /** set mock path (absolute path!), default to `${WebpackConfigContext}/mocks` */
    path: String;
    /** set webpack-dev-server mode, default to `before`, ref `WebpackConfig.devServer.before` */
    mode: 'before' | 'after' | 'setup';
}
```