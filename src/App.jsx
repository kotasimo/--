import React, { useEffect, useMemo, useRef, useState } from "react";
import { CustomProblemTable } from "./components/CustomProblemTable.jsx";
import { CustomProblemView } from "./components/CustomProblemView.jsx";
import { OverviewTable } from "./components/OverviewTable.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { StudyView } from "./components/StudyView.jsx";
import {
  createCustomProblem,
  deleteCustomProblem,
  listCustomProblems,
  makeCustomProblemDraft,
  saveCustomProblemField,
  saveCustomProblemFields,
} from "./services/customProblemRepository.js";
import { deleteAssetsForOwner } from "./services/assetRepository.js";
import { deleteConsultationLogsForOwner } from "./services/consultationRepository.js";
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
  const [customMode, setCustomMode] = useState("problem");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [recordsBySubject, setRecordsBySubject] = useState({});
  const [customBySubject, setCustomBySubject] = useState({});
  const [unsavedCustomIds, setUnsavedCustomIds] = useState(() => new Set());
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
  const selectedCustomProblem =
    Object.values(customBySubject)
      .flat()
      .find((problem) => problem.id === selectedCustomId) ||
    customProblems[0];

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

  function updateMemoDraft(value) {
    setMemoDraft(value);
    updateRecord(currentSubject, currentYear, "memo", value);
    setSaveState("未保存");
  }

  async function saveMemoNow(value) {
    window.clearTimeout(memoSaveTimer.current);
    setMemoDraft(value);
    updateRecord(currentSubject, currentYear, "memo", value);
    setSaveState("保存中");
    try {
      await saveRecordField(currentSubject, currentYear, "memo", value);
      setSaveState("保存済み");
    } catch (error) {
      console.error(error);
      setSaveState("保存失敗");
    }
  }

  function updateCustomProblem(id, field, value) {
    setCustomBySubject((current) => {
      const updatedAt = new Date().toISOString();
      return Object.fromEntries(
        Object.entries(current).map(([subject, items]) => [
          subject,
          items.map((problem) =>
            problem.id === id ? { ...problem, [field]: value, updated_at: updatedAt } : problem,
          ),
        ]),
      );
    });
  }

  function moveCustomProblemSubject(id, subject) {
    setCustomBySubject((current) => {
      const updatedAt = new Date().toISOString();
      let targetProblem = null;
      const next = Object.fromEntries(
        Object.entries(current).map(([key, items]) => [
          key,
          items.filter((problem) => {
            if (problem.id !== id) return true;
            targetProblem = { ...problem, subject, updated_at: updatedAt };
            return false;
          }),
        ]),
      );

      if (!targetProblem) return current;
      next[subject] = [targetProblem, ...(next[subject] || [])];
      return next;
    });
  }

  function saveCustomField(id, field, value) {
    if (field === "subject") {
      moveCustomProblemSubject(id, value);
      setCurrentSubject(value);
      setSaveState("保存中");
      window.clearTimeout(customSaveTimer.current);
      saveCustomProblemField(id, field, value)
        .then(() => {
          setCurrentSubject(value);
          setSaveState("保存済み");
        })
        .catch((error) => {
          console.error(error);
          setSaveState("保存失敗");
        });
      return;
    }

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
    setUnsavedCustomIds((current) => new Set(current).add(draft.id));
    setSelectedCustomId(draft.id);
    setCustomMode("edit");
    setCurrentView("custom-detail");
    setAppMode("custom");
    setSaveState("未保存");
  }

  async function saveCustomProblem(problem) {
    const wasUnsaved = unsavedCustomIds.has(problem.id);
    const payload = {
      subject: problem.subject,
      title: problem.title?.trim() || "新しい問題",
      short_memo: problem.short_memo || "",
      memo: problem.memo || "",
    };

    updateCustomProblem(problem.id, "title", payload.title);
    if (problem.subject !== currentSubject) moveCustomProblemSubject(problem.id, problem.subject);
    setSaveState("保存中");

    try {
      if (wasUnsaved) {
        const created = await createCustomProblem({ ...problem, ...payload });
        setCustomBySubject((current) => {
          const next = Object.fromEntries(
            Object.entries(current).map(([subject, items]) => [
              subject,
              items.filter((item) => item.id !== problem.id),
            ]),
          );
          next[created.subject] = [created, ...(next[created.subject] || [])];
          return next;
        });
        setUnsavedCustomIds((current) => {
          const next = new Set(current);
          next.delete(problem.id);
          return next;
        });
        setSelectedCustomId(created.id);
        setCurrentSubject(created.subject);
      } else {
        await saveCustomProblemFields(problem.id, payload);
        setCustomBySubject((current) => {
          const next = Object.fromEntries(
            Object.entries(current).map(([subject, items]) => [
              subject,
              items.filter((item) => item.id !== problem.id),
            ]),
          );
          next[payload.subject] = [{ ...problem, ...payload, updated_at: new Date().toISOString() }, ...(next[payload.subject] || [])];
          return next;
        });
        setCurrentSubject(payload.subject);
      }
      setCustomMode("problem");
      setSaveState("保存済み");
    } catch (error) {
      console.error(error);
      setSaveState("保存失敗");
    }
  }

  async function removeCustomProblem(problem) {
    if (!problem) return;
    const ok = window.confirm(`「${problem.title || "新しい問題"}」を削除しますか？`);
    if (!ok) return;

    setSaveState("削除中");
    setCustomBySubject((current) =>
      Object.fromEntries(
        Object.entries(current).map(([subject, items]) => [subject, items.filter((item) => item.id !== problem.id)]),
      ),
    );
    setUnsavedCustomIds((current) => {
      const next = new Set(current);
      next.delete(problem.id);
      return next;
    });

    try {
      await deleteAssetsForOwner("custom_problem", problem.id);
      await deleteConsultationLogsForOwner("custom_problem", problem.id);
      if (!unsavedCustomIds.has(problem.id)) {
        await deleteCustomProblem(problem.id);
      }
      setSelectedCustomId("");
      setCurrentView("table");
      setSaveState("保存済み");
    } catch (error) {
      console.error(error);
      setSaveState("削除失敗");
    }
  }

  function openStudy(year, mode) {
    setCurrentYear(year);
    setStudyMode(mode);
    setCurrentView("study");
    setAppMode("past");
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  }

  function openCustomProblem(id, mode = "problem") {
    setSelectedCustomId(id);
    setCustomMode(mode);
    setCurrentView("custom-detail");
    setAppMode("custom");
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
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
  const isDetailView = currentView === "study" || currentView === "custom-detail";

  return (
    <main className={`app ${isSidebarCollapsed ? "sidebar-collapsed" : ""} ${isDetailView ? "mobile-detail-mode" : "mobile-home-mode"}`}>
      {isSidebarCollapsed ? (
        <button className="sidebar-expand-button" type="button" onClick={() => setIsSidebarCollapsed(false)}>
          メニュー
        </button>
      ) : (
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
          onCollapse={() => setIsSidebarCollapsed(true)}
        />
      )}
      <section className="workspace">
        {isDetailView && (
          <button className="mobile-home-button" type="button" onClick={() => {
            setCurrentView("table");
            window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
          }}>
            ホーム
          </button>
        )}
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
            onMemoChange={updateMemoDraft}
            onMemoSave={saveMemoNow}
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
            mode={customMode}
            saveState={customLoadState || saveState}
            isUnsaved={unsavedCustomIds.has(selectedCustomProblem.id)}
            onFieldChange={(field, value) => saveCustomField(selectedCustomProblem.id, field, value)}
            onSave={saveCustomProblem}
            onDelete={removeCustomProblem}
            onModeChange={setCustomMode}
          />
        )}
      </section>
    </main>
  );
}
