interface TrackedFunction extends Function {
    uid?: number;
}
type ParamsType = {
    [key: string]: any;
};
export declare const addRule: (writeFn: Function | TrackedFunction, readFn: Function | TrackedFunction, skip?: ((writeParamsObj: any, readParamsObj?: any) => boolean | undefined) | undefined) => void;
export declare const trigger: (writeFn: TrackedFunction, writeParamsObj: ParamsType) => void;
export declare const useSync: (readFn: Function | TrackedFunction, paramsObj: ParamsType) => any;
export {};
