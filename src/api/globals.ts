import Context from "../context";
import RuntimeError from "../error";
import { PrototypeDefinition } from "../runtime";
import { getProperty, getType, isInstance, toSource, toString } from "../util";

import {
  PlorthErrorCode,
  PlorthObject,
  PlorthValue,
  PlorthValueType
} from "plorth-types";

const GlobalDictionary: PrototypeDefinition = {
  "null"(context: Context) {
    context.push(null);
  },

  "true"(context: Context) {
    context.pushBoolean(true);
  },

  "false"(context: Context) {
    context.pushBoolean(false);
  },

  e(context: Context) {
    context.pushNumber(Math.E);
  },

  pi(context: Context) {
    context.pushNumber(Math.PI);
  },

  inf(context: Context) {
    context.pushNumber(Number.POSITIVE_INFINITY);
  },

  "-inf"(context: Context) {
    context.pushNumber(Number.NEGATIVE_INFINITY);
  },

  nan(context: Context) {
    context.pushNumber(Number.NaN);
  },

  nop(context: Context) {},

  clear(context: Context) {
    context.stack.length = 0;
  },

  depth(context: Context) {
    context.pushNumber(context.stack.length);
  },

  drop(context: Context) {
    context.pop();
  },

  "2drop"(context: Context) {
    context.pop();
    context.pop();
  },

  dup(context: Context) {
    context.push(context.peek());
  },

  "2dup"(context: Context) {
    const a = context.pop();
    const b = context.pop();

    context.push(b, a, b, a);
  },

  nip(context: Context) {
    const a = context.pop();

    context.pop();
    context.push(a);
  },

  over(context: Context) {
    const a = context.pop();
    const b = context.pop();

    context.push(b, a, b);
  },

  rot(context: Context) {
    const a = context.pop();
    const b = context.pop();
    const c = context.pop();

    context.push(b, a, c);
  },

  swap(context: Context) {
    const a = context.pop();
    const b = context.pop();

    context.push(a, b);
  },

  tuck(context: Context) {
    const a = context.pop();
    const b = context.pop();

    context.push(a, b, a);
  },

  "array?"(context: Context) {
    context.pushBoolean(isInstance(context.peek(), PlorthValueType.ARRAY));
  },

  "boolean?"(context: Context) {
    context.pushBoolean(isInstance(context.peek(), PlorthValueType.BOOLEAN));
  },

  "error?"(context: Context) {
    context.pushBoolean(isInstance(context.peek(), PlorthValueType.ERROR));
  },

  "number?"(context: Context) {
    context.pushBoolean(isInstance(context.peek(), PlorthValueType.NUMBER));
  },

  "null?"(context: Context) {
    context.pushBoolean(isInstance(context.peek(), PlorthValueType.NULL));
  },

  "object?"(context: Context) {
    context.pushBoolean(isInstance(context.peek(), PlorthValueType.OBJECT));
  },

  "quote?"(context: Context) {
    context.pushBoolean(isInstance(context.peek(), PlorthValueType.QUOTE));
  },

  "string?"(context: Context) {
    context.pushBoolean(isInstance(context.peek(), PlorthValueType.STRING));
  },

  "symbol?"(context: Context) {
    context.pushBoolean(isInstance(context.peek(), PlorthValueType.SYMBOL));
  },

  "word?"(context: Context) {
    context.pushBoolean(isInstance(context.peek(), PlorthValueType.WORD));
  },

  "typeof"(context: Context) {
    context.pushString(getType(context.peek()));
  },

  "instance-of?"(context: Context) {
    const object = context.popObject();
    const value = context.peek();
    const proto1 = context.runtime.getPrototypeOf(value);
    let proto2: PlorthObject | null = null;

    try {
      const value = getProperty(context.runtime, object, "prototype");

      if (!value || value.type !== PlorthValueType.OBJECT) {
        context.pushBoolean(false);
        return;
      } else if (proto1 === value) {
        context.pushBoolean(true);
        return;
      }
      proto2 = value as PlorthObject;
    } catch (e) {
      context.pushBoolean(false);
      return;
    }

    while (proto2) {
      try {
        const value = getProperty(context.runtime, proto2, "__proto__");

        if (!value || value.type !== PlorthValueType.OBJECT) {
          break;
        } else if (proto1 === value) {
          context.pushBoolean(true);
          return;
        }
        proto2 = value as PlorthObject;
      } catch (e) {
        break;
      }
    }

    context.pushBoolean(false);
  },

  proto(context: Context) {
    context.push(context.runtime.getPrototypeOf(context.peek()));
  },

  ">boolean"(context: Context) {
    const value = context.pop();

    if (!value) {
      context.pushBoolean(false);
    } else if (value.type === PlorthValueType.BOOLEAN) {
      context.push(value);
    } else {
      context.pushBoolean(true);
    }
  },

  ">string"(context: Context) {
    context.pushString(toString(context.pop()));
  },

  ">source"(context: Context) {
    context.pushString(toSource(context.pop()));
  },

  "1array"(context: Context) {
    context.pushArray(context.pop());
  },

  "2array"(context: Context) {
    const a = context.pop();
    const b = context.pop();

    context.pushArray(b, a);
  },

  narray(context: Context) {
    const n = context.popNumber();
    const result: Array<PlorthValue | null> = [];

    if (n < 0) {
      throw context.error(PlorthErrorCode.RANGE, "Negative array size.");
    }
    for (let i = 0; i < n; ++i) {
      result.unshift(context.pop());
    }
    context.pushArray(...result);
  },

  "if"(context: Context) {
    const quote = context.popQuote();
    const condition = context.popBoolean();

    if (condition) {
      context.call(quote);
    }
  },

  "if-else"(context: Context) {
    const elseQuote = context.popQuote();
    const thenQuote = context.popQuote();
    const condition = context.popBoolean();

    context.call(condition ? thenQuote : elseQuote);
  },

  "while"(context: Context) {
    const body = context.popQuote();
    const test = context.popQuote();

    for (;;) {
      context.call(test);
      if (!context.popBoolean()) {
        return;
      }
      context.call(body);
    }
  },

  "try"(context: Context) {
    const catchQuote = context.popQuote();
    const tryQuote = context.popQuote();

    try {
      context.call(tryQuote);
    } catch (e) {
      if (e instanceof RuntimeError) {
        context.call(catchQuote);
      } else {
        throw e;
      }
    }
  },

  "try-else"(context: Context) {
    const elseQuote = context.popQuote();
    const catchQuote = context.popQuote();
    const tryQuote = context.popQuote();

    try {
      context.call(tryQuote);
    } catch (e) {
      if (e instanceof RuntimeError) {
        context.call(catchQuote);
        return;
      } else {
        throw e;
      }
    }
    context.call(elseQuote);
  },

  compile(context: Context) {
    context.push(context.compile(context.popString()));
  },

  globals(context: Context) {
    context.push({
      type: PlorthValueType.OBJECT,
      properties: context.runtime.dictionary
    } as PlorthValue);
  },

  locals(context: Context) {
    context.push({
      type: PlorthValueType.OBJECT,
      properties: context.dictionary
    } as PlorthValue);
  },

  "const"(context: Context) {
    const id = context.popString();
    const value = context.pop();

    context.dictionary[id] = {
      type: PlorthValueType.WORD,
      symbol: {
        type: PlorthValueType.SYMBOL,
        id
      },
      quote: {
        type: PlorthValueType.QUOTE,
        values: [value]
      }
    };
  },

  import(context: Context) {
    return context.import(context.popString());
  },

  args(context: Context) {
    context.pushArray(...context.runtime.args.map(arg => ({
      type: PlorthValueType.STRING,
      value: arg
    })));
  },

  version(context: Context) {
    context.pushString(context.runtime.version);
  },

  "type-error"(context: Context) {
    context.pushError(PlorthErrorCode.TYPE, context.popString());
  },

  "value-error"(context: Context) {
    context.pushError(PlorthErrorCode.VALUE, context.popString());
  },

  "range-error"(context: Context) {
    context.pushError(PlorthErrorCode.RANGE, context.popString());
  },

  "unknown-error"(context: Context) {
    context.pushError(PlorthErrorCode.UNKNOWN, context.popString());
  },

  print(context: Context) {
    context.runtime.print(toString(context.pop()));
  },

  println(context: Context) {
    context.runtime.print(toString(context.pop()));
  },

  emit(context: Context) {
    context.runtime.print(String.fromCharCode(context.popNumber()));
  },

  now(context: Context) {
    context.pushNumber(Date.now());
  },

  "="(context: Context) {
    const a = context.pop();
    const b = context.pop();

    context.pushBoolean(b == a);
  },

  "!="(context: Context) {
    const a = context.pop();
    const b = context.pop();

    context.pushBoolean(b != a);
  },
};

export default GlobalDictionary;
