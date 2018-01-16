import Context from "../context";
import { PrototypeDefinition } from "../runtime";
import { getProperty, hasProperty } from "../util";

import {
  PlorthErrorCode,
  PlorthObject,
  PlorthQuote,
  PlorthString,
  PlorthValue,
  PlorthValueType
} from "plorth-types";

const ObjectPrototype: PrototypeDefinition = {
  keys(context: Context) {
    const { properties } = context.peekObject();

    context.pushArray(...Object.keys(properties).map(key => ({
      type: PlorthValueType.STRING,
      value: key
    }) as PlorthString));
  },

  values(context: Context) {
    const { properties } = context.peekObject();

    context.pushArray(...Object.keys(properties).map(key => properties[key]));
  },

  "has?"(context: Context) {
    const object = context.popObject();
    const id = context.popString();

    context.push(object);
    context.pushBoolean(hasProperty(context.runtime, object, id));
  },

  "has-own?"(context: Context) {
    const object = context.popObject();
    const id = context.popString();

    context.push(object);
    context.pushBoolean(hasProperty(context.runtime, object, id, false));
  },

  "new"(context: Context) {
    const object = context.popObject();
    let prototype: PlorthObject | null = null;
    let constructor: PlorthQuote | null = null;

    try {
      const value = getProperty(context.runtime, object, "prototype");

      if (value && value.type === PlorthValueType.OBJECT) {
        prototype = value as PlorthObject;
      }
    } catch (e) {}

    if (!prototype) {
      throw context.error(PlorthErrorCode.TYPE, "Object has no prototype.");
    }

    try {
      const value = getProperty(context.runtime, prototype, "constructor");

      if (value && value.type === PlorthValueType.QUOTE) {
        constructor = value as PlorthQuote;
      }
    } catch (e) {}

    context.pushObject({ __proto__: prototype });
    if (constructor) {
      context.call(constructor);
    }
  },

  "@"(context: Context) {
    const object = context.popObject();
    const key = context.popString();

    context.push(object);
    context.push(getProperty(context.runtime, object, key));
  },

  "!"(context: Context) {
    const { properties } = context.popObject();
    const key = context.popString();
    const value = context.pop();

    context.pushObject({ ...properties, [key]: value });
  },

  "delete"(context: Context) {
    const properties = Object.assign({}, context.popObject().properties);
    const id = context.popString();

    if (typeof properties[id] === "undefined") {
      throw context.error(PlorthErrorCode.RANGE, `No such property: \`${id}'`);
    }
    delete properties[id];
    context.pushObject(properties);
  },

  "+"(context: Context) {
    const a = context.popObject().properties;
    const b = context.popObject().properties;

    context.pushObject({ ...b, ...a });
  },
};

export default ObjectPrototype;
