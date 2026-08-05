import React, { useEffect, useMemo, useRef, useState } from "react";
import { CustomProblemTable } from "./components/CustomProblemTable.jsx";
import { CustomProblemView } from "./components/CustomProblemView.jsx";
import { OverviewTable } from "./components/OverviewTable.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { StudyView } from "./components/StudyView.jsx";
import {
  createCustomProblem,
  listCustomProblems,
  makeCustomProblemDraft,
  saveCustomProblemField,
} from "./services/customProblemRepository.js";
import { tableColumns, years } from "./data/examMeta.js";
import {
  getStorageModeLabel,
  getZoom,
  loadSubjectRecords,
  saveRecordField,
  saveZoom,
} from "./services/studyRepository.js";

function makeEmptySubjectRecords(subject) {
  return Object.fromEntries(
    years.map((year) => [
      year,
      {
        subject,
        year,
        status: "未着手",
        difficulty: "",
        score: "",
        formula: "",
        memo: "",
      },
    ]),
  );
}

export function App() {
  const [appMode, setAppMode] = useState("past");
  const [currentSubject, setCurrentSubject] = useState("vibration");
  const [currentYear, setCurrentYear] = useState(2024);
  const [currentView, setCurrentView] = useState("table");
  const [studyMode, setStudyMode] = useState("problem");
  const [recordsBySubject, setRecordsBySubject] = useState({});
  const [customBySubject, setCustomBySubject] = useState({});
  const [selectedCustomId, setSelectedCustomId] = useState("");
  const [memoDraft, setMemoDraft] = useState("");
  const [saveState, setSaveState] = useState("保存済み");
  const [loadState, setLoadState] = useState("");
  const [customLoadState, setCustomLoadState] = useState("");
  const [zoom, setZoom] = useState(getZoom());
  const memoSaveTimer = useRef(null);
  const customSaveTimer = useRef(null);

  const subjectRecords = recordsBySubject[currentSubject] || makeEmptySubjectRecords(currentSubject);
  const currentRecord = subjectRecords[currentYear] || makeEmptySubjectRecords(currentSubject)[currentYear];
  const customProblems = customBySubject[currentSubject] || [];
  const selectedCustomProblem = customProblems.find((problem) => problem.id === selectedCustomId) || customProblems[0];

  useEffect(() => {
    document.documentElement.style.setProperty("--image-width", `${Math.round((980 * zoom) / 100)}px`);
    saveZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    let cancelled = false;
    setLoadState("読み込み中");
    loadSubjectRecords(currentSubject)
      .then((records) => {
        if (cancelled) return;
        setRecordsBySubject((current) => ({ ...current, [currentSubject]: records }));
        setLoadState("");
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setLoadState("読み込み失敗");
      });
    return () => {
      cancelled = true;
    };
  }, [currentSubject]);

  useEffect(() => {
    let cancelled = false;
    setCustomLoadState("読み込み中");
    listCustomProblems(currentSubject)
      .then((items) => {
        if (cancelled) return;
        setCustomBySubject((current) => ({ ...current, [currentSubject]: items }));
        setCustomLoadState("");
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setCustomLoadState(error?.code === "PGRST205" ? "SQL更新が必要" : "読み込み失敗");
      });
    return () => {
      cancelled = true;
    };
  }, [currentSubject]);

  useEffect(() => {
    setMemoDraft(currentRecord.memo || "");
    setSaveState("保存済み");
    window.clearTimeout(memoSaveTimer.current);
  }, [currentSubject, currentYear, currentRecord.memo]);

  const helpers = useMemo(() => {
    const getRecord = (subject, year) =>
      recordsBySubject[subject]?.[year] || makeEmptySubjectRecords(subject)[year];

    const hasMemo = (subject, year) => getRecord(subject, year).memo.trim().length > 0;
    const hasTableEntry = (subject, year) => {
      const record = getRecord(subject, year);
      return tableColumns.some((column) => {
        const value = String(record[column.key] || "").trim();
        return value.length > 0;
      }) || record.memo.trim().length > 0;
    };

    return {
      hasMemo,
      hasTableEntry,
      getCell(subject, year, field) {
        return getRecord(subject, year)[field] || (field === "status" ? "未着手" : "");
      },
    };
  }, [recordsBySubject]);

  function updateRecord(subject, year, field, value) {
    setRecordsBySubject((current) => {
      const subjectData = current[subject] || makeEmptySubjectRecords(subject);
      return {
        ...current,
        [subject]: {
          ...subjectData,
          [year]: {
            ...subjectData[year],
            [field]: value,
          },
        },
      };
    });
  }

  async function saveField(subject, year, field, value) {
    updateRecord(subject, year, field, value);
    setSaveState("保存中");
    try {
      await saveRecordField(subject, year, field, value);
      setSaveState("保存済み");
    } catch (error) {
      console.error(error);
      setSaveState("保存失敗");
    }
  }

  function saveMemoDraft(value) {
    setMemoDraft(value);
    updateRecord(currentSubject, currentYear, "memo", value);
    setSaveState("保存中");
    window.clearTimeout(memoSaveTimer.current);
    memoSaveTimer.current = window.setTimeout(() => {
      saveRecordField(currentSubject, currentYear, "memo", value)
        .then(() => setSaveState("保存済み"))
        .catch((error) => {
          console.error(error);
          setSaveState("保存失敗");
        });
    }, 350);
  }

  function updateCustomProblem(id, field, value) {
    setCustomBySubject((current) => {
      const items = current[currentSubject] || [];
      return {
        ...current,
        [currentSubject]: items.map((problem) =>
          problem.id === id ? { ...problem, [field]: value, updated_at: new Date().toISOString() } : problem,
        ),
      };
    });
  }

  function saveCustomField(id, field, value) {
    updateCustomProblem(id, field, value);
    setSaveState("保存中");
    window.clearTimeout(customSaveTimer.current);
    customSaveTimer.current = window.setTimeout(() => {
      saveCustomProblemField(id, field, value)
        .then(() => setSaveState("保存済み"))
        .catch((error) => {
          console.error(error);
          setSaveState("保存失敗");
        });
    }, 300);
  }

  async function addCustomProblem() {
    const draft = makeCustomProblemDraft(currentSubject);
    setCustomBySubject((current) => ({
      ...current,
      [currentSubject]: [draft, ...(current[currentSubject] || [])],
    }));
    setSelectedCustomId(draft.id);
    setCurrentView("custom-detail");
    setAppMode("custom");
    setSaveState("保存中");

    try {
      const created = await createCustomProblem(draft);
      setCustomBySubject((current) => ({
        ...current,
        [currentSubject]: (current[currentSubject] || []).map((problem) =>
          problem.id === draft.id ? created : problem,
        ),
      }));
      setSelectedCustomId(created.id);
      setSaveState("保存済み");
    } catch (error) {
      console.error(error);
      setSaveState("保存失敗");
    }
  }

  function openStudy(year, mode) {
    setCurrentYear(year);
    setStudyMode(mode);
    setCurrentView("study");
    setAppMode("past");
  }

  function openCustomProblem(id) {
    setSelectedCustomId(id);
    setCurrentView("custom-detail");
    setAppMode("custom");
  }

  function changeSubject(subject) {
    setCurrentSubject(subject);
    setCurrentView("table");
  }

  function changeAppMode(mode) {
    setAppMode(mode);
    setCurrentView("table");
  }

  const saveLabel = appMode === "custom" ? customLoadState || getStorageModeLabel() : loadState || getStorageModeLabel();

  return (
    <main className="app">
      <Sidebar
        appMode={appMode}
        currentSubject={currentSubject}
        currentYear={currentYear}
        currentView={currentView}
        selectedCustomId={selectedCustomProblem?.id || ""}
        customProblems={customProblems}
        hasMemo={helpers.hasMemo}
        onAppModeChange={changeAppMode}
        onSubjectChange={changeSubject}
        onYearOpen={openStudy}
        onCustomOpen={openCustomProblem}
        onCustomCreate={addCustomProblem}
      />
      <section className="workspace">
        {appMode === "past" && currentView === "table" && (
          <OverviewTable
            currentSubject={currentSubject}
            getCell={helpers.getCell}
            hasMemo={helpers.hasMemo}
            hasTableEntry={helpers.hasTableEntry}
            saveLabel={saveLabel}
            onCellChange={saveField}
            onOpenStudy={openStudy}
          />
        )}
        {appMode === "past" && currentView === "study" && (
          <StudyView
            subjectKey={currentSubject}
            year={currentYear}
            mode={studyMode}
            memo={memoDraft}
            saveState={loadState || saveState}
            zoom={zoom}
            onMemoChange={saveMemoDraft}
            onModeChange={setStudyMode}
            onZoomChange={setZoom}
          />
        )}
        {appMode === "custom" && currentView === "table" && (
          <CustomProblemTable
            currentSubject={currentSubject}
            problems={customProblems}
            saveLabel={saveLabel}
            onCreate={addCustomProblem}
            onOpen={openCustomProblem}
            onCellChange={saveCustomField}
          />
        )}
        {appMode === "custom" && currentView === "custom-detail" && selectedCustomProblem && (
          <CustomProblemView
            problem={selectedCustomProblem}
            saveState={customLoadState || saveState}
            onFieldChange={(field, value) => saveCustomField(selectedCustomProblem.id, field, value)}
          />
        )}
      </section>
    </main>
  );
}
