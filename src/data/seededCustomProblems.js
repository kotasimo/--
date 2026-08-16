const createdAt = "2026-08-16T00:00:00.000Z";

const seedDefinitions = [
  ["mock-r8-t-vibration", "vibration", "模試① 振動", true],
  ["mock-r8-t-thermo", "thermo", "模試① 熱力", false],
  ["mock-r8-t-material", "material", "模試① 材力", true],
  ["mock-r8-t-fluid", "fluid", "模試① 流体", true],
  ["mock-r8-t-calculus", "calculus", "模試① 微積", true],
  ["mock-r8-t-linear", "linear", "模試① 線形", true],
  ["mock-r8-t-ode", "ode", "模試① 常微分", true],
  ["mock-r8-t-vector", "vector", "模試① ベクトル解析", true],
];

export const seededCustomProblems = seedDefinitions.map(([id, subject, title]) => ({
  id,
  subject,
  title,
  topic: "",
  source: "野老山",
  status: "",
  importance: "",
  short_memo: "",
  memo: "",
  readonly: true,
  created_at: createdAt,
  updated_at: createdAt,
}));

export const seededAssets = seedDefinitions.flatMap(([id, subject, , hasAnswer]) => {
  const base = `/mock/r8-t/${subject}`;
  const assets = [
    {
      id: `${id}-problem`,
      owner_type: "custom_problem",
      owner_id: id,
      subject,
      asset_type: "問題",
      image_url: `${base}/problem.jpg`,
      file_path: "",
      created_at: createdAt,
      readonly: true,
    },
  ];

  if (hasAnswer) {
    assets.push({
      id: `${id}-answer`,
      owner_type: "custom_problem",
      owner_id: id,
      subject,
      asset_type: "解答",
      image_url: `${base}/answer.jpg`,
      file_path: "",
      created_at: createdAt,
      readonly: true,
    });
  }

  return assets;
});
