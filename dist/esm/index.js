var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useState, useEffect, useMemo, useRef } from "react";
var fun_ID_Cpt = 1;
var CMP_ID_Cpt = 1;
var actionRules = {};
var readKey2writeKey = {};
var trackFun = function (fn) {
    if ("uid" in fn) {
        if (typeof fn.uid === "number") {
            return fn.uid;
        }
        throw new Error("The Function ".concat(fn, " uid must have been number and not: ").concat(typeof fn.uid));
    }
    fn = Object.assign(fn, { uid: ++fun_ID_Cpt });
    return fun_ID_Cpt;
};
export var addRule = function (writeFn, readFn, guardFn) {
    var _a;
    var writeKey = trackFun(writeFn);
    var readKey = trackFun(readFn);
    actionRules[writeKey] = actionRules[writeKey] || {};
    actionRules[writeKey] = (_a = {},
        _a[readKey] = {
            readersInstancesMap: {},
            guardFn: guardFn,
        },
        _a);
    readKey2writeKey[readKey] = readKey2writeKey[readKey] || [];
    readKey2writeKey[readKey].push(writeKey);
};
export var loadRules = function (depList) { };
export var registerReadInstance = function (readKey, readerInstance) {
    if (readKey <= 0) {
        console.log("useLiveQuery run on an untracked Function");
        return;
    }
    var writeKeysList = readKey2writeKey[readKey] || [];
    writeKeysList.forEach(function (writeKey) {
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
export var triggerAction = function (writeFn, paramsObj) {
    writeFn(paramsObj);
    if ((writeFn === null || writeFn === void 0 ? void 0 : writeFn.uid) && writeFn.uid <= 0) {
        console.log("triggerAction run on an untracked Function");
        return;
    }
    console.log("triggerAction writeFn.uid:", writeFn.uid);
    console.log("triggerAction actionRules:", actionRules);
    if (writeFn.uid && actionRules[writeFn.uid]) {
        console.log("triggerAction writeFn.uid:", writeFn.uid);
        var readFnKeysList = Object.keys(actionRules[writeFn.uid]).map(Number);
        if (Array.isArray(readFnKeysList)) {
            console.log("triggerAction readFnKeysList:", readFnKeysList);
            readFnKeysList.forEach(function (readKey) {
                var actionRule = actionRules[writeFn.uid][readKey];
                if (actionRule === null || actionRule === void 0 ? void 0 : actionRule.readersInstancesMap) {
                    Object.keys(actionRule.readersInstancesMap).forEach(function (instanceKey) {
                        actionRule.readersInstancesMap[instanceKey].readTrigger();
                    });
                }
            });
        }
    }
};
export var useLiveQuery = function (readFn, paramsObj) {
    var _a = useState(0), resultVersion = _a[0], setResultVersion = _a[1];
    var key = useRef("".concat(++CMP_ID_Cpt));
    var paramsArr = Object.keys(paramsObj).map(function (k) { return paramsObj[k]; });
    useEffect(function () {
        registerReadInstance(readFn.uid || -1, {
            instanceKey: key.current,
            readTrigger: function () { return setResultVersion(function (x) { return x + 1; }); },
            paramsObj: paramsObj,
        });
        return function () {
            return registerReadInstance(readFn.uid || -1, {
                instanceKey: key.current,
                readTrigger: undefined,
                paramsObj: paramsObj,
            });
        };
    }, __spreadArray([readFn.uid], paramsArr, true));
    var data = useMemo(function () { return readFn(paramsObj); }, __spreadArray([resultVersion], paramsArr, true));
    return data;
};
//# sourceMappingURL=index.js.map