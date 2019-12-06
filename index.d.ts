interface MockerOptions {
    /** set mock path (absolute path!), default to `${WebpackConfigContext}/mocks` */
    path: String;
    /** set webpack-dev-server mode, default to `before`, ref `WebpackConfig.devServer.before` */
    mode: 'before' | 'after' | 'setup';
}

declare class MockerWebpackPlugin {
    constructor(options: MockerOptions);
}

export = MockerWebpackPlugin;