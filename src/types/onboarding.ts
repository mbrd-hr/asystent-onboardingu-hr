export type ContractType = 'Umowa o pracę' | 'Umowa zlecenie' | 'Kontrakt B2B';

export type WorkMode = 'Stacjonarny' | 'Hybrydowy' | '100% Zdalny';

export interface AdditionalConditions {
  monitorOver4h: boolean;
  companyCar: boolean;
  gdprAccess: boolean;
}

export interface OnboardingBrief {
  firstName: string;
  role: string;
  department: string;
  managerName: string;
  contractType: ContractType;
  workMode: WorkMode;
  startDate: string; // YYYY-MM-DD
  conditions: AdditionalConditions;
}

export interface PresetBrief {
  id: string;
  label: string;
  brief: Omit<OnboardingBrief, 'startDate'>;
}

export interface ChecklistTask {
  id: string;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  legalRef?: string;
}

export interface ChecklistStage {
  id: string;
  title: string;
  deadlineLabel: string;
  tasks: ChecklistTask[];
}

export interface DayActivity {
  timeSlot: string;
  title: string;
  lead: string;
}

export interface WeekDayPlan {
  dayNumber: number;
  dateLabel: string;
  focus: string;
  activities: DayActivity[];
}

export interface GoalPhase {
  period: string;
  targetDate: string;
  headline: string;
  milestones: string[];
  successMetric: string;
}

export interface MessageTemplate {
  title: string;
  sendDateLabel: string;
  recipientLabel: string;
  subject: string;
  body: string;
}

export interface OnboardingPackage {
  brief: OnboardingBrief;
  summary: string;
  hrStages: ChecklistStage[];
  itStages: ChecklistStage[];
  weekOnePlan: WeekDayPlan[];
  goals306090: GoalPhase[];
  messages: {
    welcomeEmail: MessageTemplate;
    managerBrief: MessageTemplate;
  };
  generatedAt: string;
  source: 'example' | 'ai';
}
