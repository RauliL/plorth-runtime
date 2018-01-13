import Context from "../context";
import { PrototypeDefinition } from "../runtime";

const BooleanPrototype: PrototypeDefinition = {
  and(context: Context) {
    const a = context.popBoolean();
    const b = context.popBoolean();

    context.pushBoolean(b && a);
  },

  or(context: Context) {
    const a = context.popBoolean();
    const b = context.popBoolean();

    context.pushBoolean(b || a);
  },

  xor(context: Context) {
    const a = context.popBoolean();
    const b = context.popBoolean();

    context.pushBoolean(b != a && (b || a));
  },

  not(context: Context) {
    context.pushBoolean(!context.popBoolean());
  },

  "?"(context: Context) {
    const a = context.popBoolean();
    const b = context.pop();
    const c = context.pop();

    context.push(a ? c : b);
  }
};

export default BooleanPrototype;
