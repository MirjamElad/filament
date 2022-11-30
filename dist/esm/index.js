import { useState, useEffect, useMemo, useRef } from "react";
import { nanoid } from "nanoid";
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
export const addRule = (writeFn, readFn, guardFn) => {
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
export const loadRules = (depList) => { };
export const registerReadInstance = (readKey, readerInstance) => {
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
export const triggerAction = (writeFn, paramsObj) => {
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
export const useLiveQuery = (readFn, paramsObj) => {
    //debugger;
    const [resultVersion, setResultVersion] = useState(0);
    const key = useRef(nanoid());
    const paramsArr = Object.keys(paramsObj).map((k) => paramsObj[k]);
    useEffect(() => {
        registerReadInstance(readFn.uid || -1, {
            instanceKey: key.current,
            readTrigger: () => setResultVersion((x) => x + 1),
            paramsObj,
        });
        return () => registerReadInstance(readFn.uid || -1, {
            instanceKey: key.current,
            readTrigger: undefined,
            paramsObj,
        });
    }, [readFn.uid, ...paramsArr]);
    const data = useMemo(() => readFn(paramsObj), [resultVersion, ...paramsArr]);
    return data;
};
//# sourceMappingURL=index.js.map