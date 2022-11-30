"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLiveQuery = exports.triggerAction = exports.registerReadInstance = exports.loadRules = exports.addRule = void 0;
const react_1 = require("react");
const nanoid_1 = require("nanoid");
let cpt = 1;
const actionRules = {};
const readKey2writeKey = {};
const trackFun = (fn) => {
    if ("uid" in fn) {
        if (typeof fn.uid === "number") {
            return fn.uid;
        }
        throw new Error(`The Function ${fn} uid must have been number and not: ${typeof fn.uid}`);
    }
    console.log("new cpt:", cpt);
    fn = Object.assign(fn, { uid: ++cpt });
    return cpt;
};
const addRule = (writeFn, readFn, guardFn) => {
    const writeKey = trackFun(writeFn);
    const readKey = trackFun(readFn);
    actionRules[writeKey] = actionRules[writeKey] || {};
    actionRules[writeKey] = {
        [readKey]: {
            readersInstancesMap: {},
            guardFn,
        },
    };
    readKey2writeKey[readKey] = readKey2writeKey[readKey] || [];
    readKey2writeKey[readKey].push(writeKey);
};
exports.addRule = addRule;
const loadRules = (depList) => { };
exports.loadRules = loadRules;
const registerReadInstance = (readKey, readerInstance) => {
    if (readKey <= 0) {
        console.log(`useLiveQuery run on an untracked Function`);
        return;
    }
    const writeKeysList = readKey2writeKey[readKey] || [];
    writeKeysList.forEach((writeKey) => {
        if (actionRules[writeKey] && actionRules[writeKey][readKey]) {
            if (readerInstance.readTrigger) {
                actionRules[writeKey][readKey].readersInstancesMap[readerInstance.instanceKey] = readerInstance;
            }
            else {
                delete actionRules[writeKey][readKey].readersInstancesMap[readerInstance.instanceKey];
            }
        }
    });
};
exports.registerReadInstance = registerReadInstance;
const triggerAction = (writeFn, paramsObj) => {
    writeFn(paramsObj);
    if ((writeFn === null || writeFn === void 0 ? void 0 : writeFn.uid) && writeFn.uid <= 0) {
        console.log(`triggerAction run on an untracked Function`);
        return;
    }
    console.log(`triggerAction writeFn.uid:`, writeFn.uid);
    console.log(`triggerAction actionRules:`, actionRules);
    if (writeFn.uid && actionRules[writeFn.uid]) {
        console.log(`triggerAction writeFn.uid:`, writeFn.uid);
        const readFnKeysList = Object.keys(actionRules[writeFn.uid]).map(Number);
        if (Array.isArray(readFnKeysList)) {
            console.log(`triggerAction readFnKeysList:`, readFnKeysList);
            readFnKeysList.forEach((readKey) => {
                const actionRule = actionRules[writeFn.uid][readKey];
                if (actionRule === null || actionRule === void 0 ? void 0 : actionRule.readersInstancesMap) {
                    Object.keys(actionRule.readersInstancesMap).forEach((instanceKey) => {
                        actionRule.readersInstancesMap[instanceKey].readTrigger();
                    });
                }
            });
        }
    }
};
exports.triggerAction = triggerAction;
const useLiveQuery = (readFn, paramsObj) => {
    //debugger;
    const [resultVersion, setResultVersion] = (0, react_1.useState)(0);
    const key = (0, react_1.useRef)((0, nanoid_1.nanoid)());
    const paramsArr = Object.keys(paramsObj).map((k) => paramsObj[k]);
    (0, react_1.useEffect)(() => {
        (0, exports.registerReadInstance)(readFn.uid || -1, {
            instanceKey: key.current,
            readTrigger: () => setResultVersion((x) => x + 1),
            paramsObj,
        });
        return () => (0, exports.registerReadInstance)(readFn.uid || -1, {
            instanceKey: key.current,
            readTrigger: undefined,
            paramsObj,
        });
    }, [readFn.uid, ...paramsArr]);
    const data = (0, react_1.useMemo)(() => readFn(paramsObj), [resultVersion, ...paramsArr]);
    return data;
};
exports.useLiveQuery = useLiveQuery;
//# sourceMappingURL=index.js.map