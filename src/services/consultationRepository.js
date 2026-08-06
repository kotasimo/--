import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const LOCAL_KEY = "nagoya-exam-consultation-logs";

function readLocalLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalLogs(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

export function pastExamOwnerId(subject, year) {
  return `${subject}:${year}`;
}

export async function listConsultationLogs(ownerType, ownerId) {
  if (!isSupabaseConfigured) {
    return readLocalLogs()
      .filter((item) => item.owner_type === ownerType && item.owner_id === ownerId)
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }

  const { data, error } = await supabase
    .from("consultation_logs")
    .select("*")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addConsultationLog({ ownerType, ownerId, subject, title, content }) {
  const item = {
    id: crypto.randomUUID(),
    owner_type: ownerType,
    owner_id: ownerId,
    subject,
    title,
    content,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    const items = readLocalLogs();
    writeLocalLogs([item, ...items]);
    return item;
  }

  const { data, error } = await supabase.from("consultation_logs").insert(item).select().single();
  if (error) throw error;
  return data;
}
