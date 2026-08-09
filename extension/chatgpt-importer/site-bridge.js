const subjectFolders = {
  vibration: "vibration",
  thermo: "thermo",
  material: "material",
  fluid: "fluid",
  calculus: "basic/calculus",
  linear: "basic/linear",
  ode: "basic/ode",
  vector: "basic/vector",
};

function inferImageUrl(target) {
  if (target.imageUrl) return target.imageUrl;
  if (target.ownerType !== "past_exam" || !target.ownerId?.includes(":")) return "";
  const [subject, year] = target.ownerId.split(":");
  const folder = subjectFolders[subject];
  if (!folder || !year) return "";
  return `${location.origin}/problems/${folder}/${year}_${subject}.jpg`;
}

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
      imageUrl: inferImageUrl(target),
      siteOrigin: location.origin,
      createdAt: Date.now(),
    },
  });
});
