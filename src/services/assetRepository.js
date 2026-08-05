import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const BUCKET = "study-assets";
const LOCAL_KEY = "nagoya-exam-problem-assets";

function readLocalAssets() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalAssets(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

export async function listAssets(ownerType, ownerId) {
  if (!isSupabaseConfigured) {
    return readLocalAssets()
      .filter((item) => item.owner_type === ownerType && item.owner_id === ownerId)
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }

  const { data, error } = await supabase
    .from("problem_assets")
    .select("*")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function uploadAsset({ ownerType, ownerId, subject, assetType, file }) {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const item = {
      id: crypto.randomUUID(),
      owner_type: ownerType,
      owner_id: ownerId,
      subject,
      asset_type: assetType,
      image_url: URL.createObjectURL(file),
      file_path: "",
      created_at: now,
    };
    const items = readLocalAssets();
    writeLocalAssets([item, ...items]);
    return item;
  }

  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `${ownerType}/${ownerId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  const { data, error } = await supabase
    .from("problem_assets")
    .insert({
      owner_type: ownerType,
      owner_id: ownerId,
      subject,
      asset_type: assetType,
      image_url: publicUrlData.publicUrl,
      file_path: filePath,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
