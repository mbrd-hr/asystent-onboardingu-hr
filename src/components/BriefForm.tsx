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
    createDefault
