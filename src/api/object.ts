import Context from "../context";
import { PrototypeDefinition } from "../runtime";
import { PlorthString, PlorthValueType } from "plorth-types";

const ObjectPrototype: PrototypeDefinition = {
  keys(context: Context) {
    const { properties } = context.peekObject();

    context.pushArray(...Object.keys(properties).map((key: string) => ({
      type: PlorthValueType.STRING,
      value: key
    })));
  },

  values(context: Context) {
    const { properties } = context.peekObject();

    context.pushArray(...Object.keys(properties).map((key: string) => properties[key] | null));
  },

  "has?"(context: Context) {
    // TODO
  },

  "has-own?"(context: Context) {
    // TODO
  },

  "new"(context: Context) {
    // TODO
  },

  "@"(context: Context) {
    // TODO
  },

  "!"(context: Context) {
    // TODO
  },

  "delete"(context: Context) {
    // TODO
  },

  "+"(context: Context) {
    // TODO
  },
};

export default ObjectPrototype;
