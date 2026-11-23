import { useMemo, useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
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

const checklistStageSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      deadlineLabel: { type: Type.STRING },
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            owner: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            legalRef: { type: Type.STRING },
          },
          required: ['id', 'title', 'description', 'owner', 'dueDate'],
        },
      },
    },
    required: ['id', 'title', 'deadlineLabel', 'tasks'],
  },
};

const onboardingResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    hrStages: checklistStageSchema,
    itStages: checklistStageSchema,
    weekOnePlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayNumber: { type: Type.INTEGER },
          dateLabel: { type: Type.STRING },
          focus: { type: Type.STRING },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timeSlot: { type: Type.STRING },
                title: { type: Type.STRING },
                lead: { type: Type.STRING },
              },
              required: ['timeSlot', 'title', 'lead'],
            },
          },
        },
        required: ['dayNumber', 'dateLabel', 'focus', 'activities'],
      },
    },
    goals306090: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          period: { type: Type.STRING },
          targetDate: { type: Type.STRING },
          headline: { type: Type.STRING },
          milestones: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          successMetric: { type: Type.STRING },
        },
        required: ['period', 'targetDate', 'headline', 'milestones', 'successMetric'],
      },
    },
    messages: {
      type: Type.OBJECT,
      properties: {
        welcomeEmail: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            sendDateLabel: { type: Type.STRING },
            recipientLabel: { type: Type.STRING },
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ['title', 'sendDateLabel', 'recipientLabel', 'subject', 'body'],
        },
        managerBrief: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            sendDateLabel: { type: Type.STRING },
            recipientLabel: { type: Type.STRING },
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ['title', 'sendDateLabel', 'recipientLabel', 'subject', 'body'],
        },
      },
      required: ['welcomeEmail', 'managerBrief'],
    },
  },
  required: ['summary', 'hrStages', 'itStages', 'weekOnePlan', 'goals306090', 'messages'],
};

export default function App() {
  const [brief, setBrief] = useState<OnboardingBrief>(() => ({
    firstName: '',
    role: '',
    department: '',
    managerName: '',
    contractType: 'Umowa o pracę',
    workMode: 'Hybrydowy',
    startDate: createInitialBrief().startDate,
    conditions: {
      monitorOver4h: false,
      companyCar: false,
      gdprAccess: false,
    },
  }));
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
      const apiKey =
        import.meta.env.VITE_GEMINI_API_KEY ||
        (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

      if (!apiKey) {
        throw new Error(
          'Brak klucza API Google Gemini. Dodaj zmienną VITE_GEMINI_API_KEY w ustawieniach Vercel (Environment Variables) i wykonaj Redeploy.',
        );
      }

      const ai = new GoogleGenAI({ apiKey });
      const timeline = calculateOnboardingTimeline(brief.startDate);

      const conditionsText = [
        brief.conditions.monitorOver4h ? 'Praca przy monitorze ekranowym >4h dziennie' : null,
        brief.conditions.companyCar ? 'Samochód służbowy (wymagane badania psychotechniczne i umowa powierzenia mienia)' : null,
        brief.conditions.gdprAccess ? 'Dostęp do danych osobowych (wymagane upoważnienie RODO i oświadczenie o poufności)' : null,
      ]
        .filter(Boolean)
        .join(', ') || 'Brak dodatkowych warunków szczególnych';

      const prompt = `Jesteś doświadczonym polskim Ekspertem HR Operations, Kadr i Płac oraz Onboardingu (13+ lat praktyki w polskim prawie pracy).
Wygeneruj kompletny, praktyczny i zgodny z polskimi przepisami pakiet onboardingowy w języku polskim dla poniższego pracownika/współpracownika:

DANE WEJŚCIOWE:
- Imię: ${brief.firstName}
- Stanowisko: ${brief.role}
- Dział: ${brief.department}
- Przełożony (Hiring Manager): ${brief.managerName}
- Forma zatrudnienia: ${brief.contractType}
- Tryb pracy: ${brief.workMode}
- Data rozpoczęcia pracy: ${timeline.startDateFormatted} (${timeline.startDateFull})
- Warunki dodatkowe: ${conditionsText}

WYLICZONE DATY GRANICZNE (UŻYJ DOKŁADNIE TYCH DAT W POLACH dueDate, dateLabel, targetDate):
- 10 dni roboczych przed startem: ${timeline.preboarding10WorkDaysBefore}
- 5 dni roboczych przed startem: ${timeline.preboarding5WorkDaysBefore}
- 3 dni robocze przed startem: ${timeline.preboarding3WorkDaysBefore}
- 1 dzień roboczy przed startem: ${timeline.preboarding1WorkDayBefore}
- Dzień startu (1. dzień): ${timeline.startDateFormatted}
- 7 dni kalendarzowych po starcie (termin ZUS): ${timeline.plus7CalendarDays}
- 30 dni po starcie: ${timeline.plus30CalendarDays}
- 60 dni po starcie: ${timeline.plus60CalendarDays}
- 90 dni po starcie: ${timeline.plus90CalendarDays}
- Daty kolejnych 5 dni roboczych 1. tygodnia: ${timeline.weekOneDates.join(' | ')}

WYMAGANIA MERYTORYCZNE I PRAWNE:
1. "summary": Zwięzłe (2-3 zdania) podsumowanie kluczowych wymogów formalnych i organizacyjnych dla tej konkretnej konfiguracji (${brief.contractType}, ${brief.workMode}).
2. "hrStages": Podziel checklistę Twardego HR i Kadr na logiczne etapy (np. "Przed 1. dniem", "1. dzień pracy", "Do 7 dni od startu", "Do 30 / 90 dni") z unikalnymi ID zadań ("hr-1", "hr-2" itd.).
   - Dla "Umowa o pracę": uwzględnij skierowanie na wstępne badania medycyny pracy przed dopuszczeniem do pracy (art. 229 § 1 i 4 KP — z uwzględnieniem monitora >4h i auta służbowego, jeśli zaznaczono), kwestionariusz osobowy (art. 22¹ KP), umowę o pracę (art. 29 § 1-2 KP), szkolenie wstępne BHP (art. 237³ KP), informację o warunkach zatrudnienia w ciągu 7 dni (art. 29 § 3 KP), zgłoszenie do ZUS ZUA/ZZA w terminie 7 dni (art. 36 ust. 4 ustawy o sus), PIT-2, klauzulę informacyjną RODO / upoważnienie do przetwarzania danych (jeśli zaznaczono), ocenę ryzyka zawodowego i zasady pracy zdalnej/hybrydowej (art. 67¹⁸ KP).
   - Dla "Kontrakt B2B": NIE wpisuj badań medycyny pracy z KP, PIT-2 ani ZUS ZUA pracowniczego — zamiast tego weryfikację wpisu w CEIDG / białej listy VAT, podpisanie umowy B2B, NDA (umowy o poufności), upoważnienie RODO (jeśli zaznaczono), powierzenie sprzętu / auta służbowego (jeśli zaznaczono) oraz instrukcję obiegu faktur.
   - Dla "Umowa zlecenie": umowa zlecenie, oświadczenie do celów ZUS/podatkowych (status studenta/inny tytuł do ubezpieczeń), zgłoszenie ZUS ZUA/ZZA w ciągu 7 dni, BHP i badania (jeśli wymaga charakter pracy), RODO/NDA.
3. "itStages": Podziel checklistę IT, Sprzętu i Administracji na etapy ("Przed 1. dniem", "1. dzień pracy") z unikalnymi ID ("it-1", "it-2" itd.). Dla trybu "100% Zdalny" uwzględnij wysyłkę sprzętu kurierem do ${timeline.preboarding3WorkDaysBefore} i zdalne aktywowanie kont/MFA.
4. "weekOnePlan": Dokładnie 5 dni (dayNumber: 1..5), używając w "dateLabel" dokładnych etykiet z listy: ${timeline.weekOneDates.join(', ')}. Każdy dzień powinien mieć 3-4 konkretne bloki czasowe ("timeSlot", np. "09:00 – 10:30") dopasowane do roli "${brief.role}".
5. "goals306090": Dokładnie 3 fazy ("Pierwsze 30 dni" do ${timeline.plus30CalendarDays}, "Dni 31–60" do ${timeline.plus60CalendarDays}, "Dni 61–90" do ${timeline.plus90CalendarDays}) z konkretnymi kamieniami milowymi i mierzalnym wskaźnikiem sukcesu dla stanowiska "${brief.role}".
6. "messages":
   - "welcomeEmail": Naturalny, ciepły, konkretny mail powitalny do ${brief.firstName} wysyłany na 3 dni przed startem (${timeline.preboarding3WorkDaysBefore}), uwzględniający tryb pracy (${brief.workMode}) i plan 1. dnia.
   - "managerBrief": Konkretny brief organizacyjny dla menedżera (${brief.managerName}) przypominający o przygotowaniu zespołu, Buddy'ego i planu na 1. dzień (${timeline.startDateFormatted}).

Pisz naturalną, poprawną polszczyzną bez korporacyjnej nowomowy.`;

      const result = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: onboardingResponseSchema,
          temperature: 0.3,
        },
      });

      const rawText = result.text;
      if (!rawText) {
        throw new Error('Model AI zwrócił pustą odpowiedź. Spróbuj ponownie.');
      }

      const parsed = JSON.parse(rawText);

      const generatedPackage: OnboardingPackage = {
        brief: { ...brief },
        summary: parsed.summary,
        hrStages: parsed.hrStages,
        itStages: parsed.itStages,
        weekOnePlan: parsed.weekOnePlan,
        goals306090: parsed.goals306090,
        messages: parsed.messages,
        generatedAt: new Date().toISOString(),
        source: 'ai',
      };

      setPkg(generatedPackage);
      setCompletedIds({});
    } catch (err) {
      console.error('Błąd generowania pakietu onboardingowego:', err);
      const rawMsg = err instanceof Error ? err.message : String(err);

      if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
        setErrorMessage(
          'Przekroczono chwilowy limit zapytań darmowego klucza API Google. Odczekaj ok. 30 sekund i kliknij „Spróbuj ponownie”.',
        );
      } else if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('401') || rawMsg.includes('403')) {
        setErrorMessage(
          'Nieprawidłowy klucz API Google Gemini. Sprawdź zmienną VITE_GEMINI_API_KEY na Vercelu.',
        );
      } else {
        setErrorMessage(`Nie udało się wygenerować pakietu: ${rawMsg}`);
      }
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
