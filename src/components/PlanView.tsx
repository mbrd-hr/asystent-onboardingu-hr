import type { GoalPhase, WeekDayPlan } from '../types/onboarding';

interface PlanViewProps {
  weekOnePlan: WeekDayPlan[];
  goals306090: GoalPhase[];
  role: string;
}

export function PlanView({ weekOnePlan, goals306090, role }: PlanViewProps) {
  return (
    <div className="space-y-10">
      {/* Week 1 Schedule */}
      <section aria-labelledby="week-one-heading">
        <div className="pb-3 border-b border-[#E2E6EC]">
          <h3 id="week-one-heading" className="text-base font-semibold text-[#111318]">
            Harmonogram 1. tygodnia wdrożenia
          </h3>
          <p className="mt-1 text-xs text-[#525B6B]">
            Dni robocze dopasowane do roli <span className="font-medium text-[#111318]">{role}</span> — z uwzględnieniem formalności startowych i spotkań merytorycznych.
          </p>
        </div>

        <div className="divide-y divide-[#E2E6EC]">
          {weekOnePlan.map((day) => (
            <div key={day.dayNumber} className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <div className="text-xs font-mono tabular-nums font-medium text-[#1E3A8A]">
                  Dzień {day.dayNumber} · {day.dateLabel}
                </div>
                <h4 className="mt-1 text-sm font-semibold text-[#111318] leading-snug">
                  {day.focus}
                </h4>
              </div>

              <div className="md:col-span-8">
                <ul className="space-y-2.5">
                  {day.activities.map((activity, idx) => (
                    <li
                      key={`${day.dayNumber}-${idx}`}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 text-xs leading-relaxed"
                    >
                      <span className="sm:col-span-3 font-mono tabular-nums text-[#525B6B] whitespace-nowrap">
                        {activity.timeSlot}
                      </span>
                      <div className="sm:col-span-9">
                        <span className="text-[#111318]">{activity.title}</span>
                        <span className="text-[#647082]"> · {activity.lead}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 30-60-90 Day Goals */}
      <section aria-labelledby="goals-heading">
        <div className="pb-3 border-b border-[#E2E6EC]">
          <h3 id="goals-heading" className="text-base font-semibold text-[#111318]">
            Cele wdrożeniowe 30–60–90 dni
          </h3>
          <p className="mt-1 text-xs text-[#525B6B]">
            Konkretne kamienie milowe i kryteria oceny na pierwsze trzy miesiące współpracy.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E6EC]">
          {goals306090.map((phase, idx) => (
            <div
              key={phase.period}
              className={`${idx === 0 ? 'pb-6 lg:pb-0 lg:pr-5' : idx === 1 ? 'py-6 lg:py-0 lg:px-5' : 'pt-6 lg:pt-0 lg:pl-5'} flex flex-col`}
            >
              <div className="flex items-baseline justify-between gap-2 text-xs font-mono tabular-nums">
                <span className="font-semibold text-[#1E3A8A]">{phase.period}</span>
                <span className="text-[#647082]">do {phase.targetDate}</span>
              </div>

              <h4 className="mt-2 text-sm font-semibold text-[#111318] leading-snug">
                {phase.headline}
              </h4>

              <ul className="mt-3 space-y-2 flex-1">
                {phase.milestones.map((milestone, mIdx) => (
                  <li
                    key={mIdx}
                    className="text-xs text-[#3C4453] leading-relaxed pl-3.5 relative before:content-['–'] before:absolute before:left-0 before:text-[#8C95A6]"
                  >
                    {milestone}
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-[#ECEFF4]">
                <span className="block text-[11px] font-medium text-[#647082]">
                  Kryterium sukcesu
                </span>
                <p className="mt-1 text-xs text-[#111318] leading-relaxed">
                  {phase.successMetric}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
