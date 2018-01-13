import Context from "../context";
import { PrototypeDefinition } from "../runtime";
import { PlorthErrorCode, PlorthValue, PlorthValueType } from "plorth-types";
import { getType, isInstance, toSource, toString } from "../util";

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
    // TODO
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
    // TODO
  },

  "try-else"(context: Context) {
    // TODO
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

  "import"(context: Context) {
    // TODO
  },

  args(context: Context) {
    context.pushArray();
  },

  version(context: Context) {
    // TODO
  },

  "type-error"(context: Context) {
    // TODO
  },

  "value-error"(context: Context) {
    // TODO
  },

  "range-error"(context: Context) {
    // TODO
  },

  "unknown-error"(context: Context) {
    // TODO
  },

  print(context: Context) {
    context.runtime.print(toString(context.pop()));
  },

  println(context: Context) {
    context.runtime.print(toString(context.pop()));
  },

  emit(context: Context) {
    // TODO
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
