import Runtime from "./runtime";
import RuntimeError from "./error";
import isPromise = require("is-promise");
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
  eval(sourceCode: string): Promise<void> {
    return this.call(this.compile(sourceCode));
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

  call(quote: PlorthQuote): Promise<void> {
    if (quote.callback) {
      const result = quote.callback(this);

      if (isPromise(result)) {
        return result as Promise<void>;
      }
    } else if (quote.values) {
      return quote.values.reduce(
        (promise, value) => promise.then(() => exec(this, value)),
        Promise.resolve()
      );
    }

    return Promise.resolve();
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

  peekObject(): PlorthObject {
    return this.peek(PlorthValueType.OBJECT) as PlorthObject;
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

  popObject(): PlorthObject {
    return this.pop(PlorthValueType.OBJECT) as PlorthObject;
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
  resolveSymbol(id: string): Promise<void> {
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

        return Promise.resolve();
      }
    }

    // Look for a word from dictionary of current context.
    if (this.dictionary[id]) {
      return this.call(this.dictionary[id].quote);
    }

    // Look from global dictionary.
    if (this.runtime.dictionary[id]) {
      return this.call(this.runtime.dictionary[id].quote);
    }

    // If the name of the word can be converted into number, then do just that.
    if (isNumber(id)) {
      this.pushNumber(parseFloat(id));

      return Promise.resolve();
    }

    // Otherwise it's reference error.
    return Promise.reject(this.error(
      PlorthErrorCode.REFERENCE,
      `Unrecognized word: \`${id}'`
    ));
  }

  /**
   * Attempts to import a module from given URL/filename and inserts all words
   * declared in that module into dictionary of this execution context.
   */
  import(filename: string): Promise<void> {
    const { importer } = this.runtime;

    if (!importer) {
      throw this.error(
        PlorthErrorCode.IMPORT,
        "Modules are not available on this platform."
      );
    }

    return importer.import(filename)
      .then(words => {
        words.forEach(word => {
          this.dictionary[word.symbol.id] = word;
        });
      });
  }
}

interface ExecVisitor {
  [key: string]: (context: Context, value: PlorthValue) => Promise<void>;
}

const execVisitor: ExecVisitor = {
  [PlorthValueType.SYMBOL]: (context: Context, value: PlorthValue): Promise<void> => {
    return context.resolveSymbol((value as PlorthSymbol).id);
  },

  [PlorthValueType.WORD]: (context: Context, value: PlorthValue): Promise<void> => {
    const word = value as PlorthWord;

    context.dictionary[word.symbol.id] = word;

    return Promise.resolve();
  }
};

function exec(context: Context, value: PlorthValue | null): Promise<void> {
  if (!value) {
    context.push(null);

    return Promise.resolve();
  }

  const callback = execVisitor[value.type];

  if (callback) {
    return callback(context, value);
  }

  return evalValue(context, value)
    .then(resolvedValue => {
      context.push(resolvedValue);

      return Promise.resolve();
    });
}

interface EvalValueVisitor {
  [key: string]: (context: Context, value: PlorthValue) => Promise<PlorthValue | null>;
}

const evalValueVisitor: EvalValueVisitor = {
  [PlorthValueType.ARRAY]: (context: Context, value: PlorthValue): Promise<PlorthValue | null> => {
    return new Promise<PlorthValue | null>((resolve, reject) => {
      const array = value as PlorthArray;
      const elements: Array<PlorthValue | null> = [];
      let isError = false;

      array.elements.forEach(element => {
        if (isError) {
          return;
        }
        evalValue(context, element)
          .then(resolvedValue => elements.push(resolvedValue))
          .catch(err => {
            isError = true;
            reject(err);
          });
      });
      if (!isError) {
        resolve({
          type: PlorthValueType.ARRAY,
          elements
        } as PlorthArray);
      }
    });
  },

  [PlorthValueType.OBJECT]: (context: Context, value: PlorthValue): Promise<PlorthValue | null> => {
    return new Promise<PlorthValue | null>((resolve, reject) => {
      const object = value as PlorthObject;
      const properties: { [key: string]: PlorthValue | null } = {};
      let isError = false;

      Object.keys(object.properties).forEach(key => {
        if (isError) {
          return;
        }
        evalValue(context, object.properties[key])
          .then(resolvedValue => properties[key] = resolvedValue)
          .catch(err => {
            isError = true;
            reject(err);
          });
      });
      if (!isError) {
        resolve({
          type: PlorthValueType.OBJECT,
          properties
        } as PlorthObject);
      }
    });
  },

  [PlorthValueType.SYMBOL]: (context: Context, value: PlorthValue): Promise<PlorthValue | null> => {
    const id = (value as PlorthSymbol).id;

    if (id === "null") {
      return Promise.resolve(null);
    } else if (id === "true") {
      return Promise.resolve({
        type: PlorthValueType.BOOLEAN,
        value: true
      } as PlorthBoolean);
    } else if (id === "false") {
      return Promise.resolve({
        type: PlorthValueType.BOOLEAN,
        value: false
      } as PlorthBoolean);
    } else if (id === "drop") {
      return Promise.resolve(context.pop());
    } else if (isNumber(id)) {
      return Promise.resolve({
        type: PlorthValueType.NUMBER,
        value: parseFloat(id)
      } as PlorthNumber);
    }

    throw Promise.reject(context.error(
      PlorthErrorCode.SYNTAX,
      `Unexpected \`${id}': Missing value.`
    ));
  },

  [PlorthValueType.WORD]: (context: Context, value: PlorthValue): Promise<PlorthValue | null> => {
    return Promise.reject(context.error(
      PlorthErrorCode.SYNTAX,
      "Unexpected word declaration: Missing value."
    ));
  }
};

function evalValue(context: Context,
                   value: PlorthValue | null): Promise<PlorthValue | null> {
  if (!value) {
    return Promise.resolve(null);
  }

  const callback = evalValueVisitor[value.type];

  if (callback) {
    return callback(context, value);
  } else {
    return Promise.resolve(value);
  }
}
