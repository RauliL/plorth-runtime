import Context from "../context";
import { PrototypeDefinition } from "../runtime";

const QuotePrototype: PrototypeDefinition = {
  call(context: Context) {
    context.call(context.popQuote());
  },

  compose(context: Context) {
    // TODO
  },

  curry(context: Context) {
    // TODO
  },

  negate(context: Context) {
    // TODO
  },

  dip(context: Context) {
    // TODO
  },

  "2dip"(context: Context) {
    // TODO
  },

  ">word"(context: Context) {
    const quote = context.popQuote();
    const symbol = context.popSymbol();

    context.pushWord(symbol, quote);
  },
};

export default QuotePrototype;
