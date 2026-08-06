import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const LOCAL_KEY = "nagoya-exam-custom-problems";

function readLocalProblems() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalProblems(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

export async function listCustomProblems(subject) {
  if (!isSupabaseConfigured) {
    return readLocalProblems()
      .filter((item) => item.subject === subject)
      .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
  }

  const { data, error } = await supabase
    .from("custom_problems")
    .select("*")
    .eq("subject", subject)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export function makeCustomProblemDraft(subject) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    subject,
    title: "新しい問題",
    topic: "",
    source: "",
    status: "未着手",
    importance: "",
    short_memo: "",
    memo: "",
    created_at: now,
    updated_at: now,
  };
}

export async function createCustomProblem(problem) {
  if (!isSupabaseConfigured) {
    const items = readLocalProblems();
    writeLocalProblems([problem, ...items]);
    return problem;
  }

  const { data, error } = await supabase.from("custom_problems").insert(problem).select().single();
  if (error) throw error;
  return data;
}

export async function saveCustomProblemField(id, field, value) {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const items = readLocalProblems().map((item) =>
      item.id === id ? { ...item, [field]: value, updated_at: now } : item,
    );
    writeLocalProblems(items);
    return;
  }

  const { error } = await supabase
    .from("custom_problems")
    .update({ [field]: value, updated_at: now })
    .eq("id", id);

  if (error) throw error;
}

export async function saveCustomProblemFields(id, fields) {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const items = readLocalProblems().map((item) =>
      item.id === id ? { ...item, ...fields, updated_at: now } : item,
    );
    writeLocalProblems(items);
    return;
  }

  const { error } = await supabase
    .from("custom_problems")
    .update({ ...fields, updated_at: now })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteCustomProblem(id) {
  if (!isSupabaseConfigured) {
    writeLocalProblems(readLocalProblems().filter((item) => item.id !== id));
    return;
  }

  const { error } = await supabase.from("custom_problems").delete().eq("id", id);
  if (error) throw error;
}
