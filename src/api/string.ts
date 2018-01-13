import Context from "../context";
import { PrototypeDefinition } from "../runtime";

const StringPrototype: PrototypeDefinition = {
  length(context: Context) {
    context.pushNumber(context.peekString().length);
  },

  chars(context: Context) {
    // TODO
  },

  runes(context: Context) {
    // TODO
  },

  words(context: Context) {
    // TODO
  },

  lines(context: Context) {
    // TODO
  },

  "includes?"(context: Context) {
    // TODO
  },

  "index-of"(context: Context) {
    // TODO
  },

  "starts-with?"(context: Context) {
    // TODO
  },

  "ends-with?"(context: Context) {
    // TODO
  },

  "space?"(context: Context) {
    // TODO
  },

  "lower-case?"(context: Context) {
    // TODO
  },

  "upper-case?"(context: Context) {
    // TODO
  },

  reverse(context: Context) {
    // TODO
  },

  "upper-case"(context: Context) {
    context.pushString(context.popString().toUpperCase());
  },

  "lower-case"(context: Context) {
    context.pushString(context.popString().toLowerCase());
  },

  "swap-case"(context: Context) {
    // TODO
  },

  capitalize(context: Context) {
    const string = context.popString();
    let result = '';

    for (let i = 0; i < string.length; ++i) {
      const c = string[i];

      if (i === 0) {
        result += c.toUpperCase();
      } else {
        result += c.toLowerCase();
      }
    }
    context.pushString(result);
  },

  trim(context: Context) {
    // TODO
  },

  "trim-left"(context: Context) {
    // TODO
  },

  "trim-right"(context: Context) {
    // TODO
  },

  "pad-left"(context: Context) {
    // TODO
  },

  "pad-right"(context: Context) {
    // TODO
  },

  substring(context: Context) {
    // TODO
  },

  split(context: Context) {
    // TODO
  },

  replace(context: Context) {
    // TODO
  },

  normalize(context: Context) {
    // TODO
  },

  ">number"(context: Context) {
    // TODO
  },

  "+"(context: Context) {
    const a = context.popString();
    const b = context.popString();

    context.pushString(b + a);
  },

  "*"(context: Context) {
    // TODO
  },

  "@"(context: Context) {
    // TODO
  },

  ">symbol"(context: Context) {
    context.pushSymbol(context.popString());
  },
};

export default StringPrototype;
