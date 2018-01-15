import Runtime from "./runtime";
import RuntimeError from "./error";
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
    } as PlorthBoolean);
  }

  pushNumber(value: number): void {
    this.stack.push({
      type: PlorthValueType.NUMBER,
      value
    } as PlorthNumber);
  }

  pushString(value: string): void {
    this.stack.push({
      type: PlorthValueType.STRING,
      value
    } as PlorthString);
  }

  pushWord(symbol: string, quote: PlorthQuote): void {
    this.stack.push({
      type: PlorthValueType.WORD,
      symbol: {
        type: PlorthValueType.SYMBOL,
        id: symbol
      },
      quote
    } as PlorthWord);
  }

  pushArray(...elements: Array<PlorthValue | null>): void {
    this.stack.push({
      type: PlorthValueType.ARRAY,
      elements: [...elements]
    } as PlorthArray);
  }

  pushObject(properties: { [key: string]: PlorthValue | null }): void {
    this.stack.push({
      type: PlorthValueType.OBJECT,
      properties
    } as PlorthObject);
  }

  pushQuote(...values: Array<PlorthValue | null>): void {
    this.stack.push({
      type: PlorthValueType.QUOTE,
      values: [...values]
    } as PlorthQuote);
  }

  pushSymbol(id: string): void {
    this.push({
      type: PlorthValueType.SYMBOL,
      id
    } as PlorthSymbol);
  }

  pushError(code: PlorthErrorCode, message?: string): void {
    this.push(this.error(code, message));
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

  peekError(): PlorthError {
    return this.peek(PlorthValueType.ERROR) as PlorthError;
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

  popError(): PlorthError {
    return this.pop(PlorthValueType.ERROR) as PlorthError;
  }

  error(code: PlorthErrorCode, message?: string): PlorthError {
    return new RuntimeError(code, message);
  }

  /**
   * Resolves given identifier as a symbol, based on Plorth's symbol resolving
   * rules.
   */
  resolveSymbol(id: string): void {
    // Look from prototype of the current item.
    if (this.stack.length > 0) {
      const value = this.stack[this.stack.length - 1];
      const proto = this.runtime.getPrototypeOf(value);

      if (proto && id in proto.properties) {
        const property = proto.properties[id];

        if (isInstance(property, PlorthValueType.QUOTE)) {
          this.call(property as PlorthQuote);
        } else {
          this.push(property);
        }
        return;
      }
    }

    // Look for a word from dictionary of current context.
    if (this.dictionary[id]) {
      this.call(this.dictionary[id].quote);
      return;
    }

    // Look from global dictionary.
    if (this.runtime.dictionary[id]) {
      this.call(this.runtime.dictionary[id].quote);
      return;
    }

    // If the name of the word can be converted into number, then do just that.
    if (isNumber(id)) {
      this.pushNumber(parseFloat(id));
      return;
    }

    // Otherwise it's reference error.
    throw this.error(
      PlorthErrorCode.REFERENCE,
      `Unrecognized word: \`${id}'`
    );
  }
}

interface ExecVisitor {
  [key: string]: (context: Context, value: PlorthValue) => void;
}

const execVisitor: ExecVisitor = {
  [PlorthValueType.SYMBOL]: (context: Context, value: PlorthValue) => {
    context.resolveSymbol((value as PlorthSymbol).id);
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
