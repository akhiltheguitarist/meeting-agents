import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

// Agent 1 instructions: same as stage2
const SUMMARIZER_PROMPT =
  "You are a meeting summarizer. Summarize the notes into exactly 3 short bullets. " +
  "State facts only (who did what, owners, deadlines, postponed items). No opinions.";

// Agent 2 instructions
const WRITER_PROMPT =
  "You write short, polite follow-up emails after meetings. " +
  "Output a subject line and a body under 100 words.";

// Reusable helper: one agent = a name + a system prompt, called with some input
async function runAgent(name: string, systemPrompt: string, input: string): Promise<string> {
  console.log(`[${name}] working...`);
  const res = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: input }],
  });
  // Join the text blocks of the reply into one string
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

async function main() {
  const notes = readFileSync("notes.txt", "utf-8");

  // Step 1: the Summarizer gets the raw notes
  const summary = await runAgent("SUMMARIZER", SUMMARIZER_PROMPT, notes);
  console.log("\n--- SUMMARIZER INPUT ---\n" + notes);
  console.log("--- SUMMARIZER OUTPUT ---\n" + summary + "\n");

  // Step 2 (the handoff): the Writer gets ONLY the Summarizer's output
  const email = await runAgent("WRITER", WRITER_PROMPT, summary);
  console.log("\n--- WRITER INPUT ---\n" + summary);
  console.log("--- WRITER OUTPUT ---\n" + email);
}

main();
