export class ErrorBase<T extends string, U extends string, V = undefined> extends Error {
        domain: T;
        layer: U;
        type?: V;
        message: string;
        cause?: any;

        constructor({ domain, layer, type, message, cause }: { domain: T; layer: U; type?: V; message: string; cause?: any }) {
                super();
                this.domain = domain;
                this.layer = layer;
                this.type = type;
                this.message = message;
                this.cause = cause;
        }
}
