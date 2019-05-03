import { Values } from 'core-object/-private/utils';

declare const postcssValueParser: PostcssValueParser;

export = postcssValueParser;

interface PostcssValueParser {
  (input: string): NodeTree;

  /**
   * Parses `quantity`, distinguishing the number from the unit.
   */
  unit(quantity: string): Quantity;

  /**
   * Stringifies a node or array of nodes.
   *
   * @param nodes The node(s) to serialize.
   * @param custom The custom function is called for each node; return a string
   *   to override the default behavior.
   */
  stringify(nodes: Node | Node[], custom?: (node: Node) => string): string;

  /**
   * Walks each provided node, recursively walking all descendent nodes within
   * functions.
   *
   * Returning `false` in the callback will prevent traversal of descendent
   * nodes (within functions). You can use this feature for shallow iteration,
   * walking over only the immediate children.
   *
   * Note: This only applies if `bubble` is `false`, which is the default.
   *
   * By default, the tree is walked from the outermost node inwards. To reverse
   * the direction, pass `true` for the `bubble` argument.
   *
   * @param nodes The nodes to walk over.
   * @param callback Called for every node.
   * @param bubble If `true`, walk from the inside to the outside.
   */
  walk(nodes: Node[], callback: Callback, bubble?: boolean): PostcssValueParser;
}

type Callback = (
  node: DiscriminatedNode,
  index: number,
  nodes: DiscriminatedNode[]
) => void;

interface Quantity {
  number: string;
  unit: string;
}

interface NodeTree {
  nodes: Node[];

  /**
   * Stringifies the node tree.
   */
  toString(): string;

  /**
   * Walks each node in `nodes`, recursively walking all descendent nodes within
   * functions.
   *
   * Returning `false` in the callback will prevent traversal of descendent
   * nodes (within functions). You can use this feature for shallow iteration,
   * walking over only the immediate children.
   *
   * Note: This only applies if `bubble` is `false`, which is the default.
   *
   * By default, the tree is walked from the outermost node inwards. To reverse
   * the direction, pass `true` for the `bubble` argument.
   *
   * @see `valueParser.walk()`
   *
   * @param callback Called for every node.
   * @param bubble If `true`, walk from the inside to the outside.
   */
  walk(callback: Callback, bubble?: boolean): NodeTree;
}

declare enum NodeType {
  Word = 'word',
  String = 'string',
  Div = 'div',
  Space = 'space',
  Comment = 'comment',
  Function = 'function'
}

interface Node {
  /**
   * The type of node.
   */
  type: 'word' | 'string' | 'div' | 'space' | 'comment' | 'function';

  /**
   *  Each node has a `value` property; but what exactly value means is specific
   * to the node type.
   */
  value: string;

  /**
   * The starting index of the node within the original source string.
   * For example, given the source string `10px 20px`, the `word `node whose
   * value is `20px` will have a `sourceIndex` of `5`.
   */
  sourceIndex: number;
}

type DiscriminatedNode =
  | WordNode
  | StringNode
  | DivNode
  | SpaceNode
  | CommentNode
  | FunctionNode;

/**
 * The catch-all node type that includes keywords (e.g. `no-repeat`), quantities
 * (e.g. `20px`, `75%`, `1.5`), and hex colors (e.g. `#e6e6e6`).
 */
interface WordNode extends Node {
  type: NodeType.Word;

  /**
   * The "word" itself.
   */
  value: string;
}

/**
 * A quoted string value, e.g. `"something"` in `content: "something";`.
 */
interface StringNode extends Node {
  type: NodeType.String;

  /**
   * The text content of the string.
   */
  value: string;

  /**
   * The quotation mark surrounding the string, either `"` or `'`.
   */
  quote: '"' | "'";

  /**
   * `true` if the string was not closed properly. e.g. "`unclosed string `.
   */
  unclosed: boolean;
}

/**
 * A divider, for example
 *
 * - `,` in `animation-duration: 1s, 2s, 3s`
 * - `/` in `border-radius: 10px / 23px`
 * - `:` in `(min-width: 700px)`
 */
interface DivNode extends Node {
  type: NodeType.Div;

  /**
   * The divider character. Either `,`, `/`, or `:` (see examples above).
   */
  value: ',' | '/' | ':';

  /**
   * Whitespace before the divider.
   */
  before: string;

  /**
   * Whitespace after the divider.
   */
  after: string;
}

/**
 * Whitespace used as a separator, e.g. ` ` occurring twice in
 * `border: 1px solid black;`.
 */
interface SpaceNode extends Node {
  type: NodeType.Space;

  /**
   * The whitespace itself.
   */
  value: string;
}

/**
 * A CSS comment.
 */
interface CommentNode extends Node {
  type: NodeType.Comment;

  /**
   * The comment value without the enclosing `/*`.
   */
  value: string;

  /**
   * `true`, if the comment was not closed properly, e.g.
   * `/* comment without an end `.
   */
  unclosed: boolean;
}

/**
 * A CSS function, e.g. `rgb(0,0,0)` or `url(foo.bar)`.
 *
 * Function nodes have `nodes` nested within them: the function arguments.
 */
interface FunctionNode extends Node {
  type: NodeType.Function;

  /**
   * The name of the function, e.g. `rgb` in `rgb(0,0,0)`.
   */
  value: string;

  /**
   * Whitespace after the opening parenthesis and before the first argument,
   * e.g. ` ` in `rgb( 0,0,0)`.
   */
  before: string;

  /**
   * Whitespace before the closing parenthesis and after the last argument,
   * e.g. ` ` in `rgb(0,0,0 )`.
   */
  after: string;

  /**
   * More nodes representing the arguments to the function.
   */
  nodes: Node[];

  /**
   * `true`, if the parentheses was not closed properly. e.g.
   * `( unclosed-function `.
   */
  unclosed: boolean;
}
