import fs from "node:fs";

function readEnvFile(path) {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => /^\s*[^#][^=]+=/.test(line))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]?.replace(/^--/, "");
    const value = argv[index + 1];
    if (!key || value === undefined) throw new Error(`Invalid argument near ${argv[index] || ""}`);
    args[key] = value;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const env = { ...readEnvFile(".env.local"), ...process.env };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
}

for (const required of ["owner-type", "owner-id", "subject", "title"]) {
  if (!args[required]) throw new Error(`Missing --${required}`);
}
if (!args["content-file"] && !args["messages-file"]) {
  throw new Error("Missing --content-file or --messages-file");
}

const content = args["messages-file"]
  ? JSON.stringify(JSON.parse(fs.readFileSync(args["messages-file"], "utf8")))
  : fs.readFileSync(args["content-file"], "utf8").trim();
if (!content) throw new Error("Content file is empty");

const response = await fetch(`${url}/rest/v1/consultation_logs`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json; charset=utf-8",
    Prefer: "return=representation",
  },
  body: JSON.stringify({
    owner_type: args["owner-type"],
    owner_id: args["owner-id"],
    subject: args.subject,
    title: args.title,
    content,
  }),
});

if (!response.ok) {
  throw new Error(await response.text());
}

const [saved] = await response.json();
console.log(JSON.stringify(saved, null, 2));
