import Runtime from "./runtime";
import parse, { SyntaxError } from "plorth-parser";
import { getType, isInstance, isNumber } from "./util";

import {
  PlorthArray,
  PlorthBoolean,
  PlorthError,
  PlorthErrorCode,
  PlorthNumber,
  PlorthObject,
  PlorthQuote,
  PlorthString,
  PlorthSymbol,
  PlorthWord,
  PlorthValue,
  PlorthValueType
} from "plorth-types";

/**
 * Representation of Plorth execution context.
 */
export default class Context {
  /** Runtime which this execution context uses. */
  runtime: Runtime;
  /** Container for data stack. */
  stack: Array<PlorthValue | null>;
  /** Container for local dictionary. */
  dictionary: { [key: string]: PlorthWord };

  constructor(runtime: Runtime) {
    this.runtime = runtime;
    this.stack = [];
    this.dictionary = {};
  }

  /**
   * Evaluates given source code under this execution context.
   */
  eval(sourceCode: string): void {
    this.call(this.compile(sourceCode));
  }

  /**
   * Compiles given source code into Plorth quote.
   */
  compile(sourceCode: string): PlorthQuote {
    try {
      return {
        type: PlorthValueType.QUOTE,
        values: parse(sourceCode)
      };
    } catch (e) {
      if (!(e instanceof SyntaxError)) {
        throw e;
      }

      throw new Error("TODO: " + e.message);
    }
  }

  call(quote: PlorthQuote): void {
    if (quote.callback) {
      quote.callback(this);
    } else if (quote.values) {
      quote.values.forEach(value => exec(this, value));
    }
  }

  /**
   * Pushes given value into data stack of this execution context.
   */
  push(...value: Array<PlorthValue | null>): void {
    this.stack.push(...value);
  }

  pushBoolean(value: boolean): void {
    this.stack.push({
      type: PlorthValueType.BOOLEAN,
      value
    } as PlorthValue);
  }

  pushNumber(value: number): void {
    this.stack.push({
      type: PlorthValueType.NUMBER,
      value
    } as PlorthValue);
  }

  pushString(value: string): void {
    this.stack.push({
      type: PlorthValueType.STRING,
      value
    } as PlorthValue);
  }

  pushWord(symbol: string, quote: PlorthQuote): void {
    this.stack.push({
      type: PlorthValueType.WORD,
      symbol: {
        type: PlorthValueType.SYMBOL,
        id: symbol
      },
      quote
    } as PlorthValue);
  }

  pushArray(...elements: Array<PlorthValue | null>): void {
    this.stack.push({
      type: PlorthValueType.ARRAY,
      elements: [...elements]
    } as PlorthValue);
  }

  pushSymbol(id: string): void {
    this.push({
      type: PlorthValueType.SYMBOL,
      id
    } as PlorthValue);
  }

  peek(type?: PlorthValueType): PlorthValue | null {
    if (this.stack.length > 0) {
      const value = this.stack[this.stack.length - 1];

      if (type && !isInstance(value, type)) {
        throw this.error(
          PlorthErrorCode.TYPE,
          `Expected ${type}, got ${getType(value)} instead.`
        );
      }

      return value;
    }

    throw this.error(PlorthErrorCode.RANGE, "Stack underflow.");
  }

  peekBoolean(): boolean {
    return (this.peek(PlorthValueType.BOOLEAN) as PlorthBoolean).value;
  }

  peekNumber(): number {
    return (this.peek(PlorthValueType.NUMBER) as PlorthNumber).value;
  }

  peekString(): string {
    return (this.peek(PlorthValueType.STRING) as PlorthString).value;
  }

  peekArray(): Array<PlorthValue | null> {
    return (this.peek(PlorthValueType.ARRAY) as PlorthArray).elements;
  }

  peekObject(): { [key: string]: PlorthValue | null } {
    return (this.peek(PlorthValueType.OBJECT) as PlorthObject).properties;
  }

  peekQuote(): PlorthQuote {
    return this.peek(PlorthValueType.QUOTE) as PlorthQuote;
  }

  peekSymbol(): string {
    return (this.peek(PlorthValueType.SYMBOL) as PlorthSymbol).id;
  }

  peekWord(): PlorthWord {
    return this.peek(PlorthValueType.WORD) as PlorthWord;
  }

  pop(type?: PlorthValueType): PlorthValue | null {
    if (this.stack.length > 0) {
      const value = this.stack[this.stack.length - 1];

      if (type && !isInstance(value, type)) {
        throw this.error(
          PlorthErrorCode.TYPE,
          `Expected ${type}, got ${getType(value)} instead.`
        );
      }
      --this.stack.length;

      return value;
    }

    throw this.error(PlorthErrorCode.RANGE, "Stack underflow.");
  }

  popBoolean(): boolean {
    return (this.pop(PlorthValueType.BOOLEAN) as PlorthBoolean).value;
  }

  popNumber(): number {
    return (this.pop(PlorthValueType.NUMBER) as PlorthNumber).value;
  }

  popString(): string {
    return (this.pop(PlorthValueType.STRING) as PlorthString).value;
  }

  popArray(): Array<PlorthValue | null> {
    return (this.pop(PlorthValueType.ARRAY) as PlorthArray).elements;
  }

  popObject(): { [key: string]: PlorthValue | null } {
    return (this.pop(PlorthValueType.OBJECT) as PlorthObject).properties;
  }

  popQuote(): PlorthQuote {
    return this.pop(PlorthValueType.QUOTE) as PlorthQuote;
  }

  popSymbol(): string {
    return (this.pop(PlorthValueType.SYMBOL) as PlorthSymbol).id;
  }

  popWord(): PlorthWord {
    return this.pop(PlorthValueType.WORD) as PlorthWord;
  }

  /*error(code: PlorthErrorCode, message?: string): PlorthError {
    // TODO: Find a way to use captureStackTrace in TypeScript.
    return {
      type: PlorthValueType.ERROR,
      code,
      message
    };
  }*/

  error(code: PlorthErrorCode, message?: string): Error {
    return new Error(message);
  }
}

interface ExecVisitor {
  [key: string]: (context: Context, value: PlorthValue) => void;
}

const execVisitor: ExecVisitor = {
  [PlorthValueType.SYMBOL]: (context: Context, value: PlorthValue) => {
    const symbol = value as PlorthSymbol;

    // Look from prototype of the current item.
    if (context.stack.length > 0) {
      const value = context.stack[context.stack.length - 1];
      const proto = context.runtime.getPrototypeOf(value);

      if (proto && symbol.id in proto.properties) {
        const property = proto.properties[symbol.id];

        if (isInstance(property, PlorthValueType.QUOTE)) {
          context.call(property as PlorthQuote);
        } else {
          context.push(property);
        }
        return;
      }
    }

    // Look for a word from dictionary of current context.
    if (context.dictionary[symbol.id]) {
      context.call(context.dictionary[symbol.id].quote);
      return;
    }

    // Look from global dictionary.
    if (context.runtime.dictionary[symbol.id]) {
      context.call(context.runtime.dictionary[symbol.id].quote);
      return;
    }

    // If the name of the word can be converted into number, then do just that.
    if (isNumber(symbol.id)) {
      context.pushNumber(parseFloat(symbol.id));
      return;
    }

    // Otherwise it's reference error.
    throw context.error(
      PlorthErrorCode.REFERENCE,
      `Unrecognized word: \`${symbol.id}'`
    );
  },

  [PlorthValueType.WORD]: (context: Context, value: PlorthValue) => {
    const word = value as PlorthWord;

    context.dictionary[word.symbol.id] = word;
  }
};

function exec(context: Context, value: PlorthValue | null): void {
  if (!value) {
    context.push(null);
    return;
  }

  const callback = execVisitor[value.type];

  if (callback) {
    callback(context, value);
  } else {
    context.push(evalValue(context, value));
  }
}

interface EvalValueVisitor {
  [key: string]: (context: Context, value: PlorthValue) => PlorthValue | null;
}

const evalValueVisitor: EvalValueVisitor = {
  [PlorthValueType.ARRAY]: (context: Context, value: PlorthValue) => {
    const array = value as PlorthArray;

    return {
      type: PlorthValueType.ARRAY,
      elements: array.elements.map(element => evalValue(context, element))
    };
  },

  [PlorthValueType.OBJECT]: (context: Context, value: PlorthValue) => {
    const object = value as PlorthObject;
    const properties: { [key: string]: PlorthValue | null } = {};

    Object.keys(object.properties).forEach(key => {
      properties[key] = evalValue(context, object.properties[key]);
    });

    return {
      type: PlorthValueType.OBJECT,
      properties
    };
  },

  [PlorthValueType.SYMBOL]: (context: Context, value: PlorthValue) => {
    const id = (value as PlorthSymbol).id;

    if (id === "null") {
      return null;
    } else if (id === "true") {
      return {
        type: PlorthValueType.BOOLEAN,
        value: true
      } as PlorthValue;
    } else if (id === "false") {
      return {
        type: PlorthValueType.BOOLEAN,
        value: false
      } as PlorthValue;
    } else if (id === "drop") {
      return context.pop();
    } else if (isNumber(id)) {
      return {
        type: PlorthValueType.NUMBER,
        value: parseFloat(id)
      } as PlorthValue;
    }

    throw context.error(
      PlorthErrorCode.SYNTAX,
      `Unexpected \`${id}': Missing value.`
    );
  },

  [PlorthValueType.WORD]: (context: Context, value: PlorthValue) => {
    throw context.error(
      PlorthErrorCode.SYNTAX,
      "Unexpected word declaration: Missing value."
    );
  }
};

function evalValue(context: Context,
                   value: PlorthValue | null): PlorthValue | null {
  if (!value) {
    return null;
  }

  const callback = evalValueVisitor[value.type];

  if (callback) {
    return callback(context, value);
  } else {
    return value;
  }
}
