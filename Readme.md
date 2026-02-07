## Curio Space

**Curio Space** is a generative discovery game where any subject is transformed into a navigable map of infinite possibilities. Powered by Gemini API, the system takes a single topic and procedurally generates a 2D coordinate system, allowing for the exploration of the "latent space" of human knowledge and AI imagination. Rather than inventing fictional items, the system acts as a **Perspective Architect**, recontextualizing iconic entities to reveal the hidden logic of a subject.

### The Mechanics

1. **Select a Subject:** The user inputs a broad category (e.g., "Japanese Aesthetics," "Classic Cinema," or "Macroeconomics") — or provides three examples and lets the AI discover the unifying category.
2. **Generate the Lens:** The AI defines two high-contrast axes. These are not just descriptors; they are a philosophical lens through which to view the topic.
3. **Map the Icons:** As the user selects $(x, y)$ coordinates, the system identifies **well-known cultural archetypes** that fit the point.
4. **The "Aha" Justification:** The system provides a brief rationale explaining why that specific item occupies that coordinate. The goal is to surprise the user with a logical connection they hadn't previously considered.

### Features

- **From 3 Items:** Provide three examples (e.g., "Tokyo Metro," "Bicycle," "Rickshaw"), and the AI will discover the evocative category that unites them, then automatically generate axes and place all three items on the map.
- **Interactive Mapping:** Click any coordinate to manifest an item, or use [PLACE] to position a specific item on the map.
- **Editable Axes:** Click axis labels to rename them and reshape the conceptual space in real-time.
- **Save & Load:** Export your complete maps as JSON files and restore them later to continue exploration.
- **Terminal Aesthetic:** Retro green-screen interface inspired by early computing systems.

### Technical Philosophy

- **No Hallucinations:** The system avoids "fictional filler." If a coordinate represents a logical impossibility, the AI identifies it as a "Boundary Paradox" and explains why that specific intersection cannot exist in reality.
- **Evocative Over Scientific:** The AI prioritizes poetic, lateral-thinking categories over dry taxonomic precision, creating "aha moments" of discovery.
- **Persistent Cartography:** Every discovery is plotted on a shared board, allowing the user to gradually build a complete conceptual atlas of the chosen subject.

---

### The Experience

The goal of **Curio Space** is cumulative discovery. It functions as a digital cabinet of curiosities where the user acts as both the explorer and the cartographer. By repeatedly picking points, the user builds a unique atlas of a chosen topic, revealing how the AI categorizes the world. Whether the system produces a factual entry or a bizarre hybrid, the resulting map provides a one-of-a-kind visual representation of a conceptual universe.

---