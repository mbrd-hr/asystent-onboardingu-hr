import { AlertTriangle, Check, Loader2, ShieldCheck } from 'lucide-react';
import { PRESET_BRIEFS } from '../data/presets';
import { calculateOnboardingTimeline, getDefaultStartDateIso } from '../lib/dates';
import type { ContractType, OnboardingBrief, WorkMode } from '../types/onboarding';

interface BriefFormProps {
  brief: OnboardingBrief;
  onChange: (next: OnboardingBrief) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  isDirty: boolean;
  activePresetId: string | null;
  onSelectPreset: (presetId: string) => void;
}

const CONTRACT_OPTIONS: ContractType[] = ['Umowa o pracę', 'Umowa zlecenie', 'Kontrakt B2B'];
const WORK_MODE_OPTIONS: WorkMode[] = ['Stacjonarny', 'Hybrydowy', '100% Zdalny'];

export function BriefForm({
  brief,
  onChange,
  onSubmit,
  isGenerating,
  isDirty,
  activePresetId,
  onSelectPreset,
}: BriefFormProps) {
  const timeline = calculateOnboardingTimeline(brief.startDate);

  const updateField = <K extends keyof OnboardingBrief>(key: K, value: OnboardingBrief[K]) => {
    onChange({ ...brief, [key]: value });
  };

  const toggleCondition = (key: keyof OnboardingBrief['conditions']) => {
    onChange({
      ...brief,
      conditions: {
        ...brief.conditions,
        [key]: !brief.conditions[key],
      },
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const canSubmit =
    !isGenerating &&
    brief.firstName.trim().length > 0 &&
    brief.role.trim().length > 0 &&
    brief.department.trim().length > 0 &&
    brief.managerName.trim().length > 0 &&
    brief.startDate.trim().length > 0;

  return (
    <aside className="bg-white border border-[#E2E6EC] rounded-xl overflow-hidden">
      {/* Presets section */}
      <div className="px-5 pt-5 pb-4 border-b border-[#E2E6EC]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-[#111318]">Szybkie szablony briefu</h2>
          <span className="text-xs text-[#647082]">1 kliknięcie</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {PRESET_BRIEFS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors duration-150 flex items-center justify-between gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] ${
                  isSelected
                    ? 'bg-[#EEF2FF] text-[#1E3A8A] border border-[#C7D4F5]'
                    : 'bg-[#F6F7F9] text-[#2D3542] border border-transparent hover:bg-[#ECEFF4] hover:text-[#111318]'
                }`}
              >
                <span className="truncate">{preset.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[#1E3A8A]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Brief Form */}
      <form onSubmit={handleFormSubmit} className="p-5 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[#111318]">Brief nowej osoby</h2>
          <p className="mt-1 text-xs text-[#525B6B] flex items-start gap-1.5 leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#0F6B54]" aria-hidden="true" />
            <span>Wpisuj wyłącznie imię — aplikacja nie zapisuje danych wrażliwych ani PESEL (RODO).</span>
          </p>
        </div>

        <div className="space-y-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-xs font-medium text-[#2D3542] mb-1.5">
              Imię nowej osoby
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={brief.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="np. Anna"
              className="w-full h-10 px-3 text-sm bg-white text-[#111318] border border-[#D4DAE3] rounded-lg placeholder:text-[#8C95A6] focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/15 transition-colors"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-xs font-medium text-[#2D3542] mb-1.5">
              Nazwa stanowiska
            </label>
            <input
              id="role"
              type="text"
              required
              value={brief.role}
              onChange={(e) => updateField('role', e.target.value)}
              placeholder="np. Specjalista ds. Kadr i Płac"
              className="w-full h-10 px-3 text-sm bg-white text-[#111318] border border-[#D4DAE3] rounded-lg placeholder:text-[#8C95A6] focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/15 transition-colors"
            />
          </div>

          {/* Department & Manager */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="department" className="block text-xs font-medium text-[#2D3542] mb-1.5">
                Dział
              </label>
              <input
                id="department"
                type="text"
                required
                value={brief.department}
                onChange={(e) => updateField('department', e.target.value)}
                placeholder="np. Kadry i Płace"
                className="w-full h-10 px-3 text-sm bg-white text-[#111318] border border-[#D4DAE3] rounded-lg placeholder:text-[#8C95A6] focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/15 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="managerName" className="block text-xs font-medium text-[#2D3542] mb-1.5">
                Przełożony (imię)
              </label>
              <input
                id="managerName"
                type="text"
                required
                value={brief.managerName}
                onChange={(e) => updateField('managerName', e.target.value)}
                placeholder="np. Marek"
                className="w-full h-10 px-3 text-sm bg-white text-[#111318] border border-[#D4DAE3] rounded-lg placeholder:text-[#8C95A6] focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/15 transition-colors"
              />
            </div>
          </div>

          {/* Contract Type */}
          <fieldset>
            <legend className="block text-xs font-medium text-[#2D3542] mb-1.5">
              Forma zatrudnienia
            </legend>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#F6F7F9] border border-[#E2E6EC] rounded-lg">
              {CONTRACT_OPTIONS.map((option) => {
                const active = brief.contractType === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField('contractType', option)}
                    aria-pressed={active}
                    className={`min-h-[36px] px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 whitespace-nowrap truncate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1E3A8A] ${
                      active
                        ? 'bg-white text-[#1E3A8A] shadow-xs border border-[#D4DAE3]'
                        : 'text-[#525B6B] hover:text-[#111318] border border-transparent'
                    }`}
                    title={option}
                  >
                    {option === 'Umowa o pracę'
                      ? 'UoP'
                      : option === 'Umowa zlecenie'
                        ? 'Zlecenie'
                        : 'Kontrakt B2B'}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-[#647082]">
              Wybrano: <span className="font-medium text-[#2D3542]">{brief.contractType}</span>
            </p>
          </fieldset>

          {/* Work Mode */}
          <fieldset>
            <legend className="block text-xs font-medium text-[#2D3542] mb-1.5">
              Tryb pracy
            </legend>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#F6F7F9] border border-[#E2E6EC] rounded-lg">
              {WORK_MODE_OPTIONS.map((mode) => {
                const active = brief.workMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateField('workMode', mode)}
                    aria-pressed={active}
                    className={`min-h-[36px] px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 whitespace-nowrap truncate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1E3A8A] ${
                      active
                        ? 'bg-white text-[#1E3A8A] shadow-xs border border-[#D4DAE3]'
                        : 'text-[#525B6B] hover:text-[#111318] border border-transparent'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Start Date */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="startDate" className="block text-xs font-medium text-[#2D3542]">
                Data rozpoczęcia pracy
              </label>
              <button
                type="button"
                onClick={() => updateField('startDate', getDefaultStartDateIso(14))}
                className="text-[11px] font-medium text-[#1E3A8A] hover:underline focus-visible:outline-2 focus-visible:outline-[#1E3A8A] rounded"
              >
                Za 14 dni
              </button>
            </div>
            <input
              id="startDate"
              type="date"
              required
              value={brief.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white text-[#111318] border border-[#D4DAE3] rounded-lg focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/15 transition-colors"
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#525B6B]">
              <span>{timeline.startDateFull}</span>
              <span className="font-mono tabular-nums text-[#647082]">
                ZUS/KP: do {timeline.plus7CalendarDays}
              </span>
            </div>
            {timeline.isStartWeekend && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-2.5 py-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>Wybrana data wypada w weekend — w praktyce kadrowej zalecamy dzień roboczy.</span>
              </p>
            )}
          </div>

          {/* Additional Conditions */}
          <fieldset className="pt-1">
            <legend className="block text-xs font-medium text-[#2D3542] mb-2">
              Dodatkowe warunki stanowiska
            </legend>
            <div className="space-y-2">
              {(
                [
                  {
                    key: 'monitorOver4h',
                    label: 'Praca przy monitorze ekranowym >4h',
                    hint: 'Czynnik na skierowaniu med. pracy i refundacja okularów',
                  },
                  {
                    key: 'companyCar',
                    label: 'Samochód służbowy',
                    hint: 'Badania kat. B, polityka flotowa, protokół pojazdu',
                  },
                  {
                    key: 'gdprAccess',
                    label: 'Dostęp do danych osobowych (RODO)',
                    hint: 'Upoważnienie RODO / umowa powierzenia DPA',
                  },
                ] as const
              ).map((item) => {
                const checked = brief.conditions[item.key];
                return (
                  <label
                    key={item.key}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors duration-150 ${
                      checked
                        ? 'bg-[#F8FAFF] border-[#C7D4F5]'
                        : 'bg-white border-[#E2E6EC] hover:border-[#CBD3DF]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCondition(item.key)}
                      className="mt-0.5 h-4 w-4 rounded border-[#CBD3DF] text-[#1E3A8A] accent-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-medium text-[#111318] leading-snug">
                        {item.label}
                      </span>
                      <span className="block text-[11px] text-[#647082] mt-0.5 leading-snug">
                        {item.hint}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Submit CTA */}
        <div className="pt-2 border-t border-[#E2E6EC] space-y-2">
          {isDirty && canSubmit && !isGenerating && (
            <p className="text-xs text-[#1E3A8A]">
              Brief został zmieniony — wygeneruj zaktualizowany pakiet.
            </p>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#172E6E] active:bg-[#13265C] disabled:opacity-55 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                <span>Generowanie pakietu...</span>
              </>
            ) : (
              <span>Generuj pakiet onboardingowy</span>
            )}
          </button>
        </div>
      </form>
    </aside>
  );
}
