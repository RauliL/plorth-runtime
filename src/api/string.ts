import Context from "../context";
import { PrototypeDefinition } from "../runtime";

import {
  PlorthErrorCode,
  PlorthNumber,
  PlorthValue,
  PlorthValueType,
  PlorthString
} from "plorth-types";

const StringPrototype: PrototypeDefinition = {
  length(context: Context) {
    context.pushNumber(context.peekString().length);
  },

  chars(context: Context) {
    const string = context.peekString();
    const result: PlorthValue[] = [];

    for (let i = 0; i < string.length; ++i) {
      result.push({
        type: PlorthValueType.STRING,
        value: string[i]
      } as PlorthString);
    }
    context.pushArray(...result);
  },

  runes(context: Context) {
    const string = context.peekString();
    const result: PlorthValue[] = [];

    for (let i = 0; i < string.length; ++i) {
      result.push({
        type: PlorthValueType.NUMBER,
        value: string.charCodeAt(i)
      } as PlorthNumber);
    }
    context.pushArray(...result);
  },

  words(context: Context) {
    context.pushArray(...context.peekString().split(/\s+/).map(word => ({
      type: PlorthValueType.STRING,
      value: word
    }) as PlorthString));
  },

  lines(context: Context) {
    context.pushArray(...context.peekString().split(/(\r?\n)+/).map(line => ({
      type: PlorthValueType.STRING,
      value: line
    }) as PlorthString));
  },

  "space?"(context: Context) {
    const string = context.peekString();

    if (!string.length) {
      context.pushBoolean(false);
      return;
    }
    for (let i = 0; i < string.length; ++i) {
      if (!/\s/.test(string.charAt(i))) {
        context.pushBoolean(false);
        return;
      }
    }
    context.pushBoolean(true);
  },

  "lower-case?"(context: Context) {
    const string = context.peekString();

    if (!string.length) {
      context.pushBoolean(false);
      return;
    }
    for (let i = 0; i < string.length; ++i) {
      const c = string.charAt(i);

      if (c !== c.toLowerCase()) {
        context.pushBoolean(false);
        return;
      }
    }
    context.pushBoolean(true);
  },

  "upper-case?"(context: Context) {
    const string = context.peekString();

    if (!string.length) {
      context.pushBoolean(false);
      return;
    }
    for (let i = 0; i < string.length; ++i) {
      const c = string.charAt(i);

      if (c !== c.toUpperCase()) {
        context.pushBoolean(false);
        return;
      }
    }
    context.pushBoolean(true);
  },

  reverse(context: Context) {
    const string = context.popString();
    let result = "";

    for (let i = string.length; i > 0; --i) {
      result += string.charAt(i - 1);
    }
    context.pushString(result);
  },

  "upper-case"(context: Context) {
    context.pushString(context.popString().toUpperCase());
  },

  "lower-case"(context: Context) {
    context.pushString(context.popString().toLowerCase());
  },

  "swap-case"(context: Context) {
    const string = context.popString();
    let result = "";

    for (let i = 0; i < string.length; ++i) {
      let c = string.charAt(i);

      if (c === c.toUpperCase()) {
        c = c.toLowerCase();
      } else if (c === c.toLowerCase()) {
        c = c.toUpperCase();
      }
      result += c;
    }
    context.pushString(result);
  },

  capitalize(context: Context) {
    const string = context.popString();
    let result = "";

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
    context.pushString(context.popString().trim());
  },

  "trim-left"(context: Context) {
    context.pushString(context.popString().replace(/^\s+/, ""));
  },

  "trim-right"(context: Context) {
    context.pushString(context.popString().replace(/\s+$/, ""));
  },

  ">number"(context: Context) {
    const input = context.popString();
    const number = parseFloat(input);

    if (isNaN(number)) {
      throw context.error(
        PlorthErrorCode.VALUE,
        "Could not convert string to number."
      );
    }
    context.pushNumber(number);
  },

  "+"(context: Context) {
    const a = context.popString();
    const b = context.popString();

    context.pushString(b + a);
  },

  "*"(context: Context) {
    const string = context.popString();
    const count = context.popNumber();
    let result = "";

    if (count < 0) {
      throw context.error(PlorthErrorCode.RANGE, "Invalid repeat count.");
    }
    for (let i = 0; i < count; ++i) {
      result += string;
    }
    context.pushString(result);
  },

  "@"(context: Context) {
    const string = context.popString();
    let index = context.popNumber();

    if (index < 0) {
      index += string.length;
    }
    if (!string.length || index < 0 || index >= string.length) {
      throw context.error(
        PlorthErrorCode.RANGE,
        "String index out of bounds."
      );
    }
    context.pushString(string.charAt(index));
  },

  ">symbol"(context: Context) {
    context.pushSymbol(context.popString());
  },
};

export default StringPrototype;
