import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

// The SUMMARIZER agent's instructions
const SUMMARIZER_PROMPT =
  "You are a meeting summarizer. Summarize the notes into exactly 3 short bullets. " +
  "State facts only (who did what, owners, deadlines, postponed items). No opinions.";

async function main() {
  // 1. Read the meeting notes from a file
  const notes = readFileSync("notes.txt", "utf-8");

  // 2. Call the model with the system prompt + notes
  const res = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 500,
    system: SUMMARIZER_PROMPT,
    messages: [{ role: "user", content: notes }],
  });

  // 3. Print everything so we can see what went in and out
  const output = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  console.log("--- SYSTEM PROMPT ---\n" + SUMMARIZER_PROMPT);
  console.log("\n--- INPUT ---\n" + notes);
  console.log("--- OUTPUT ---\n" + output);
}

main();
