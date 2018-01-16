import Context from "../context";
import { PrototypeDefinition } from "../runtime";
import { PlorthErrorCode, PlorthValue } from "plorth-types";
import { toString } from "../util";

const ArrayPrototype: PrototypeDefinition = {
  length(context: Context) {
    context.pushNumber(context.peekArray().length);
  },

  push(context: Context) {
    const array = context.popArray();
    const value = context.pop();

    context.pushArray(...array, value);
  },

  pop(context: Context) {
    const array = context.popArray();

    if (!array.length) {
      throw context.error(PlorthErrorCode.RANGE, "Array is empty.");
    }
    context.pushArray(...array.splice(0, array.length - 1));
    context.push(array[array.length - 1]);
  },

  "includes?"(context: Context) {
    const array = context.popArray();
    const value = context.pop();

    context.pushArray(...array);
    context.pushBoolean(array.indexOf(value) >= 0);
  },

  "index-of"(context: Context) {
    const array = context.popArray();
    const value = context.pop();
    const index = array.indexOf(value);

    context.pushArray(...array);
    if (index >= 0) {
      context.pushNumber(index);
    } else {
      context.push(null);
    }
  },

  find(context: Context) {
    const array = context.popArray();
    const quote = context.popQuote();

    context.pushArray(...array);
    array.forEach(value => {
      context.push(value);
      context.call(quote);
      if (context.popBoolean()) {
        context.push(value);
        return;
      }
    });
    context.push(null);
  },

  "find-index"(context: Context) {
    const array = context.popArray();
    const quote = context.popQuote();

    context.pushArray(...array);
    array.forEach((value, index) => {
      context.push(value);
      context.call(quote);
      if (context.popBoolean()) {
        context.pushNumber(index);
        return;
      }
    });
    context.push(null);
  },

  "every?"(context: Context) {
    const array = context.popArray();
    const quote = context.popQuote();

    context.pushArray(...array);
    array.forEach(value => {
      context.push(value);
      context.call(quote);
      if (!context.popBoolean()) {
        context.pushBoolean(false);
        return;
      }
    });
    context.pushBoolean(true);
  },

  "some?"(context: Context) {
    const array = context.popArray();
    const quote = context.popQuote();

    context.pushArray(...array);
    array.forEach(value => {
      context.push(value);
      context.call(quote);
      if (context.popBoolean()) {
        context.pushBoolean(true);
        return;
      }
    });
    context.pushBoolean(false);
  },

  reverse(context: Context) {
    const array = context.popArray();
    const result: Array<PlorthValue | null> = [];

    for (let i = array.length; i > 0; --i) {
      result.push(array[i - 1]);
    }
    context.pushArray(...result);
  },

  uniq(context: Context) {
    const array = context.popArray();
    const result: Array<PlorthValue | null> = [];

    array.forEach(value => {
      const index = result.indexOf(value);

      if (index < 0) {
        result.push(value);
      }
    });
    context.pushArray(...result);
  },

  extract(context: Context) {
    const array = context.popArray();

    for (let i = array.length; i > 0; --i) {
      context.push(array[i - 1]);
    }
  },

  join(context: Context) {
    const array = context.popArray();
    const string = context.popString();

    context.pushString(array.map(toString).join(string));
  },

  ">quote"(context: Context) {
    context.pushQuote(...context.popArray());
  },

  "for-each"(context: Context) {
    const array = context.popArray();
    const quote = context.popQuote();

    array.forEach(value => {
      context.push(value);
      context.call(quote);
    });
  },

  "2for-each"(context: Context) {
    const b = context.popArray();
    const a = context.popArray();
    const size = Math.min(a.length, b.length);
    const quote = context.popQuote();

    for (let i = 0; i < size; ++i) {
      context.push(a[i], b[i]);
      context.call(quote);
    }
  },

  map(context: Context) {
    const array = context.popArray();
    const quote = context.popQuote();
    const result: Array<PlorthValue | null> = [];

    array.forEach(value => {
      context.push(value);
      context.call(quote);
      result.push(context.pop());
    });
    context.pushArray(...result);
  },

  "2map"(context: Context) {
    const b = context.popArray();
    const a = context.popArray();
    const size = Math.min(a.length, b.length);
    const quote = context.popQuote();
    const result: Array<PlorthValue | null> = [];

    for (let i = 0; i < size; ++i) {
      context.push(a[i], b[i]);
      context.call(quote);
      result.push(context.pop());
    }
    context.pushArray(...result);
  },

  filter(context: Context) {
    const array = context.popArray();
    const quote = context.popQuote();
    const result: Array<PlorthValue | null> = [];

    array.forEach(value => {
      context.push(value);
      context.call(quote);
      if (context.popBoolean()) {
        result.push(value);
      }
    });
    context.pushArray(...result);
  },

  reduce(context: Context) {
    const array = context.popArray();
    const quote = context.popQuote();
    let result: PlorthValue | null = null;

    if (!array.length) {
      throw context.error(PlorthErrorCode.RANGE, "Cannot reduce empty array.");
    }
    array.forEach(value => {
      context.push(value);
      context.call(quote);
      result = context.pop();
    });
    context.push(result);
  },

  "+"(context: Context) {
    const a = context.popArray();
    const b = context.popArray();

    context.pushArray(...b, ...a);
  },

  "*"(context: Context) {
    const array = context.popArray();
    const count = context.popNumber();
    const result: Array<PlorthValue | null> = [];

    if (count < 0) {
      throw context.error(PlorthErrorCode.RANGE, "Invalid repeat count.");
    }
    for (let i = 0; i < count; ++i) {
      result.push(...array);
    }
    context.pushArray(...result);
  },

  "&"(context: Context) {
    const a = context.popArray();
    const b = context.popArray();

    context.pushArray(...a.filter(value => b.indexOf(value) >= 0));
  },

  "|"(context: Context) {
    const a = context.popArray();
    const b = context.popArray();
    const result: Array<PlorthValue | null> = [];

    a.forEach(value => {
      if (result.indexOf(value) < 0) {
        result.push(value);
      }
    });
    b.forEach(value => {
      if (result.indexOf(value) < 0) {
        result.push(value);
      }
    });
    context.pushArray(...result);
  },

  "@"(context: Context) {
    const array = context.popArray();
    let index = context.popNumber();

    if (index < 0) {
      index += array.length;
    }
    if (!array.length || index < 0 || index >= array.length) {
      throw context.error(PlorthErrorCode.RANGE, "Array index out of bounds.");
    }
    context.push(array[index]);
  },

  "!"(context: Context) {
    const array = context.popArray();
    let index = context.popNumber();

    if (index < 0) {
      index += array.length;
    }
    if (!array.length || index < 0 || index >= array.length) {
      throw context.error(PlorthErrorCode.RANGE, "Array index out of bounds.");
    }
    context.pushArray(
      ...array.slice(0, index),
      context.pop(),
      ...array.slice(index + 1)
    );
  }
};

export default ArrayPrototype;
