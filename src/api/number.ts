import Context from "../context";
import { PrototypeDefinition } from "../runtime";

const NumberPrototype: PrototypeDefinition = {
  "nan?"(context: Context) {
    context.pushBoolean(isNaN(context.peekNumber()));
  },

  "finite?"(context: Context) {
    context.pushBoolean(isFinite(context.peekNumber()));
  },

  times(context: Context) {
    let count = context.popNumber();
    const quote = context.popQuote();

    if (count < 0) {
      count = -count;
    }
    while (count > 0) {
      --count;
      context.call(quote);
    }
  },

  abs(context: Context) {
    const number = context.popNumber();

    context.pushNumber(number < 0 ? -number : number);
  },

  round(context: Context) {
    context.pushNumber(Math.round(context.popNumber()));
  },

  floor(context: Context) {
    context.pushNumber(Math.floor(context.popNumber()));
  },

  ceil(context: Context) {
    context.pushNumber(Math.ceil(context.popNumber()));
  },

  max(context: Context) {
    context.pushNumber(Math.max(context.popNumber(), context.popNumber()));
  },

  min(context: Context) {
    context.pushNumber(Math.min(context.popNumber(), context.popNumber()));
  },

  clamp(context: Context) {
    let number = context.popNumber();
    const max = context.popNumber();
    const min = context.popNumber();

    if (number > max) {
      number = max;
    }
    if (number < min) {
      number = min;
    }
    context.pushNumber(number);
  },

  "in-range?"(context: Context) {
    const number = context.popNumber();
    const max = context.popNumber();
    const min = context.popNumber();

    context.pushBoolean(number >= min && number <= max);
  },

  "+"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushNumber(b + a);
  },

  "-"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushNumber(b - a);
  },

  "*"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushNumber(b * a);
  },

  "/"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushNumber(a / b);
  },

  "%"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushNumber(a % b);
  },

  "&"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushNumber(b & a);
  },

  "|"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushNumber(b | a);
  },

  "^"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushNumber(b ^ a);
  },

  "<<"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushNumber(b << a);
  },

  ">>"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushNumber(b >> a);
  },

  "~"(context: Context) {
    context.pushNumber(~context.popNumber());
  },

  "<"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushBoolean(b < a);
  },

  ">"(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushBoolean(b > a);
  },

  "<="(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushBoolean(b <= a);
  },

  ">="(context: Context) {
    const a = context.popNumber();
    const b = context.popNumber();

    context.pushBoolean(b >= a);
  }
};

export default NumberPrototype;
