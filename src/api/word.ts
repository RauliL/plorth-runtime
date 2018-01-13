import Context from "../context";
import { PrototypeDefinition } from "../runtime";

const WordPrototype: PrototypeDefinition = {
  symbol(context: Context) {
    context.push(context.peekWord().symbol);
  },

  quote(context: Context) {
    context.push(context.peekWord().quote);
  },

  call(context: Context) {
    context.call(context.popWord().quote);
  },

  define(context: Context) {
    const word = context.popWord();

    context.dictionary[word.symbol.id] = word;
  }
};

export default WordPrototype;
