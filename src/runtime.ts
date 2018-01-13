import Context from "./context";

import ArrayPrototype from "./api/array";
import BooleanPrototype from "./api/boolean";
import ErrorPrototype from "./api/error";
import GlobalDictionary from "./api/globals";
import NumberPrototype from "./api/number";
import ObjectPrototype from "./api/object";
import StringPrototype from "./api/string";
import SymbolPrototype from "./api/symbol";
import WordPrototype from "./api/word";

import {
  PlorthObject,
  PlorthValue,
  PlorthValueType,
  PlorthWord
} from "plorth-types";

export interface PrototypeDefinition {
  [key: string]: (context: Context) => void;
}

/**
 * Runtime for the Plorth interpreter.
 */
export default class Runtime {
  /** Container for global dictionary. */
  dictionary: { [key: string]: PlorthWord };
  prototypes: { [key: string]: PlorthObject };

  constructor() {
    this.dictionary = {};
    this.prototypes = {};

    addPrototypes(this);
    Object.keys(GlobalDictionary).forEach(key => {
      this.dictionary[key] = {
        type: PlorthValueType.WORD,
        symbol: {
          type: PlorthValueType.SYMBOL,
          id: key
        },
        quote: {
          type: PlorthValueType.QUOTE,
          callback: GlobalDictionary[key]
        }
      };
    });
  }

  newContext(): Context {
    return new Context(this);
  }

  getPrototypeOf(value: PlorthValue | null): PlorthObject | null {
    return value ?
      this.prototypes[value.type] || this.prototypes[PlorthValueType.OBJECT] :
      null;
  }

  print(text: string): void {
    console && typeof console.log === "function" && console.log(text);
  }
}

const prototypeDefinitions: { [key: string]: PrototypeDefinition } = {
  [PlorthValueType.ARRAY]: ArrayPrototype,
  [PlorthValueType.BOOLEAN]: BooleanPrototype,
  [PlorthValueType.ERROR]: ErrorPrototype,
  [PlorthValueType.NUMBER]: NumberPrototype,
  [PlorthValueType.OBJECT]: ObjectPrototype,
  [PlorthValueType.STRING]: StringPrototype,
  [PlorthValueType.SYMBOL]: SymbolPrototype,
  [PlorthValueType.WORD]: WordPrototype
};

function addPrototypes(runtime: Runtime): void {
  Object.keys(prototypeDefinitions).forEach(type => {
    const definition = prototypeDefinitions[type];
    const properties: { [key: string]: PlorthValue | null } = {};

    Object.keys(definition).forEach(key => {
      properties[key] = {
        type: PlorthValueType.QUOTE,
        callback: definition[key]
      } as PlorthValue;
    });
    runtime.prototypes[type] = {
      type: PlorthValueType.OBJECT,
      properties
    };
    runtime.dictionary[type] = {
      type: PlorthValueType.WORD,
      symbol: {
        type: PlorthValueType.SYMBOL,
        id: type
      },
      quote: {
        type: PlorthValueType.QUOTE,
        callback(context: Context) {
          context.push({
            type: PlorthValueType.OBJECT,
            properties: {
              __proto__: runtime.prototypes[PlorthValueType.OBJECT],
              prototype: runtime.prototypes[type]
            }
          } as PlorthValue);
        }
      }
    };
  });
}
