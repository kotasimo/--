const years = [2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006];

const subjects = {
  vibration: { label: "振動", path: "vibration" },
  thermo: { label: "熱力", path: "thermo" },
  material: { label: "材力", path: "material" },
  fluid: { label: "流体", path: "fluid" },
};

const tableColumns = [
  { key: "status", label: "状態", type: "select", options: ["未着手", "途中", "完了", "要復習", "解き直し済"] },
  { key: "difficulty", label: "難易度", type: "select", options: ["", "1", "2", "3", "4", "5"] },
  { key: "score", label: "正答率", type: "text" },
  { key: "formula", label: "必要な公式", type: "text" },
];

let currentSubject = "vibration";
let currentYear = 2024;
let currentView = "table";
let currentStudyMode = "problem";
let saveTimer = null;

const yearList = document.getElementById("yearList");
const homeView = document.getElementById("homeView");
const studyView = document.getElementById("studyView");
const overviewHead = document.getElementById("overviewHead");
const overviewBody = document.getElementById("overviewBody");
const homeSummary = document.getElementById("homeSummary");
const tableTitle = document.getElementById("tableTitle");
const subjectLabel = document.getElementById("subjectLabel");
const yearTitle = document.getElementById("yearTitle");
const memoInput = document.getElementById("memoInput");
const problemImage = document.getElementById("problemImage");
const openImage = document.getElementById("openImage");
const saveStatus = document.getElementById("saveStatus");
const solutionContent = document.getElementById("solutionContent");
const showProblemButton = document.getElementById("showProblemButton");
const showAnswerButton = document.getElementById("showAnswerButton");
const imageZoom = document.getElementById("imageZoom");
const imageZoomValue = document.getElementById("imageZoomValue");
const problemPanel = document.querySelector(".problem-panel");
const solutionPanel = document.querySelector(".solution-panel");

function memoKey(subject, year) {
  return `nagoya-exam-note:${subject}:${year}`;
}

function tableKey(subject, year, field) {
  return `nagoya-exam-table:${subject}:${year}:${field}`;
}

function imagePath(subject, year) {
  const subjectPath = subjects[subject].path;
  return `./problems/${subjectPath}/${year}_${subjectPath}.jpg`;
}

function zoomKey() {
  return "nagoya-exam-image-zoom";
}

function applyImageZoom(value) {
  const zoom = Number(value) || 100;
  document.documentElement.style.setProperty("--image-width", `${Math.round(980 * zoom / 100)}px`);
  imageZoom.value = zoom;
  imageZoomValue.textContent = `${zoom}%`;
  localStorage.setItem(zoomKey(), String(zoom));
}

function openStudy(year, mode = "problem") {
  currentView = "problem";
  currentYear = year;
  currentStudyMode = mode;
  updateView();
}

function tableValue(subject, year, field) {
  if (field === "status") return localStorage.getItem(tableKey(subject, year, field)) || "未着手";
  return localStorage.getItem(tableKey(subject, year, field)) || "";
}

function hasProblemMemo(subject, year) {
  return (localStorage.getItem(memoKey(subject, year)) || "").trim().length > 0;
}

function hasTableEntry(subject, year) {
  return tableColumns.some((column) => {
    const value = tableValue(subject, year, column.key).trim();
    return column.key === "status" ? value !== "未着手" : value.length > 0;
  });
}

function setActiveNavigation() {
  document.querySelectorAll(".subject-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.subject === currentSubject);
  });
}

function renderYears() {
  yearList.innerHTML = "";
  for (const year of years) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "year-button";
    if (currentView === "problem" && year === currentYear) button.classList.add("active");
    if (hasProblemMemo(currentSubject, year)) button.classList.add("has-note");
    button.textContent = `${year}`;
    button.addEventListener("click", () => {
      openStudy(year, "problem");
    });
    yearList.appendChild(button);
  }
}

function createCellInput(year, column) {
  const value = tableValue(currentSubject, year, column.key);
  const input = column.type === "select" ? document.createElement("select") : document.createElement("input");
  input.className = "table-input";
  input.dataset.year = year;
  input.dataset.field = column.key;

  if (column.type === "select") {
    for (const optionValue of column.options) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue || "-";
      input.appendChild(option);
    }
    input.value = value;
  } else {
    input.type = "text";
    input.value = value;
  }

  input.addEventListener("input", () => {
    localStorage.setItem(tableKey(currentSubject, year, column.key), input.value);
    updateSummaryOnly();
  });

  input.addEventListener("change", () => {
    localStorage.setItem(tableKey(currentSubject, year, column.key), input.value);
    updateSummaryOnly();
  });

  return input;
}

function renderTable() {
  const subject = subjects[currentSubject];
  let filledCount = 0;
  tableTitle.textContent = `${subject.label} 過去問記録`;
  overviewHead.innerHTML = "";
  overviewBody.innerHTML = "";

  const headRow = document.createElement("tr");
  const headers = ["年度", "問題", "解答", ...tableColumns.map((column) => column.label), "問題メモ"];
  for (const header of headers) {
    const th = document.createElement("th");
    th.textContent = header;
    headRow.appendChild(th);
  }
  overviewHead.appendChild(headRow);

  for (const year of years) {
    if (hasTableEntry(currentSubject, year)) filledCount += 1;
    const tr = document.createElement("tr");

    const yearCell = document.createElement("th");
    yearCell.scope = "row";
    yearCell.textContent = year;
    tr.appendChild(yearCell);

    const problemCell = document.createElement("td");
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "open-problem-button";
    openButton.textContent = "開く";
    openButton.addEventListener("click", () => openStudy(year, "problem"));
    problemCell.appendChild(openButton);
    tr.appendChild(problemCell);

    const answerCell = document.createElement("td");
    const answerButton = document.createElement("button");
    answerButton.type = "button";
    answerButton.className = "open-problem-button";
    answerButton.textContent = window.answerImages?.[currentSubject]?.[year] ? "開く" : "-";
    answerButton.disabled = !window.answerImages?.[currentSubject]?.[year];
    answerButton.addEventListener("click", () => openStudy(year, "answer"));
    answerCell.appendChild(answerButton);
    tr.appendChild(answerCell);

    for (const column of tableColumns) {
      const td = document.createElement("td");
      td.appendChild(createCellInput(year, column));
      tr.appendChild(td);
    }

    const memoCell = document.createElement("td");
    memoCell.className = hasProblemMemo(currentSubject, year) ? "memo-state has-note" : "memo-state";
    memoCell.textContent = hasProblemMemo(currentSubject, year) ? "あり" : "なし";
    tr.appendChild(memoCell);

    overviewBody.appendChild(tr);
  }
  homeSummary.textContent = `${filledCount} / ${years.length}`;
}

function updateSummaryOnly() {
  const filledCount = years.filter((year) => hasTableEntry(currentSubject, year)).length;
  homeSummary.textContent = `${filledCount} / ${years.length}`;
}

function renderSolution() {
  const answer = window.answerImages?.[currentSubject]?.[currentYear];
  const solution = window.solutionNotes?.[currentSubject]?.[currentYear];

  if (answer) {
    const fallback = solution
      ? `
        <details class="solution-outline">
          <summary>概略メモも見る</summary>
          <h4>${solution.title}</h4>
          <ol>${solution.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
          <div class="formula-list">${solution.formulas.map((formula) => `<code>${formula}</code>`).join("")}</div>
          <p class="solution-note">${solution.note}</p>
        </details>
      `
      : "";
    solutionContent.innerHTML = `
      <div class="answer-toolbar">
        <span>ノートPDF p.${answer.pages}</span>
        <a href="${answer.path}" target="_blank" rel="noreferrer">画像だけ開く</a>
      </div>
      <img class="answer-image" src="${answer.path}" alt="${currentYear}年度 ${subjects[currentSubject].label} 手書き解答" />
      ${fallback}
    `;
    return;
  }

  if (!solution) {
    solutionContent.innerHTML = "<p>この年度の解答メモはまだありません。</p>";
    return;
  }

  const steps = solution.steps.map((step) => `<li>${step}</li>`).join("");
  const formulas = solution.formulas.map((formula) => `<code>${formula}</code>`).join("");
  solutionContent.innerHTML = `
    <h4>${solution.title}</h4>
    <ol>${steps}</ol>
    <div class="formula-list">${formulas}</div>
    <p class="solution-note">${solution.note}</p>
  `;
}

function updateView() {
  setActiveNavigation();
  homeView.classList.toggle("hidden", currentView !== "table");
  studyView.classList.toggle("hidden", currentView !== "problem");
  renderYears();

  if (currentView === "table") {
    renderTable();
    return;
  }

  const subject = subjects[currentSubject];
  const src = imagePath(currentSubject, currentYear);
  subjectLabel.textContent = subject.label;
  yearTitle.textContent = `${currentYear}年度`;
  memoInput.value = localStorage.getItem(memoKey(currentSubject, currentYear)) || "";
  problemImage.src = src;
  problemImage.alt = `${currentYear}年度 ${subject.label} 問題画像`;
  openImage.href = src;
  renderSolution();
  renderStudyMode();
  saveStatus.textContent = "保存済み";
  saveStatus.classList.remove("saving");
}

function renderStudyMode() {
  const isProblem = currentStudyMode === "problem";
  problemPanel.classList.toggle("hidden", !isProblem);
  solutionPanel.classList.toggle("hidden", isProblem);
  showProblemButton.classList.toggle("active", isProblem);
  showAnswerButton.classList.toggle("active", !isProblem);
}

function saveMemoSoon() {
  saveStatus.textContent = "保存中";
  saveStatus.classList.add("saving");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(memoKey(currentSubject, currentYear), memoInput.value);
    saveStatus.textContent = "保存済み";
    saveStatus.classList.remove("saving");
    renderYears();
  }, 250);
}

document.querySelectorAll(".subject-tab").forEach((button) => {
  button.addEventListener("click", () => {
    currentView = "table";
    currentSubject = button.dataset.subject;
    updateView();
  });
});

memoInput.addEventListener("input", saveMemoSoon);
showProblemButton.addEventListener("click", () => {
  currentStudyMode = "problem";
  renderStudyMode();
});
showAnswerButton.addEventListener("click", () => {
  currentStudyMode = "answer";
  renderStudyMode();
});
imageZoom.addEventListener("input", () => {
  applyImageZoom(imageZoom.value);
});

applyImageZoom(localStorage.getItem(zoomKey()) || "100");
updateView();
