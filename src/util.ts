import {
  PlorthArray,
  PlorthBoolean,
  PlorthNumber,
  PlorthObject,
  PlorthQuote,
  PlorthString,
  PlorthSymbol,
  PlorthWord,
  PlorthValue,
  PlorthValueType
} from "plorth-types";

export function isNumber(input: string): boolean {
  return /^[+-]?[0-9]+(\.[0-9]+)?$/.test(input); // TODO: Exponent support.
}

export function getType(value: PlorthValue | null): PlorthValueType {
  return value ? value.type : PlorthValueType.NULL;
}

export function isInstance(value: PlorthValue | null, type: PlorthValueType): boolean {
  if (value) {
    return value.type === type;
  } else {
    return type === PlorthValueType.NULL;
  }
}

export function getProperty(object: PlorthObject, key: string): PlorthObject | null) {
}

interface ToStringCallbacks {
  [key: string]: (value: PlorthValue) => string;
}

const toStringCallbacks: ToStringCallbacks = {
  [PlorthValueType.ARRAY]: (value: PlorthValue): string => {
    return (value as PlorthArray).elements.map(toString).join(", ");
  },

  [PlorthValueType.BOOLEAN]: (value: PlorthValue): string => {
    return (value as PlorthBoolean).value ? "true" : "false";
  },

  [PlorthValueType.ERROR]: (value: PlorthValue): string => {
    return "TODO";
  },

  [PlorthValueType.NUMBER]: (value: PlorthValue): string => {
    return `${(value as PlorthNumber).value}`;
  },

  [PlorthValueType.OBJECT]: (value: PlorthValue): string => {
    const { properties } = value as PlorthObject;
    let result = "";

    Object.keys(properties).forEach(key => {
      if (result.length > 0) {
        result += ", ";
      }
      result += `${key}=${toString(properties[key])}`;
    });

    return result;
  },

  [PlorthValueType.QUOTE]: (value: PlorthValue): string => {
    const { values } = value as PlorthQuote;

    if (values) {
      return values.map(toSource).join(" ");
    } else {
      return "\"native quote\"";
    }
  },

  [PlorthValueType.STRING]: (value: PlorthValue): string => {
    return (value as PlorthString).value;
  },

  [PlorthValueType.SYMBOL]: (value: PlorthValue): string => {
    return (value as PlorthSymbol).id;
  },

  [PlorthValueType.WORD]: (value: PlorthValue): string => {
    const { symbol, quote } = value as PlorthWord;

    if (quote.values) {
      return `: ${symbol.id} ${quote.values.map(toSource).join(" ")} ;`;
    } else {
      return `: ${symbol.id} "native quote" ;`;
    }
  },
};

export function toString(value: PlorthValue | null): string {
  const callback = toStringCallbacks[getType(value)];

  return callback && value ? callback(value) : "";
}

const toSourceCallbacks: ToStringCallbacks = {
  [PlorthValueType.ARRAY]: (value: PlorthValue): string => {
    return `[${(value as PlorthArray).elements.map(toSource).join(", ")}]`;
  },

  [PlorthValueType.ERROR]: (value: PlorthValue): string => {
    return `<${toString(value)}>`;
  },

  [PlorthValueType.OBJECT]: (value: PlorthValue): string => {
    const { properties } = value as PlorthObject;
    let result = "{";

    Object.keys(properties).forEach(key => {
      if (result.length > 1) {
        result += ", ";
      }
      result += `${JSON.stringify(key)}: ${toSource(properties[key])}`;
    });
    result += "}";

    return result;
  },

  [PlorthValueType.QUOTE]: (value: PlorthValue): string => {
    return `(${toString(value)})`;
  },

  [PlorthValueType.STRING]: (value: PlorthValue): string => {
    return JSON.stringify((value as PlorthString).value);
  }
};

export function toSource(value: PlorthValue | null): string {
  if (value) {
    const callback = toSourceCallbacks[value.type];

    return callback ? callback(value) : toString(value);
  }

  return "null";
}
