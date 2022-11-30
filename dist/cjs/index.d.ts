export interface TrackedFunction extends Function {
    uid?: number;
}
export type ParamsType = {
    [key: string]: any;
};
type ReaderInstance = {
    instanceKey: string;
    readTrigger: (() => void) | undefined;
    paramsObj: ParamsType;
};
export declare const addRule: (writeFn: Function | TrackedFunction, readFn: Function | TrackedFunction, skip?: ((writeParamsObj: any, readParamsObj?: any) => boolean | undefined) | undefined) => void;
export declare const loadRules: (depList: Function[][]) => void;
export declare const registerReadInstance: (readKey: number, readerInstance: ReaderInstance) => void;
export declare const triggerAction: (writeFn: TrackedFunction, writeParamsObj: ParamsType) => void;
export declare const useLiveQuery: (readFn: Function | TrackedFunction, paramsObj: ParamsType) => any;
export {};
