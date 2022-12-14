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
export var addRule = function (writeFn, readFn, skip) {
    var _a;
    var writeKey = trackFun(writeFn);
    var readKey = trackFun(readFn);
    console.info("'addRule(".concat(writeKey, ", ").concat(writeKey, ")'"));
    actionRules[writeKey] = actionRules[writeKey] || {};
    actionRules[writeKey] = (_a = {},
        _a[readKey] = {
            readersInstancesMap: {},
            skip: skip,
        },
        _a);
    readKey2writeKey[readKey] = readKey2writeKey[readKey] || [];
    readKey2writeKey[readKey].push(writeKey);
    console.info('readKey2writeKey["' + readKey + '"]');
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
export var triggerAction = function (writeFn, writeParamsObj) {
    writeFn(writeParamsObj);
    if ((writeFn === null || writeFn === void 0 ? void 0 : writeFn.uid) && writeFn.uid <= 0) {
        console.warn("triggerAction run on an untracked Function");
        return;
    }
    if (writeFn.uid && actionRules[writeFn.uid]) {
        var readFnKeysList = Object.keys(actionRules[writeFn.uid]).map(Number);
        if (Array.isArray(readFnKeysList)) {
            readFnKeysList.forEach(function (readKey) {
                var actionRule = actionRules[writeFn.uid][readKey];
                if (actionRule === null || actionRule === void 0 ? void 0 : actionRule.readersInstancesMap) {
                    Object.keys(actionRule.readersInstancesMap).forEach(function (instanceKey) {
                        var readersInst = actionRule.readersInstancesMap[instanceKey];
                        if ((readersInst === null || readersInst === void 0 ? void 0 : readersInst.readTrigger) &&
                            !(actionRule.skip &&
                                actionRule.skip(writeParamsObj, readersInst.paramsObj))) {
                            readersInst.readTrigger();
                        }
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
export var asRead = function (kFn) {
    return Object.keys(kFn).reduce(function (ret, k) {
        var _a;
        return (_a = {},
            _a[k] = function (readParamsObj) { return useLiveQuery(kFn[k], readParamsObj); },
            _a);
    }, {});
};
export var asWrite = function (kFn) {
    return Object.keys(kFn).reduce(function (ret, k) {
        var _a;
        return (_a = {},
            _a[k] = function (writeParamsObj) {
                return triggerAction(kFn[k], writeParamsObj);
            },
            _a);
    }, {});
};
//# sourceMappingURL=index.js.map