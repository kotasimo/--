window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "NAGOYA_EXAM_CHATGPT_TARGET") return;

  const target = event.data.target || {};
  if (!target.ownerType || !target.ownerId || !target.subject) return;

  chrome.storage.local.set({
    pendingChatgptTarget: {
      ownerType: target.ownerType,
      ownerId: target.ownerId,
      subject: target.subject,
      title: target.title || "ChatGPT",
      createdAt: Date.now(),
    },
  });
});
