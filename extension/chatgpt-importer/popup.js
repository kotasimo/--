const elements = {
  status: document.querySelector("#status"),
  supabaseUrl: document.querySelector("#supabaseUrl"),
  supabaseKey: document.querySelector("#supabaseKey"),
  subject: document.querySelector("#subject"),
  year: document.querySelector("#year"),
  title: document.querySelector("#title"),
  saveUrlButton: document.querySelector("#saveUrlButton"),
  clearTargetButton: document.querySelector("#clearTargetButton"),
};

const subjectLabels = {
  thermo: "熱力",
  vibration: "振動",
  material: "材力",
  fluid: "流体",
  calculus: "微積",
  linear: "線形",
  ode: "常微分",
  vector: "ベクトル解析",
};

function setStatus(text) {
  elements.status.textContent = text;
}

function updateTitle() {
  const label = subjectLabels[elements.subject.value] || elements.subject.value;
  elements.title.value = `${elements.year.value} ${label}`.trim();
}

async function loadSettings() {
  const settings = await chrome.storage.local.get([
    "supabaseUrl",
    "supabaseKey",
    "subject",
    "year",
    "title",
    "pendingChatgptTarget",
  ]);
  elements.supabaseUrl.value = settings.supabaseUrl || "";
  elements.supabaseKey.value = settings.supabaseKey || "";
  const pending = settings.pendingChatgptTarget;
  if (pending?.ownerType === "past_exam" && pending.ownerId?.includes(":")) {
    const [pendingSubject, pendingYear] = pending.ownerId.split(":");
    elements.subject.value = pendingSubject;
    elements.year.value = pendingYear;
    elements.title.value = pending.title || `${pendingYear} ${subjectLabels[pendingSubject] || pendingSubject}`;
    setStatus(`${elements.title.value} に保存`);
    return;
  }
  elements.subject.value = settings.subject || "thermo";
  elements.year.value = settings.year || "2024";
  elements.title.value = settings.title || `${elements.year.value} ${subjectLabels[elements.subject.value]}`;
}

async function saveSettings() {
  await chrome.storage.local.set({
    supabaseUrl: elements.supabaseUrl.value.trim(),
    supabaseKey: elements.supabaseKey.value.trim(),
    subject: elements.subject.value,
    year: elements.year.value.trim(),
    title: elements.title.value.trim(),
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("アクティブなタブが見つかりません。");
  return tab;
}

async function saveCurrentChatgptUrl() {
  await saveSettings();
  const tab = await getActiveTab();
  const chatgptUrl = tab.url || "";
  const supabaseUrl = elements.supabaseUrl.value.trim().replace(/\/$/, "");
  const supabaseKey = elements.supabaseKey.value.trim();
  const subject = elements.subject.value;
  const year = elements.year.value.trim();
  const title = elements.title.value.trim() || `${year} ${subjectLabels[subject]}`;

  if (!chatgptUrl.startsWith("https://chatgpt.com/") && !chatgptUrl.startsWith("https://chat.openai.com/")) {
    throw new Error("ChatGPTのチャット画面で押してください。");
  }
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase URL と key を入れてください。");
  if (!year) throw new Error("年度を入れてください。");

  const existingResponse = await fetch(
    `${supabaseUrl}/rest/v1/chatgpt_conversations?chatgpt_url=eq.${encodeURIComponent(chatgptUrl)}&select=owner_type,owner_id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  );
  if (!existingResponse.ok) throw new Error(await existingResponse.text());

  const ownerId = `${subject}:${year}`;
  const existingItems = await existingResponse.json();
  const linkedElsewhere = existingItems.some(
    (item) => item.owner_type !== "past_exam" || item.owner_id !== ownerId,
  );
  if (linkedElsewhere) {
    throw new Error("このURLは別の問題に保存済みです。");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/chatgpt_conversations?on_conflict=owner_type,owner_id`,
    {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json; charset=utf-8",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      owner_type: "past_exam",
      owner_id: ownerId,
      subject,
      title,
      chatgpt_url: chatgptUrl,
      updated_at: new Date().toISOString(),
    }),
    },
  );

  if (!response.ok) throw new Error(await response.text());
  await chrome.storage.local.remove("pendingChatgptTarget");
}

async function run(action) {
  try {
    setStatus("処理中");
    if (action === "url") {
      await saveCurrentChatgptUrl();
      setStatus("URL保存完了");
      return;
    }
  } catch (error) {
    console.error(error);
    setStatus(error.message || "失敗");
  }
}

elements.saveUrlButton.addEventListener("click", () => run("url"));
elements.clearTargetButton.addEventListener("click", async () => {
  await chrome.storage.local.remove("pendingChatgptTarget");
  setStatus("対象をリセット");
});
elements.subject.addEventListener("change", updateTitle);
elements.year.addEventListener("input", updateTitle);
document.querySelectorAll("input, select").forEach((input) => {
  input.addEventListener("change", saveSettings);
});

loadSettings().catch((error) => {
  console.error(error);
  setStatus("設定読込失敗");
});
