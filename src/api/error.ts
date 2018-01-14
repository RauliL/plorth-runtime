import Context from "../context";
import { PrototypeDefinition } from "../runtime";

const ErrorPrototype: PrototypeDefinition = {
  code(context: Context) {
    context.pushNumber(context.peekError().code);
  },

  message(context: Context) {
    const error = context.peekError();

    if (error.message) {
      context.pushString(error.message);
    } else {
      context.push(null);
    }
  },

  position(context: Context) {
    context.push(null);
  },

  "throw"(context: Context) {
    throw context.popError();
  }
};

export default ErrorPrototype;
