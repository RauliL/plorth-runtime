import Context from "../context";
import { PrototypeDefinition } from "../runtime";
import { PlorthQuote, PlorthValueType } from "plorth-types";

const QuotePrototype: PrototypeDefinition = {
  call(context: Context) {
    context.call(context.popQuote());
  },

  compose(context: Context) {
    const right = context.popQuote();
    const left = context.popQuote();

    context.push({
      type: PlorthValueType.QUOTE,
      callback(subContext: Context) {
        subContext.call(left);
        subContext.call(right);
      }
    } as PlorthQuote);
  },

  curry(context: Context) {
    const quote = context.popQuote();
    const argument = context.pop();

    context.push({
      type: PlorthQuote,
      callback(subContext: Context) {
        subContext.push(argument);
        subContext.call(quote);
      }
    } as PlorthQuote);
  },

  negate(context: Context) {
    const quote = context.popQuote();

    context.push({
      type: PlorthValueType.QUOTE,
      callback(subContext: Context) {
        subContext.call(quote);
        subContext.pushBoolean(!subContext.popBoolean());
      }
    } as PlorthQuote);
  },

  dip(context: Context) {
    const quote = context.popQuote();
    const value = context.pop();

    context.call(quote);
    context.push(value);
  },

  "2dip"(context: Context) {
    const quote = context.popQuote();
    const value2 = context.pop();
    const value1 = context.pop();

    context.call(quote);
    context.push(value1, value2);
  },

  ">word"(context: Context) {
    const quote = context.popQuote();
    const symbol = context.popSymbol();

    context.pushWord(symbol, quote);
  },
};

export default QuotePrototype;
