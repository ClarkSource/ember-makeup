import { Node, DiscriminatedNode, FunctionNode } from 'postcss-value-parser';

export const isFunctionNode = (node: any): node is FunctionNode =>
  node && node.type === 'function' && Array.isArray(node.nodes);

type MappedFunctionNode<T> = Omit<FunctionNode, 'nodes'> & { nodes: T[] };

type Mapper<T> = (
  node: DiscriminatedNode | MappedFunctionNode<unknown>, // Technically `<T>`, but this leads to recursive types
  index: number,
  nodes: DiscriminatedNode[]
) => T;

export function map<T>(nodes: Node[], mapper: Mapper<T>): T[] {
  return (nodes as DiscriminatedNode[]).map((node, index) => {
    let currentNode: DiscriminatedNode | MappedFunctionNode<T> = node;
    if (isFunctionNode(node)) {
      currentNode = { ...node, nodes: map(node.nodes, mapper) };
    }
    return mapper(currentNode, index, nodes as DiscriminatedNode[]);
  });
}
