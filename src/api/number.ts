import Context from "../context";
import { PrototypeDefinition } from "../runtime";

const NumberPrototype: PrototypeDefinition = {
  "nan?"(context: Context) {
    // TODO
  },

  "finite?"(context: Context) {
    // TODO
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
    // TODO
  },

  round(context: Context) {
    // TODO
  },

  floor(context: Context) {
    // TODO
  },

  ceil(context: Context) {
    // TODO
  },

  max(context: Context) {
    // TODO
  },

  min(context: Context) {
    // TODO
  },

  clamp(context: Context) {
    // TODO
  },

  "in-range?"(context: Context) {
    // TODO
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
    // TODO
  },

  "%"(context: Context) {
    // TODO
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
