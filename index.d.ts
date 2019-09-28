interface MockerOptions {
    /** set mock path (absolute path!), default to `${WebpackConfigContext}/mocks` */
    path: String;
}

declare class MockerWebpackPlugin {
    constructor(options: MockerOptions);
}

export = MockerWebpackPlugin;