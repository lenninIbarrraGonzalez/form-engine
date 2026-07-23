import type { FieldDefinition, FormDefinition, ShowIfCondition } from '../schema/types'

// ---- Public types ----------------------------------------------------

export interface DependencyGraph {
  /** edges[field] = Set of fields that depend on `field` (forward: dependency → dependents) */
  edges: Map<string, Set<string>>
  /** reverse[field] = Set of fields that `field` depends on (reverse: dependent → dependencies) */
  reverse: Map<string, Set<string>>
  /** All field names known to the graph */
  nodes: Set<string>
  /** showIf condition stored per dependent field name (for condition-evaluator) */
  fieldConditions: Map<string, ShowIfCondition>
}

export class CyclicDependencyError extends Error {
  constructor(cyclePath: string) {
    super(`Cyclic dependency detected: ${cyclePath}`)
    this.name = 'CyclicDependencyError'
    Object.setPrototypeOf(this, CyclicDependencyError.prototype)
  }
}

// ---- Condition field reference extraction ---------------------------

function extractFieldRefs(condition: ShowIfCondition): string[] {
  if ('and' in condition) return condition.and.flatMap(extractFieldRefs)
  if ('or' in condition) return condition.or.flatMap(extractFieldRefs)
  return [condition.field]
}

// ---- Recursive field traversal --------------------------------------

function collectEdges(
  fields: FieldDefinition[],
  edges: Map<string, Set<string>>,
  reverse: Map<string, Set<string>>,
  nodes: Set<string>,
  fieldConditions: Map<string, ShowIfCondition>,
  prefix: string = '',
): void {
  for (const field of fields) {
    const qualifiedName = prefix ? `${prefix}.${field.name}` : field.name
    nodes.add(qualifiedName)

    if (field.showIf) {
      fieldConditions.set(qualifiedName, field.showIf)
      for (const ref of extractFieldRefs(field.showIf)) {
        if (!edges.has(ref)) edges.set(ref, new Set())
        edges.get(ref)!.add(qualifiedName)

        if (!reverse.has(qualifiedName)) reverse.set(qualifiedName, new Set())
        reverse.get(qualifiedName)!.add(ref)
      }
    }

    if (field.fields && field.fields.length > 0) {
      collectEdges(field.fields, edges, reverse, nodes, fieldConditions, qualifiedName)
    }
  }
}

// ---- Cycle detection via DFS with colour marking -------------------
// white = unvisited, gray = in-stack (cycle candidate), black = done

// Iterative (explicit-stack) DFS so arbitrarily deep schemas cannot overflow
// the native JS call stack. `path` mirrors the gray frames on the stack and is
// used to reconstruct a readable cycle path when a back-edge is found.
function runDfsOnGraph(edges: Map<string, Set<string>>, allNodes: Set<string>): void {
  const color = new Map<string, 'white' | 'gray' | 'black'>()
  for (const n of allNodes) color.set(n, 'white')

  interface Frame {
    node: string
    neighbors: Iterator<string>
  }

  const emptyNeighbors: Iterable<string> = []

  for (const start of color.keys()) {
    if (color.get(start) !== 'white') continue

    const path: string[] = [start]
    const stack: Frame[] = [
      { node: start, neighbors: (edges.get(start) ?? emptyNeighbors)[Symbol.iterator]() },
    ]
    color.set(start, 'gray')

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]
      const step = frame.neighbors.next()

      if (step.done) {
        color.set(frame.node, 'black')
        stack.pop()
        path.pop()
        continue
      }

      const neighbor = step.value
      const neighborColor = color.get(neighbor)

      if (neighborColor === 'gray') {
        const cycleStart = path.indexOf(neighbor)
        const cyclePath = [...path.slice(cycleStart), neighbor].join(' → ')
        throw new CyclicDependencyError(cyclePath)
      }

      if (neighborColor !== 'black') {
        color.set(neighbor, 'gray')
        path.push(neighbor)
        stack.push({
          node: neighbor,
          neighbors: (edges.get(neighbor) ?? emptyNeighbors)[Symbol.iterator](),
        })
      }
    }
  }
}

// ---- Public API ------------------------------------------------------

/**
 * Builds a dependency graph from a FormDefinition.
 * Throws CyclicDependencyError if any cycle is detected.
 */
export function buildDependencyGraph(definition: FormDefinition): DependencyGraph {
  const edges = new Map<string, Set<string>>()
  const reverse = new Map<string, Set<string>>()
  const nodes = new Set<string>()
  const fieldConditions = new Map<string, ShowIfCondition>()

  const allFields = [
    ...(definition.fields ?? []),
    ...(definition.steps?.flatMap((s) => s.fields) ?? []),
  ]

  collectEdges(allFields, edges, reverse, nodes, fieldConditions)

  // Reject references to undeclared fields — fail at schema time, not runtime
  for (const ref of edges.keys()) {
    if (!nodes.has(ref)) {
      throw new Error(`showIf references unknown field: "${ref}"`)
    }
  }

  runDfsOnGraph(edges, nodes)

  return { edges, reverse, nodes, fieldConditions }
}

/**
 * Returns field names in topological order (dependencies before dependents).
 * Assumes the graph is acyclic (buildDependencyGraph already enforces this).
 */
export function getTopologicalOrder(graph: DependencyGraph): string[] {
  const allNodes = new Set([...graph.nodes, ...graph.edges.keys()])
  const inDegree = new Map<string, number>()

  for (const n of allNodes) inDegree.set(n, 0)
  for (const [, dependents] of graph.edges) {
    for (const dep of dependents) {
      inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1)
    }
  }

  const queue = [...inDegree.entries()]
    .filter(([, deg]) => deg === 0)
    .map(([n]) => n)

  const order: string[] = []
  while (queue.length > 0) {
    const node = queue.shift()!
    order.push(node)
    for (const dep of graph.edges.get(node) ?? []) {
      const newDeg = (inDegree.get(dep) ?? 1) - 1
      inDegree.set(dep, newDeg)
      if (newDeg === 0) queue.push(dep)
    }
  }

  return order
}

/**
 * Returns all field names that transitively depend on `fieldName`.
 * Uses BFS over forward edges.
 */
export function getTransitiveDependents(
  graph: DependencyGraph,
  fieldName: string,
): string[] {
  const visited = new Set<string>()
  const queue = [fieldName]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const dep of graph.edges.get(current) ?? []) {
      if (!visited.has(dep)) {
        visited.add(dep)
        queue.push(dep)
      }
    }
  }

  return Array.from(visited)
}
