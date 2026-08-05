export const years = [
  2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011,
  2010, 2009, 2008, 2007, 2006,
];

export const subjects = {
  vibration: { label: "振動", path: "vibration" },
  thermo: { label: "熱力", path: "thermo" },
  material: { label: "材力", path: "material" },
  fluid: { label: "流体", path: "fluid" },
};

export const tableColumns = [
  { key: "score", label: "正答率", type: "text" },
  { key: "formula", label: "必要な公式", type: "text" },
];

export function problemImagePath(subjectKey, year) {
  const subject = subjects[subjectKey];
  return `/problems/${subject.path}/${year}_${subject.path}.jpg`;
}
