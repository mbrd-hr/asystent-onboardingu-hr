import { calculateOnboardingTimeline } from '../lib/dates';
import type { OnboardingPackage } from '../types/onboarding';

interface PrintPackageProps {
  pkg: OnboardingPackage;
  completedIds: Record<string, boolean>;
}

export function PrintPackage({ pkg, completedIds }: PrintPackageProps) {
  const timeline = calculateOnboardingTimeline(pkg.brief.startDate);
  const conditions: string[] = [];
  if (pkg.brief.conditions.monitorOver4h) conditions.push('Monitor ekranowy >4h');
  if (pkg.brief.conditions.companyCar) conditions.push('Samochód służbowy');
  if (pkg.brief.conditions.gdprAccess) conditions.push('Dostęp do danych osobowych (RODO)');

  const allTasks = [...pkg.hrStages.flatMap((s) => s.tasks), ...pkg.itStages.flatMap((s) => s.tasks)];
  const completedCount = allTasks.filter((t) => Boolean(completedIds[t.id])).length;

  return (
    <div className="hidden print:block text-[#111318] bg-white">
      {/* Header */}
      <header className="pb-4 mb-5 border-b-2 border-[#111318]">
        <div className="text-xs text-[#525B6B] mb-1">
          Asystent Onboardingu HR — Pakiet wdrożeniowy (bez danych wrażliwych RODO)
        </div>
        <h1 className="text-xl font-bold text-[#111318]">
          {pkg.brief.firstName} — {pkg.brief.role}
        </h1>
        <div className="mt-1.5 text-xs text-[#3C4453] flex flex-wrap gap-x-2 gap-y-0.5">
          <span>Dział: {pkg.brief.department}</span>
          <span>·</span>
          <span>Przełożony: {pkg.brief.managerName}</span>
          <span>·</span>
          <span>{pkg.brief.contractType}</span>
          <span>·</span>
          <span>{pkg.brief.workMode}</span>
          <span>·</span>
          <span className="font-mono tabular-nums">Start: {timeline.startDateFormatted}</span>
          <span>·</span>
          <span className="font-mono tabular-nums">
            Postęp checklisty: {completedCount}/{allTasks.length}
          </span>
        </div>
        {conditions.length > 0 && (
          <div className="mt-1 text-xs text-[#525B6B]">
            Warunki stanowiska: {conditions.join(' · ')}
          </div>
        )}
        <p className="mt-2.5 text-xs text-[#2D3542] leading-relaxed">{pkg.summary}</p>
      </header>

      {/* 1. Hard HR Checklist */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-[#111318] pb-1.5 mb-3 border-b border-[#CBD3DF]">
          1. Twardy HR i Kadry
        </h2>
        <div className="space-y-4">
          {pkg.hrStages.map((stage) => (
            <div key={stage.id} className="print-avoid-break">
              <div className="flex items-baseline justify-between text-xs font-semibold text-[#111318] mb-1.5">
                <span>{stage.title}</span>
                <span className="font-mono tabular-nums text-[#525B6B]">{stage.deadlineLabel}</span>
              </div>
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {stage.tasks.map((task) => {
                    const done = Boolean(completedIds[task.id]);
                    return (
                      <tr key={task.id} className="border-t border-[#E2E6EC]">
                        <td className="py-1.5 pr-2 align-top w-5 font-mono">
                          {done ? '☑' : '☐'}
                        </td>
                        <td className="py-1.5 pr-3 align-top">
                          <div className="font-medium text-[#111318]">{task.title}</div>
                          <div className="text-[10.5px] text-[#525B6B] mt-0.5">{task.description}</div>
                        </td>
                        <td className="py-1.5 pr-3 align-top w-28 text-[10.5px] text-[#3C4453]">
                          <div>{task.owner}</div>
                          {task.legalRef && (
                            <div className="font-mono text-[#525B6B] mt-0.5">{task.legalRef}</div>
                          )}
                        </td>
                        <td className="py-1.5 align-top w-20 text-right font-mono tabular-nums text-[10.5px] text-[#111318]">
                          {task.dueDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* 2. IT & Administration */}
      <section className="mb-6 print-avoid-break">
        <h2 className="text-sm font-bold text-[#111318] pb-1.5 mb-3 border-b border-[#CBD3DF]">
          2. IT, Sprzęt i Administracja
        </h2>
        <div className="space-y-4">
          {pkg.itStages.map((stage) => (
            <div key={stage.id}>
              <div className="flex items-baseline justify-between text-xs font-semibold text-[#111318] mb-1.5">
                <span>{stage.title}</span>
                <span className="font-mono tabular-nums text-[#525B6B]">{stage.deadlineLabel}</span>
              </div>
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {stage.tasks.map((task) => {
                    const done = Boolean(completedIds[task.id]);
                    return (
                      <tr key={task.id} className="border-t border-[#E2E6EC]">
                        <td className="py-1.5 pr-2 align-top w-5 font-mono">
                          {done ? '☑' : '☐'}
                        </td>
                        <td className="py-1.5 pr-3 align-top">
                          <div className="font-medium text-[#111318]">{task.title}</div>
                          <div className="text-[10.5px] text-[#525B6B] mt-0.5">{task.description}</div>
                        </td>
                        <td className="py-1.5 pr-3 align-top w-28 text-[10.5px] text-[#3C4453]">
                          {task.owner}
                        </td>
                        <td className="py-1.5 align-top w-20 text-right font-mono tabular-nums text-[10.5px] text-[#111318]">
                          {task.dueDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Week 1 & 30-60-90 */}
      <section className="mb-6 print-page-break">
        <h2 className="text-sm font-bold text-[#111318] pb-1.5 mb-3 border-b border-[#CBD3DF]">
          3. Plan 1. tygodnia i cele 30–60–90 dni
        </h2>
        <div className="space-y-3 mb-5">
          {pkg.weekOnePlan.map((day) => (
            <div key={day.dayNumber} className="print-avoid-break border-b border-[#E2E6EC] pb-2.5">
              <div className="text-xs font-semibold text-[#111318]">
                <span className="font-mono tabular-nums">Dzień {day.dayNumber} ({day.dateLabel})</span> — {day.focus}
              </div>
              <ul className="mt-1 space-y-1 text-[10.5px] text-[#2D3542]">
                {day.activities.map((a, idx) => (
                  <li key={idx}>
                    <span className="font-mono tabular-nums text-[#525B6B]">{a.timeSlot}</span> · {a.title}{' '}
                    <span className="text-[#525B6B]">({a.lead})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 print-avoid-break">
          {pkg.goals306090.map((phase) => (
            <div key={phase.period} className="border border-[#D4DAE3] rounded p-3">
              <div className="flex justify-between text-xs font-mono font-semibold">
                <span>{phase.period}</span>
                <span>do {phase.targetDate}</span>
              </div>
              <div className="mt-1 text-xs font-semibold">{phase.headline}</div>
              <ul className="mt-2 space-y-1 text-[10.5px] text-[#2D3542] list-disc pl-3.5">
                {phase.milestones.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
              <div className="mt-2 pt-1.5 border-t border-[#E2E6EC] text-[10px] text-[#3C4453]">
                <strong>Kryterium sukcesu:</strong> {phase.successMetric}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Messages */}
      <section className="print-page-break">
        <h2 className="text-sm font-bold text-[#111318] pb-1.5 mb-3 border-b border-[#CBD3DF]">
          4. Gotowe wiadomości
        </h2>
        {[pkg.messages.welcomeEmail, pkg.messages.managerBrief].map((msg, idx) => (
          <div key={idx} className="mb-5 print-avoid-break border border-[#D4DAE3] rounded p-3.5">
            <div className="text-xs font-semibold text-[#111318]">{msg.title}</div>
            <div className="text-[10.5px] text-[#525B6B] mt-0.5">
              {msg.sendDateLabel} · {msg.recipientLabel}
            </div>
            <div className="text-xs font-medium mt-2 pb-1.5 border-b border-[#E2E6EC]">
              Temat: {msg.subject}
            </div>
            <div className="mt-2 text-[11px] whitespace-pre-line leading-relaxed text-[#222834]">
              {msg.body}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
