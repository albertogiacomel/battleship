# Battleship External AI API & MCP Integration

This document outlines how to implement an external AI server for the Battleship game using a standard JSON API or the Model Context Protocol (MCP).

## 1. REST API Specification

If you wish to host your own AI logic (e.g., Python/Flask, Node/Express), expose an endpoint that accepts the current board state and returns the next move.

### Endpoint
`POST /battleship/move`

### Request Body
```json
{
  "grid": [
    [{ "x": 0, "y": 0, "status": "empty" }, ... ], 
    ...
  ],
  "ships": [
    { "id": "carrier", "size": 5, "sunk": false },
    ...
  ],
  "difficulty": "hard"
}
```

- **grid**: A 10x10 array of cell objects. `status` can be `"empty"`, `"ship"`, `"hit"`, `"miss"`, `"sunk"`. Note that the client sends the *Player's Grid* (the target for the AI).
- **ships**: List of the player's ships and their status.
- **difficulty**: "easy", "medium", or "hard".

### Response Body
```json
{
  "x": 4,
  "y": 6
}
```

- **x**: 0-9 (Column)
- **y**: 0-9 (Row)

### Configuration
In the game settings menu, paste your full URL (e.g., `http://localhost:3000/battleship/move`) into the "External AI Endpoint" field.

---

## 2. Model Context Protocol (MCP) Integration

To use an MCP server (e.g., connecting to an LLM directly via a standardized protocol), you would typically need a bridge between the browser client and the MCP server, as MCP runs over stdio or SSE.

### Concept
Since this is a client-side React app, direct stdio connection to an MCP server is not possible. However, you can wrap your MCP server with an HTTP proxy or use an MCP-compliant SSE (Server-Sent Events) endpoint if supported by your LLM provider.

### Prompting Strategy for LLMs
If you are building an MCP tool for an LLM to play Battleship, define a tool `calculate_move`:

```json
{
  "name": "calculate_move",
  "description": "Calculates the next best shot in a game of Battleship.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "board_state": { "type": "string", "description": "ASCII representation of the board or JSON string" },
      "difficulty": { "type": "string", "enum": ["easy", "medium", "hard"] }
    },
    "required": ["board_state"]
  }
}
```

### Implementation Steps
1. **Server**: Run an MCP server that implements the `calculate_move` tool.
2. **Bridge**: Create a simple HTTP server that receives the POST request from the Battleship game (as defined in section 1).
3. **Translation**: The Bridge converts the JSON grid into a prompt or tool call for the connected MCP Client/LLM.
4. **Execution**: The LLM analyzes the grid and determines the best coordinate.
5. **Response**: The Bridge returns `{ "x": ..., "y": ... }` to the game.
