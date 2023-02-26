"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSync = exports.trigger = exports.addRule = void 0;
var react_1 = require("react");
var fun_ID_Cpt = 0;
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
var addRule = function (writeFn, readFn, skip) {
    var _a;
    var writeKey = trackFun(writeFn);
    var readKey = trackFun(readFn);
    actionRules[writeKey] = actionRules[writeKey] || {};
    actionRules[writeKey] = (_a = {},
        _a[readKey] = {
            readersInstancesMap: {},
            skip: skip,
        },
        _a);
    readKey2writeKey[readKey] = readKey2writeKey[readKey] || [];
    readKey2writeKey[readKey].push(writeKey);
};
exports.addRule = addRule;
var registerReadInstance = function (readKey, readerInstance) {
    if (readKey <= 0) {
        console.log("useSync run on an untracked Function");
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
var trigger = function (writeFn, writeParamsObj) {
    writeFn(writeParamsObj);
    if ((writeFn === null || writeFn === void 0 ? void 0 : writeFn.uid) && writeFn.uid <= 0) {
        console.warn("trigger run on an untracked Function writeFn?.uid:".concat(writeFn === null || writeFn === void 0 ? void 0 : writeFn.uid, " "));
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
exports.trigger = trigger;
var useSync = function (readFn, paramsObj) {
    var _a = (0, react_1.useState)(0), resultVersion = _a[0], setResultVersion = _a[1];
    var key = (0, react_1.useRef)("".concat(++CMP_ID_Cpt));
    var paramsArr = Object.keys(paramsObj).map(function (k) { return paramsObj[k]; });
    (0, react_1.useEffect)(function () {
        registerReadInstance(readFn.uid || -1, {
            instanceKey: key.current,
            readTrigger: function () { return setResultVersion(function (x) { return x + 1; }); },
            paramsObj: paramsObj,
        });
        return function () {
            registerReadInstance(readFn.uid || -1, {
                instanceKey: key.current,
                readTrigger: undefined,
                paramsObj: paramsObj,
            });
        };
    }, __spreadArray([readFn.uid], paramsArr, true));
    var data = (0, react_1.useMemo)(function () { return readFn(paramsObj); }, __spreadArray([resultVersion], paramsArr, true));
    return data;
};
exports.useSync = useSync;
//# sourceMappingURL=index.js.map