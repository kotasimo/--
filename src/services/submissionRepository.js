import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const BUCKET = "submissions";

export async function listSubmissionImages(subject, year) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from("submission_images")
    .select("*")
    .eq("subject", subject)
    .eq("year", year)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function uploadSubmissionImage(subject, year, file) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `${subject}/${year}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  const imageUrl = publicUrlData.publicUrl;

  const { data, error } = await supabase
    .from("submission_images")
    .insert({
      subject,
      year,
      image_url: imageUrl,
      file_path: filePath,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
