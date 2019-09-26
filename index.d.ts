interface EasymockOptions {
    /** set mock path (absolute path!), default to `${WebpackConfigContext}/mocks` */
    path: String;
}

declare class EasymockWebpackPlugin {
    constructor(options: EasymockOptions);
}

export = EasymockWebpackPlugin;