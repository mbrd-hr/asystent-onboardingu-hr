import { useState } from 'react';
import { Check } from 'lucide-react';
import type { ChecklistStage } from '../types/onboarding';

interface ChecklistViewProps {
  stages: ChecklistStage[];
  completedIds: Record<string, boolean>;
  onToggleTask: (taskId: string) => void;
  sectionDescription: string;
}

type FilterMode = 'all' | 'todo' | 'done';

export function ChecklistView({
  stages,
  completedIds,
  onToggleTask,
  sectionDescription,
}: ChecklistViewProps) {
  const [filter, setFilter] = useState<FilterMode>('all');

  const allTasks = stages.flatMap((s) => s.tasks);
  const doneCount = allTasks.filter((t) => Boolean(completedIds[t.id])).length;
  const todoCount = allTasks.length - doneCount;

  const filteredStages = stages
    .map((stage) => ({
      ...stage,
      tasks: stage.tasks.filter((task) => {
        const isDone = Boolean(completedIds[task.id]);
        if (filter === 'todo') return !isDone;
        if (filter === 'done') return isDone;
        return true;
      }),
    }))
    .filter((stage) => stage.tasks.length > 0);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E6EC]">
        <p className="text-sm text-[#525B6B] max-w-xl leading-relaxed">{sectionDescription}</p>
        <div className="inline-flex items-center gap-1 p-1 bg-[#F6F7F9] border border-[#E2E6EC] rounded-lg self-start sm:self-auto shrink-0">
          {(
            [
              { id: 'all', label: `Wszystkie (${allTasks.length})` },
              { id: 'todo', label: `Do zrobienia (${todoCount})` },
              { id: 'done', label: `Ukończone (${doneCount})` },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap tabular-nums focus-visible:outline-2 focus-visible:outline-[#1E3A8A] ${
                  active
                    ? 'bg-white text-[#111318] shadow-xs'
                    : 'text-[#525B6B] hover:text-[#111318]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty filter state */}
      {filteredStages.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-[#111318]">
            {filter === 'todo'
              ? 'Wszystkie zadania w tej sekcji zostały ukończone.'
              : 'Nie oznaczono jeszcze żadnego zadania jako ukończone.'}
          </p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="mt-3 text-xs font-medium text-[#1E3A8A] hover:underline"
          >
            Pokaż wszystkie zadania
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredStages.map((stage) => {
            const originalStage = stages.find((s) => s.id === stage.id) ?? stage;
            const stageCompleted = originalStage.tasks.filter((t) => Boolean(completedIds[t.id])).length;
            const stageTotal = originalStage.tasks.length;

            return (
              <section key={stage.id} aria-labelledby={`stage-${stage.id}`}>
                {/* Stage header */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2.5 border-b border-[#E2E6EC]">
                  <div className="flex items-baseline gap-2.5">
                    <h3
                      id={`stage-${stage.id}`}
                      className="text-sm font-semibold text-[#111318] tracking-tight"
                    >
                      {stage.title}
                    </h3>
                    <span className="text-xs font-mono tabular-nums text-[#525B6B]">
                      {stage.deadlineLabel}
                    </span>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-[#647082]">
                    {stageCompleted}/{stageTotal} ukończono
                  </span>
                </div>

                {/* Task rows */}
                <ul className="divide-y divide-[#ECEFF4]">
                  {stage.tasks.map((task) => {
                    const checked = Boolean(completedIds[task.id]);
                    return (
                      <li key={task.id}>
                        <label className="group flex items-start gap-3.5 py-3.5 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-150">
                          <span className="relative flex items-center justify-center mt-0.5 shrink-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onToggleTask(task.id)}
                              className="peer sr-only"
                            />
                            <span
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1E3A8A] ${
                                checked
                                  ? 'bg-[#0F6B54] border-[#0F6B54] text-white'
                                  : 'bg-white border-[#CBD3DF] group-hover:border-[#1E3A8A]'
                              }`}
                            >
                              {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />}
                            </span>
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                              <span
                                className={`text-sm font-medium leading-snug transition-colors ${
                                  checked ? 'line-through text-[#7B8494]' : 'text-[#111318]'
                                }`}
                              >
                                {task.title}
                              </span>
                              <span className="text-xs font-mono tabular-nums text-[#525B6B] whitespace-nowrap shrink-0">
                                Termin: {task.dueDate}
                              </span>
                            </div>

                            <p
                              className={`mt-1 text-xs leading-relaxed ${
                                checked ? 'text-[#8C95A6]' : 'text-[#525B6B]'
                              }`}
                            >
                              {task.description}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#647082]">
                              <span>Odpowiedzialny: {task.owner}</span>
                              {task.legalRef && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono text-[#4B5565]">{task.legalRef}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
