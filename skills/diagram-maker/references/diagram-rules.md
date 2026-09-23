# Diagram rules

| Relationship | Default |
|---|---|
| Few facts or linear steps | CLI table / numbered steps |
| Decisions and alternate paths | Flowchart |
| Time ordering across actors | Sequence |
| Legal state transitions | State diagram |
| Static dependencies | Directed component diagram |

Use Mermaid only if the consumer can render it, or explicitly wants source.
For file:// delivery without a renderer, use inline SVG inside the supplied HTML shell.
For each node/edge, record a source location or mark it as a proposed design.
Use directed edges with short verbs. Same variable spelling does not establish a connection.
Keep text within node bounds; wrap labels manually with SVG tspan if needed.
Keep lines behind nodes and arrowheads outside label areas. Leave enough whitespace to read the primary path.
Use dashed edges for unresolved links only when the legend explains that meaning.
If the diagram has more than nine meaningful nodes, split it by concern, not by arbitrary screen width.
Distinguish current implementation from a recommended future design.
