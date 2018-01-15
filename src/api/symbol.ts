import Context from "../context";
import { PrototypeDefinition } from "../runtime";

const SymbolPrototype: PrototypeDefinition = {
  position(context: Context) {
    context.push(null);
  },

  call(context: Context) {
    context.resolveSymbol(context.popSymbol());
  }
};

export default SymbolPrototype;
