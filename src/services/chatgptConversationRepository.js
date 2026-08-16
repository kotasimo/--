import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const LOCAL_KEY = "nagoya-exam-chatgpt-conversations";

function readLocalItems() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalItems(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

export async function getChatgptConversation(ownerType, ownerId) {
  if (!isSupabaseConfigured) {
    return (
      readLocalItems().find((item) => item.owner_type === ownerType && item.owner_id === ownerId) ||
      null
    );
  }

  const { data, error } = await supabase
    .from("chatgpt_conversations")
    .select("*")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listChatgptConversations(ownerType, ownerIds) {
  if (ownerIds.length === 0) return [];

  if (!isSupabaseConfigured) {
    const ownerIdSet = new Set(ownerIds);
    return readLocalItems().filter(
      (item) => item.owner_type === ownerType && ownerIdSet.has(item.owner_id),
    );
  }

  const { data, error } = await supabase
    .from("chatgpt_conversations")
    .select("*")
    .eq("owner_type", ownerType)
    .in("owner_id", ownerIds);
  if (error) throw error;
  return data || [];
}

export async function saveChatgptConversation({ ownerType, ownerId, subject, title, chatgptUrl }) {
  const item = {
    owner_type: ownerType,
    owner_id: ownerId,
    subject,
    title: title || "",
    chatgpt_url: chatgptUrl,
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    const items = readLocalItems().filter(
      (current) => current.owner_type !== ownerType || current.owner_id !== ownerId,
    );
    writeLocalItems([...items, item]);
    return item;
  }

  const { data, error } = await supabase
    .from("chatgpt_conversations")
    .upsert(item, { onConflict: "owner_type,owner_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChatgptConversation(ownerType, ownerId) {
  if (!isSupabaseConfigured) {
    writeLocalItems(
      readLocalItems().filter((item) => item.owner_type !== ownerType || item.owner_id !== ownerId),
    );
    return;
  }

  const { error } = await supabase
    .from("chatgpt_conversations")
    .delete()
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId);
  if (error) throw error;
}
