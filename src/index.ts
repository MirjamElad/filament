import { useState, useEffect, useMemo, useRef } from "react";

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

type ActionRules = {
  [writeKey: number]: {
    [readKey: number]: {
      readersInstancesMap: { [instanceKey: string]: ReaderInstance };
      skip?: (
        writeParamsObj: ParamsType,
        readParamsObj?: ParamsType
      ) => boolean | undefined;
    };
  };
};

let fun_ID_Cpt = 1;
let CMP_ID_Cpt = 1;
const actionRules: ActionRules = {};
const readKey2writeKey: { [readKey: number]: number[] } = {};

const trackFun: (fn: Function | TrackedFunction) => number = (
  fn: Function | TrackedFunction
) => {
  if ("uid" in fn) {
    if (typeof fn.uid === "number") {
      return fn.uid;
    }
    throw new Error(
      `The Function ${fn} uid must have been number and not: ${typeof fn.uid}`
    );
  }
  fn = Object.assign(fn, { uid: ++fun_ID_Cpt });
  return fun_ID_Cpt;
};

export const addRule = (
  writeFn: Function | TrackedFunction,
  readFn: Function | TrackedFunction,
  skip?: (
    writeParamsObj: any,
    readParamsObj?: any
  ) => boolean | undefined
) => {
  const writeKey = trackFun(writeFn);
  const readKey = trackFun(readFn);
  console.info(`'addRule(${writeKey}, ${writeKey})'`);
  actionRules[writeKey] = actionRules[writeKey] || {};
  actionRules[writeKey] = {
    [readKey]: {
      readersInstancesMap: {},
      skip,
    },
  };
  readKey2writeKey[readKey] = readKey2writeKey[readKey] || [];
  readKey2writeKey[readKey].push(writeKey);
  console.info('readKey2writeKey["'+readKey+'"]');
};

export const loadRules = (depList: Function[][]) => {};

export const registerReadInstance = (
  readKey: number,
  readerInstance: ReaderInstance
) => {
  if (readKey <= 0) {
    console.log(`useLiveQuery run on an untracked Function`);
    return;
  }
  const writeKeysList = readKey2writeKey[readKey] || [];
  writeKeysList.forEach((writeKey) => {
    if (actionRules[writeKey] && actionRules[writeKey][readKey]) {
      if (readerInstance.readTrigger) {
        actionRules[writeKey][readKey].readersInstancesMap[
          readerInstance.instanceKey
        ] = readerInstance;
      } else {
        delete actionRules[writeKey][readKey].readersInstancesMap[
          readerInstance.instanceKey
        ];
      }
    }
  });
};
export const triggerAction = (
  writeFn: TrackedFunction,
  writeParamsObj: ParamsType
) => {
  writeFn(writeParamsObj);
  if (writeFn?.uid && writeFn.uid <= 0) {
    console.warn(`triggerAction run on an untracked Function`);
    return;
  }
  if (writeFn.uid && actionRules[writeFn.uid]) {
    const readFnKeysList = Object.keys(actionRules[writeFn.uid]).map(Number);
    if (Array.isArray(readFnKeysList)) {
      readFnKeysList.forEach((readKey: number) => {
        const actionRule = actionRules[writeFn.uid!][readKey];
        if (actionRule?.readersInstancesMap) {
          Object.keys(actionRule.readersInstancesMap).forEach(
            (instanceKey: string) => {
              const readersInst = actionRule.readersInstancesMap[instanceKey];
              if (readersInst?.readTrigger && !(actionRule.skip && actionRule.skip(writeParamsObj, readersInst.paramsObj))) {
                readersInst.readTrigger();
              }
            }
          );
        }
      });
    }
  }
};
export const useLiveQuery = (
  readFn: Function | TrackedFunction,
  paramsObj: ParamsType
) => {
  const [resultVersion, setResultVersion] = useState(0);
  const key = useRef(`${++CMP_ID_Cpt}`);
  const paramsArr = Object.keys(paramsObj).map((k) => paramsObj[k]);
  useEffect(() => {
    registerReadInstance((readFn as TrackedFunction).uid || -1, {
      instanceKey: key.current,
      readTrigger: () => setResultVersion((x) => x + 1),
      paramsObj,
    });
    return () =>
      registerReadInstance((readFn as TrackedFunction).uid || -1, {
        instanceKey: key.current,
        readTrigger: undefined,
        paramsObj,
      });
  }, [(readFn as TrackedFunction).uid, ...paramsArr]);
  const data = useMemo(
    () => (readFn as TrackedFunction)(paramsObj),
    [resultVersion, ...paramsArr]
  );
  return data;
};

type FunMap = {[fName: string]: Function | TrackedFunction};
type TrackedFunMap = {[fName: string]: TrackedFunction};


export const asRead: (kFn: FunMap) => TrackedFunMap  = (kFn: FunMap) => {
  return Object.keys(kFn).reduce((ret: FunMap, k: string): FunMap => 
    ({[k] : (
      readParamsObj: ParamsType
    ) => useLiveQuery(kFn[k], readParamsObj)}), {});
}

export const asWrite: (kFn: FunMap) => TrackedFunMap = (kFn: FunMap) => {
  return Object.keys(kFn).reduce((ret: FunMap, k: string): FunMap => 
    ({[k] : (
      writeParamsObj: ParamsType
    ) => triggerAction(kFn[k], writeParamsObj)}), {});
}