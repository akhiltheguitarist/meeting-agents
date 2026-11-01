import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

async function main() {
  const res = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content:
          "Summarize these notes: Weekly sync. Priya fixed the login bug in staging, needs QA. Ravi checks QA by Friday. Dashboard redesign postponed to next sprint.",
      },
    ],
  });

  console.log(res.content);
  console.log("Tokens used:", res.usage);
}

main();
