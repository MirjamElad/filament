import { useState, useEffect, useMemo, useRef } from "react";
import { nanoid } from "nanoid";

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
      guardFn?: (
        writeParamsObj: ParamsType,
        readParamsObj?: ParamsType
      ) => boolean | undefined;
    };
  };
};

let cpt = 1;
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
  console.log("new cpt:", cpt);
  fn = Object.assign(fn, { uid: ++cpt });
  return cpt;
};

export const addRule = (
  writeFn: Function | TrackedFunction,
  readFn: Function | TrackedFunction,
  guardFn?: (
    writeParamsObj: ParamsType,
    readParamsObj?: ParamsType
  ) => boolean | undefined
) => {
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
  paramsObj: ParamsType
) => {
  writeFn(paramsObj);
  if (writeFn?.uid && writeFn.uid <= 0) {
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
      readFnKeysList.forEach((readKey: number) => {
        const actionRule = actionRules[writeFn.uid!][readKey];
        if (actionRule?.readersInstancesMap) {
          Object.keys(actionRule.readersInstancesMap).forEach(
            (instanceKey: string) => {
              actionRule.readersInstancesMap[instanceKey]!.readTrigger!();
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
  //debugger;
  const [resultVersion, setResultVersion] = useState(0);
  const key = useRef(nanoid());
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
