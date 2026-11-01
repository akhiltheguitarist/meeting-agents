import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

// Agent 1 instructions: same as stage3
const SUMMARIZER_PROMPT =
  "You are a meeting summarizer. Summarize the notes into exactly 3 short bullets. " +
  "State facts only (who did what, owners, deadlines, postponed items). No opinions.";

// Agent 2 instructions: pulls out action items
const EXTRACTOR_PROMPT =
  "You extract action items from meeting notes. Output one line per item in the format: " +
  "Owner - Task - Deadline. If the owner or deadline is not stated, write " +
  "'unassigned' or 'no deadline'. Never invent details.";

// Agent 3 instructions: now told to include every action item
const WRITER_PROMPT =
  "You write short, polite follow-up emails after meetings. " +
  "Output a subject line and a body under 100 words. " +
  "Include every action item in the email.";

// Reusable helper: one agent = a name + a system prompt, called with some input
async function runAgent(name: string, systemPrompt: string, input: string): Promise<string> {
  console.log(`[${name}] working...`);
  const res = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 2000, // headroom in case the model spends tokens on non-text blocks
    system: systemPrompt,
    messages: [{ role: "user", content: input }],
  });
  // Join the text blocks of the reply into one string
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  // Don't fail silently: show why the reply was empty
  if (!text.trim()) {
    console.warn(
      `[${name}] EMPTY reply. stop_reason=${res.stop_reason}, blocks=${res.content.map((b) => b.type).join(",")}`
    );
  }
  return text;
}

async function main() {
  const notes = readFileSync("notes.txt", "utf-8");

  // Step 1: Summarizer and Extractor both read the raw notes, so run them in parallel
  const start = Date.now();
  const [summary, actionItems] = await Promise.all([
    runAgent("SUMMARIZER", SUMMARIZER_PROMPT, notes),
    runAgent("EXTRACTOR", EXTRACTOR_PROMPT, notes),
  ]);
  console.log(`Parallel step took ${Date.now() - start} ms\n`);

  // Step 2: the Writer needs both results, so it runs after them
  const writerInput = `SUMMARY:\n${summary}\n\nACTION ITEMS:\n${actionItems}`;
  const email = await runAgent("WRITER", WRITER_PROMPT, writerInput);

  // Print each agent's output
  console.log("\n--- SUMMARY ---\n" + summary);
  console.log("\n--- ACTION ITEMS ---\n" + actionItems);
  console.log("\n--- FOLLOW-UP EMAIL ---\n" + email);

  // Save everything to output.md
  writeFileSync(
    "output.md",
    `# Summary\n\n${summary}\n\n# Action Items\n\n${actionItems}\n\n# Follow-up Email\n\n${email}\n`
  );
  console.log("\nSaved to output.md");
}

main();
