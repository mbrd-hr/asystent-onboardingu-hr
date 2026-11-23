import { useMemo, useState } from 'react';
import { AlertCircle, Printer, RotateCcw } from 'lucide-react';
import { BriefForm } from './components/BriefForm';
import { ChecklistView } from './components/ChecklistView';
import { MessagesView } from './components/MessagesView';
import { PlanView } from './components/PlanView';
import { PrintPackage } from './components/PrintPackage';
import {
  PRESET_BRIEFS,
  createDefaultAnnaPackage,
  createInitialBrief,
} from './data/presets';
import { calculateOnboardingTimeline } from './lib/dates';
import type { OnboardingBrief, OnboardingPackage } from './types/onboarding';

type ActiveTab = 'hr' | 'it' | 'plan' | 'messages';

function areBriefsEqual(a: OnboardingBrief, b: OnboardingBrief): boolean {
  return (
    a.firstName.trim() === b.firstName.trim() &&
    a.role.trim() === b.role.trim() &&
    a.department.trim() === b.department.trim() &&
    a.managerName.trim() === b.managerName.trim() &&
    a.contractType === b.contractType &&
    a.workMode === b.workMode &&
    a.startDate === b.startDate &&
    a.conditions.monitorOver4h === b.conditions.monitorOver4h &&
    a.conditions.companyCar === b.conditions.companyCar &&
    a.conditions.gdprAccess === b.conditions.gdprAccess
  );
}

function findMatchingPresetId(brief: OnboardingBrief): string | null {
  const match = PRESET_BRIEFS.find(
    (p) =>
      p.brief.firstName === brief.firstName &&
      p.brief.role === brief.role &&
      p.brief.department === brief.department &&
      p.brief.managerName === brief.managerName &&
      p.brief.contractType === brief.contractType &&
      p.brief.workMode === brief.workMode &&
      p.brief.conditions.monitorOver4h === brief.conditions.monitorOver4h &&
      p.brief.conditions.companyCar === brief.conditions.companyCar &&
      p.brief.conditions.gdprAccess === brief.conditions.gdprAccess,
  );
  return match ? match.id : null;
}

export default function App() {
  const [brief, setBrief] = useState<OnboardingBrief>(() => createInitialBrief());
  const [pkg, setPkg] = useState<OnboardingPackage>(() =>
    createDefaultAnnaPackage(createInitialBrief().startDate),
  );
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('hr');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activePresetId = useMemo(() => findMatchingPresetId(brief), [brief]);
  const isDirty = useMemo(() => !areBriefsEqual(brief, pkg.brief), [brief, pkg.brief]);

  const progress = useMemo(() => {
    const hrTasks = pkg.hrStages.flatMap((s) => s.tasks);
    const itTasks = pkg.itStages.flatMap((s) => s.tasks);
    const allTasks = [...hrTasks, ...itTasks];

    const hrDone = hrTasks.filter((t) => Boolean(completedIds[t.id])).length;
    const itDone = itTasks.filter((t) => Boolean(completedIds[t.id])).length;
    const totalDone = hrDone + itDone;
    const total = allTasks.length;
    const percent = total > 0 ? Math.round((totalDone / total) * 100) : 0;

    return {
      hrDone,
      hrTotal: hrTasks.length,
      itDone,
      itTotal: itTasks.length,
      totalDone,
      total,
      percent,
    };
  }, [pkg, completedIds]);

  const activeTimeline = useMemo(
    () => calculateOnboardingTimeline(pkg.brief.startDate),
    [pkg.brief.startDate],
  );

  const activeConditionsList = useMemo(() => {
    const list: string[] = [];
    if (pkg.brief.conditions.monitorOver4h) list.push('Monitor >4h');
    if (pkg.brief.conditions.companyCar) list.push('Samochód służbowy');
    if (pkg.brief.conditions.gdprAccess) list.push('Dostęp RODO');
    return list;
  }, [pkg.brief.conditions]);

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_BRIEFS.find((p) => p.id === presetId);
    if (!preset) return;
    setErrorMessage(null);
    setBrief((prev) => ({
      ...preset.brief,
      startDate: prev.startDate,
    }));
  };

  const handleToggleTask = (taskId: string) => {
    setCompletedIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleResetProgress = () => {
    setCompletedIds({});
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/onboarding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : 'Nie udało się wygenerować pakietu onboardingowego.',
        );
      }

      setPkg(data as OnboardingPackage);
      setCompletedIds({});
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Wystąpił błąd połączenia z serwerem. Spróbuj ponownie.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs: { id: ActiveTab; label: string; count?: string }[] = [
    { id: 'hr', label: 'Twardy HR i Kadry', count: `${progress.hrDone}/${progress.hrTotal}` },
    {
      id: 'it',
      label: 'IT, Sprzęt i Administracja',
      count: `${progress.itDone}/${progress.itTotal}`,
    },
    { id: 'plan', label: 'Plan 1. tygodnia i cele 30-60-90 dni' },
    { id: 'messages', label: 'Gotowe wiadomości', count: '2' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#111318]">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E2E6EC] print:hidden">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-8">
          <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-[#111318] whitespace-nowrap shrink-0">
            Asystent Onboardingu HR
          </span>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[38px] px-3.5 py-2 rounded-lg bg-white border border-[#D4DAE3] text-xs font-medium text-[#111318] hover:bg-[#F6F7F9] transition-colors duration-150 inline-flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
            >
              <Printer className="w-3.5 h-3.5 text-[#525B6B] shrink-0" aria-hidden="true" />
              <span>Drukuj / Zapisz jako PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 print:hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column — Form / Brief */}
          <div className="lg:col-span-4 lg:sticky lg:top-20">
            <BriefForm
              brief={brief}
              onChange={setBrief}
              onSubmit={handleGenerate}
              isGenerating={isGenerating}
              isDirty={isDirty}
              activePresetId={activePresetId}
              onSelectPreset={handleSelectPreset}
            />
          </div>

          {/* Right Column — Package & Interactive Checklist */}
          <section className="lg:col-span-8 bg-white border border-[#E2E6EC] rounded-xl overflow-hidden">
            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="px-6 py-3.5 bg-[#FEF2F2] border-b border-[#FECACA] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 text-xs text-[#991B1B]">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#DC2626]" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-xs font-medium text-[#991B1B] underline hover:text-[#7F1D1D] self-start sm:self-auto whitespace-nowrap shrink-0"
                >
                  Spróbuj ponownie
                </button>
              </div>
            )}

            {/* Package Header & Progress */}
            <div className="px-6 pt-6 pb-5 border-b border-[#E2E6EC]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111318]">
                  {pkg.brief.firstName} — {pkg.brief.role}
                </h1>
                <span className="text-xs text-[#647082] whitespace-nowrap">
                  {pkg.source === 'example' ? 'Przykład startowy' : 'Pakiet wygenerowany'}
                </span>
              </div>

              {/* Clean unboxed metadata row */}
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#525B6B]">
                <span>Dział: {pkg.brief.department}</span>
                <span aria-hidden="true">·</span>
                <span>Przełożony: {pkg.brief.managerName}</span>
                <span aria-hidden="true">·</span>
                <span>{pkg.brief.contractType}</span>
                <span aria-hidden="true">·</span>
                <span>{pkg.brief.workMode}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-[#111318]">
                  Start: {activeTimeline.startDateFormatted}
                </span>
              </div>

              {activeConditionsList.length > 0 && (
                <div className="mt-1 text-xs text-[#647082]">
                  Warunki: {activeConditionsList.join(' · ')}
                </div>
              )}

              <p className="mt-3 text-sm text-[#3C4453] leading-relaxed max-w-3xl">
                {pkg.summary}
              </p>

              {/* Live Progress Bar */}
              <div className="mt-5 pt-4 border-t border-[#ECEFF4]">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <span className="text-xs font-semibold text-[#111318] font-mono tabular-nums">
                      Ukończono {progress.totalDone} z {progress.total} zadań · {progress.percent}%
                    </span>
                    <span className="text-xs text-[#647082] font-mono tabular-nums">
                      HR: {progress.hrDone}/{progress.hrTotal} · IT: {progress.itDone}/{progress.itTotal}
                    </span>
                  </div>

                  {progress.totalDone > 0 && (
                    <button
                      type="button"
                      onClick={handleResetProgress}
                      className="text-xs text-[#525B6B] hover:text-[#111318] inline-flex items-center gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-[#1E3A8A] rounded"
                    >
                      <RotateCcw className="w-3 h-3" aria-hidden="true" />
                      <span>Resetuj postęp</span>
                    </button>
                  )}
                </div>

                <div
                  role="progressbar"
                  aria-valuenow={progress.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Postęp ukończenia checklisty onboardingowej"
                  className="h-2 w-full bg-[#ECEFF4] rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      progress.percent === 100 ? 'bg-[#0F6B54]' : 'bg-[#1E3A8A]'
                    }`}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 4 Switchable Tabs */}
            <nav
              aria-label="Sekcje pakietu onboardingowego"
              className="border-b border-[#E2E6EC] px-6 overflow-x-auto"
            >
              <div className="flex items-center gap-6 -mb-px" role="tablist">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      type="button"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-3.5 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-150 whitespace-nowrap shrink-0 flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1E3A8A] ${
                        isActive
                          ? 'border-[#1E3A8A] text-[#1E3A8A]'
                          : 'border-transparent text-[#525B6B] hover:text-[#111318] hover:border-[#CBD3DF]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count && (
                        <span
                          className={`text-[11px] font-mono tabular-nums ${
                            isActive ? 'text-[#1E3A8A]' : 'text-[#8C95A6]'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Tab Panel Content */}
            <div className="p-6" role="tabpanel">
              {isGenerating ? (
                <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Generowanie pakietu">
                  <div className="h-4 w-2/3 bg-[#ECEFF4] rounded" />
                  {[1, 2, 3].map((group) => (
                    <div key={group} className="space-y-3 pt-2">
                      <div className="flex justify-between pb-2 border-b border-[#ECEFF4]">
                        <div className="h-4 w-36 bg-[#E2E6EC] rounded" />
                        <div className="h-3.5 w-24 bg-[#ECEFF4] rounded" />
                      </div>
                      {[1, 2, 3].map((row) => (
                        <div key={row} className="flex items-start gap-3.5 py-2">
                          <div className="w-5 h-5 rounded-md bg-[#ECEFF4] shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 bg-[#ECEFF4] rounded" />
                            <div className="h-3 w-full bg-[#F3F5F8] rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {activeTab === 'hr' && (
                    <ChecklistView
                      stages={pkg.hrStages}
                      completedIds={completedIds}
                      onToggleTask={handleToggleTask}
                      sectionDescription={`Zadania kadrowo-płacowe dla formy zatrudnienia „${pkg.brief.contractType}” z datami granicznymi wyliczonymi od dnia startu ${activeTimeline.startDateFormatted}.`}
                    />
                  )}

                  {activeTab === 'it' && (
                    <ChecklistView
                      stages={pkg.itStages}
                      completedIds={completedIds}
                      onToggleTask={handleToggleTask}
                      sectionDescription={`Przygotowanie kont, dostępów, sprzętu i logistyki dla trybu pracy „${pkg.brief.workMode}”.`}
                    />
                  )}

                  {activeTab === 'plan' && (
                    <PlanView
                      weekOnePlan={pkg.weekOnePlan}
                      goals306090={pkg.goals306090}
                      role={pkg.brief.role}
                    />
                  )}

                  {activeTab === 'messages' && (
                    <MessagesView
                      welcomeEmail={pkg.messages.welcomeEmail}
                      managerBrief={pkg.messages.managerBrief}
                    />
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Dedicated A4 Print View */}
      <PrintPackage pkg={pkg} completedIds={completedIds} />
    </div>
  );
}
