export const professionalYears = [
  2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011,
  2010, 2009, 2008, 2007, 2006,
];

export const basicYears = [
  2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011,
  2010, 2009, 2008, 2007, 2006, 2005, 2004,
];

export const years = professionalYears;

export const subjects = {
  vibration: { label: "振動", category: "professional", folder: "vibration", fileKey: "vibration" },
  thermo: { label: "熱力", category: "professional", folder: "thermo", fileKey: "thermo" },
  material: { label: "材力", category: "professional", folder: "material", fileKey: "material" },
  fluid: { label: "流体", category: "professional", folder: "fluid", fileKey: "fluid" },
  calculus: { label: "微積", category: "basic", folder: "basic/calculus", fileKey: "calculus" },
  linear: { label: "線形", category: "basic", folder: "basic/linear", fileKey: "linear" },
  ode: { label: "常微分", category: "basic", folder: "basic/ode", fileKey: "ode" },
  vector: { label: "ベクトル解析", category: "basic", folder: "basic/vector", fileKey: "vector" },
};

export const examCategories = {
  professional: {
    label: "専門",
    years: professionalYears,
    subjects: ["vibration", "thermo", "material", "fluid"],
  },
  basic: {
    label: "基礎",
    years: basicYears,
    subjects: ["calculus", "linear", "ode", "vector"],
  },
};

export const tableColumns = [
  { key: "score", label: "記録", type: "text" },
];

export function getYearsForSubject(subjectKey) {
  const category = subjects[subjectKey]?.category || "professional";
  return examCategories[category].years;
}

export function problemImagePath(subjectKey, year) {
  const subject = subjects[subjectKey];
  return `/problems/${subject.folder}/${year}_${subject.fileKey}.jpg`;
}
