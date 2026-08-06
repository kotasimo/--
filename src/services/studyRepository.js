import { getYearsForSubject, tableColumns } from "../data/examMeta.js";
import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const NOTE_PREFIX = "nagoya-exam-note";
const TABLE_PREFIX = "nagoya-exam-table";
const ZOOM_KEY = "nagoya-exam-image-zoom";

function emptyRecord(subject, year) {
  return {
    subject,
    year,
    status: "未着手",
    difficulty: "",
    score: "",
    formula: "",
    memo: "",
  };
}

function localMemoKey(subject, year) {
  return `${NOTE_PREFIX}:${subject}:${year}`;
}

function localTableKey(subject, year, field) {
  return `${TABLE_PREFIX}:${subject}:${year}:${field}`;
}

export function getZoom() {
  return Number(localStorage.getItem(ZOOM_KEY) || 100);
}

export function saveZoom(value) {
  localStorage.setItem(ZOOM_KEY, String(value));
}

export async function loadSubjectRecords(subject) {
  const years = getYearsForSubject(subject);
  const records = Object.fromEntries(years.map((year) => [year, emptyRecord(subject, year)]));

  if (!isSupabaseConfigured) {
    for (const year of years) {
      records[year].memo = localStorage.getItem(localMemoKey(subject, year)) || "";
      for (const column of tableColumns) {
        records[year][column.key] =
          column.key === "status"
            ? localStorage.getItem(localTableKey(subject, year, column.key)) || "未着手"
            : localStorage.getItem(localTableKey(subject, year, column.key)) || "";
      }
    }
    return records;
  }

  const { data, error } = await supabase.from("study_records").select("*").eq("subject", subject);
  if (error) throw error;

  for (const row of data || []) {
    records[row.year] = { ...records[row.year], ...row };
  }
  return records;
}

export async function saveRecordField(subject, year, field, value) {
  if (!isSupabaseConfigured) {
    if (field === "memo") {
      localStorage.setItem(localMemoKey(subject, year), value);
    } else {
      localStorage.setItem(localTableKey(subject, year, field), value);
    }
    return;
  }

  const payload = {
    subject,
    year,
    [field]: value,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("study_records").upsert(payload, { onConflict: "subject,year" });
  if (error) throw error;
}

export function getStorageModeLabel() {
  return isSupabaseConfigured ? "Supabase保存" : "ローカル保存";
}
