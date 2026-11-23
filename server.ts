import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import { calculateOnboardingTimeline } from './src/lib/dates.ts';
import type { OnboardingBrief } from './src/types/onboarding.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
}

function createGeminiClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const checklistTaskSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: 'Krótki unikalny identyfikator zadania, np. hr-1 lub it-1.' },
    title: { type: Type.STRING, description: 'Zwięzły, konkretny tytuł zadania po polsku.' },
    description: {
      type: Type.STRING,
      description: 'Konkretna instrukcja co przygotować lub zrobić, bez ogólników.',
    },
    owner: {
      type: Type.STRING,
      description: 'Odpowiedzialna rola lub dział, np. Kadry, IT, Administracja, BHP, Przełożony.',
    },
    dueDate: {
      type: Type.STRING,
      description: 'Dokładna data w formacie DD.MM.RRRR dopasowana do podanego kalendarza.',
    },
    legalRef: {
      type: Type.STRING,
      description: 'Opcjonalna podstawa prawna lub formularz (np. art. 229 KP, ZUS ZUA, PIT-2, art. 28 RODO).',
    },
  },
  required: ['id', 'title', 'description', 'owner', 'dueDate'],
};

const checklistStageSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    deadlineLabel: { type: Type.STRING, description: 'Np. do 04.12.2026 albo 07.12.2026.' },
    tasks: {
      type: Type.ARRAY,
      items: checklistTaskSchema,
    },
  },
  required: ['id', 'title', 'deadlineLabel', 'tasks'],
};

const onboardingResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description:
        'Krótkie 2-zdaniowe podsumowanie pakietu onboardingowego uwzględniające formę zatrudnienia, tryb pracy i kluczowe warunki.',
    },
    hrStages: {
      type: Type.ARRAY,
      description:
        'Dokładnie 4 etapy kadrowe: "Przed 1. dniem", "1. dzień pracy", "Do 7 dni od startu", "Do 30 dni". Łącznie 10–13 konkretnych zadań.',
      items: checklistStageSchema,
    },
    itStages: {
      type: Type.ARRAY,
      description:
        'Dokładnie 2 etapy: "Przygotowanie przed startem" oraz "1. dzień — przekazanie i konfiguracja". Łącznie 5–7 konkretnych zadań.',
      items: checklistStageSchema,
    },
    weekOnePlan: {
      type: Type.ARRAY,
      description: 'Dokładnie 5 dni roboczych 1. tygodnia wdrożenia dopasowanych merytorycznie do stanowiska.',
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
                timeSlot: { type: Type.STRING, description: 'Np. 09:00 – 10:30' },
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
      description: 'Dokładnie 3 etapy celów: "30 dni", "60 dni", "90 dni" z mierzalnymi kamieniami milowymi.',
      items: {
        type: Type.OBJECT,
        properties: {
          period: { type: Type.STRING, description: '30 dni, 60 dni albo 90 dni' },
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

function buildPrompt(brief: OnboardingBrief): string {
  const timeline = calculateOnboardingTimeline(brief.startDate);

  const activeConditions: string[] = [];
  if (brief.conditions.monitorOver4h) activeConditions.push('Praca przy monitorze ekranowym >4h dziennie');
  if (brief.conditions.companyCar) activeConditions.push('Samochód służbowy (kat. B)');
  if (brief.conditions.gdprAccess) activeConditions.push('Dostęp do danych osobowych (RODO)');

  return `Przygotuj kompletny, precyzyjny pakiet onboardingowy po polsku dla nowej osoby w organizacji.

DANE BRIEFU (bez danych wrażliwych RODO):
- Imię nowej osoby: ${brief.firstName}
- Stanowisko: ${brief.role}
- Dział: ${brief.department}
- Przełożony (Hiring Manager): ${brief.managerName}
- Forma zatrudnienia: ${brief.contractType}
- Tryb pracy: ${brief.workMode}
- Data rozpoczęcia pracy: ${timeline.startDateFormatted} (${timeline.startDateFull})
- Dodatkowe warunki: ${activeConditions.length > 0 ? activeConditions.join('; ') : 'Brak dodatkowych warunków szczególnych'}

WYLICZONE DATY GRANICZNE (UŻYWAJ DOKŁADNIE TYCH DAT, NIE PRZELICZAJ ICH NA NOWO):
- 10 dni roboczych przed startem: ${timeline.preboarding10WorkDaysBefore}
- 5 dni roboczych przed startem: ${timeline.preboarding5WorkDaysBefore}
- 3 dni robocze przed startem (wysyłka maila powitalnego): ${timeline.preboarding3WorkDaysBefore}
- 1 dzień roboczy przed startem (zamknięcie etapu "Przed 1. dniem"): ${timeline.preboarding1WorkDayBefore}
- 1. dzień pracy: ${timeline.startDateFormatted}
- Do 7 dni kalendarzowych od startu (np. ZUS ZUA/ZZA, art. 29 § 3 KP): ${timeline.plus7CalendarDays}
- Do 30 dni od startu (cel 30 dni): ${timeline.plus30CalendarDays}
- Do 60 dni od startu (cel 60 dni): ${timeline.plus60CalendarDays}
- Do 90 dni od startu (cel 90 dni): ${timeline.plus90CalendarDays}
- Dni robocze 1. tygodnia:
  Dzień 1: ${timeline.weekOneDates[0]}
  Dzień 2: ${timeline.weekOneDates[1]}
  Dzień 3: ${timeline.weekOneDates[2]}
  Dzień 4: ${timeline.weekOneDates[3]}
  Dzień 5: ${timeline.weekOneDates[4]}

ZASADY MERYTORYCZNE (POLSKIE PRAWO PRACY I PRAKTYKA HR):
1. Forma zatrudnienia "${brief.contractType}":
   - Jeśli "Umowa o pracę": uwzględnij badania wstępne medycyny pracy przed dopuszczeniem do pracy (art. 229 KP), kwestionariusz osobowy i dokumenty urlopowe, umowę o pracę (art. 29 KP), szkolenie wstępne BHP (ogólne i stanowiskowe), oświadczenie PIT-2, nr rachunku bankowego, zgłoszenie ZUS ZUA w ciągu 7 dni (art. 36 ust. 4 ustawy o SUS), pisemną informację o warunkach zatrudnienia z art. 29 § 3 KP w ciągu 7 dni, założenie akt osobowych (części A i B), PPK, a przy trybie zdalnym/hybrydowym także zasady BHP pracy zdalnej i ryczałt/ekwiwalent za energię i internet.
   - Jeśli "Umowa zlecenie": uwzględnij umowę zlecenie, oświadczenie zleceniobiorcy do celów ZUS (zbieg tytułów, status ucznia/studenta do 26 r.ż., dobrowolne chorobowe), zgłoszenie ZUS ZUA lub ZUS ZZA w ciągu 7 dni, ewidencję godzin zlecenia (minimalna stawka godzinowa), zasady rozliczania rachunków. NIE umieszczaj art. 29 § 3 KP ani urlopu wypoczynkowego z KP.
   - Jeśli "Kontrakt B2B": uwzględnij weryfikację wpisu CEIDG/KRS oraz Białej Listy Podatników VAT, podpisanie umowy B2B (zakres usług, SLA, IP, NDA, zasady fakturowania), a jeśli zaznaczono RODO — umowę powierzenia przetwarzania danych osobowych (DPA, art. 28 RODO) zamiast pracowniczego upoważnienia. NIE umieszczaj ZUS ZUA/ZZA, PIT-2, PPK, badań wstępnych z KP ani podległości pracowniczej (unikaj znamion stosunku pracy).
2. Dodatkowe warunki:
   - Jeśli zaznaczono "Praca przy monitorze ekranowym >4h": przy UoP wpisz czynnik monitora >4h w skierowaniu na badania wstępne oraz informację o dofinansowaniu okularów/soczewek korekcyjnych (rozp. MRPiPS ws. BHP przy monitorach); w IT uwzględnij ergonomię stanowiska.
   - Jeśli zaznaczono "Samochód służbowy": przy UoP/zleceniu wpisz skierowanie na badania lekarskie uwzględniające kierowanie pojazdem służbowym kat. B (badania okulistyczne/zmierzchowe), politykę flotową, protokół przekazania pojazdu, kartę paliwową i polisę OC/AC.
   - Jeśli zaznaczono "Dostęp do danych osobowych (RODO)": uwzględnij upoważnienie RODO i zobowiązanie do poufności (dla UoP/zlecenia) albo umowę powierzenia DPA z art. 28 RODO (dla B2B) oraz szkolenie z bezpieczeństwa informacji.
3. Tryb pracy "${brief.workMode}":
   - Jeśli "100% Zdalny": w IT uwzględnij wysyłkę laptopa kurierem najpóźniej ${timeline.preboarding5WorkDaysBefore} z potwierdzeniem doręczenia, zdalny protokół odbioru, konfigurację VPN/MFA i instrukcję pierwszego logowania w mailu powitalnym.
   - Jeśli "Hybrydowy" lub "Stacjonarny": uwzględnij przygotowanie biurka/monitora, karty dostępu, odbiór sprzętu w biurze i dokładny opis spotkania w biurze w mailu powitalnym.
4. Dopasowanie do stanowiska "${brief.role}" w dziale "${brief.department}":
   - W IT podaj realistyczne narzędzia i systemy właściwe dla tego konkretnego stanowiska.
   - W Planie 1. tygodnia i celach 30-60-90 dni wpisz konkretne, branżowe zadania, spotkania i mierzalne efekty dla roli "${brief.role}" (nie ogólniki).
5. Język i styl:
   - Naturalna, profesjonalna polszczyzna, poprawna odmiana imion (${brief.firstName}, ${brief.managerName}).
   - Bez korporacyjnego żargonu, bez sztucznych anglicyzmów tam, gdzie istnieją naturalne polskie określenia.
   - W wiadomości powitalnej i briefie dla menedżera użyj wyraźnego podziału na akapity i punkty (znaki nowej linii \\n), gotowe od razu do skopiowania i wysłania.
   - W hrStages zawsze zwróć dokładnie 4 etapy o dokładnych tytułach: "Przed 1. dniem", "1. dzień pracy", "Do 7 dni od startu", "Do 30 dni".
   - W itStages zwróć dokładnie 2 etapy: "Przygotowanie przed startem", "1. dzień — przekazanie i konfiguracja".`;
}

async function generateWithModel(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction:
        'Jesteś doświadczonym starszym specjalistą ds. kadr, płac i onboardingu w Polsce. Tworzysz precyzyjne, zgodne z polskim prawem (Kodeks pracy, ustawa o SUS, RODO, przepisy podatkowe i BHP) pakiety wdrożeniowe w czystym, naturalnym języku polskim. Zawsze zwracasz poprawny JSON zgodny ze schematem.',
      responseMimeType: 'application/json',
      responseSchema: onboardingResponseSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Model zwrócił pustą odpowiedź.');
  }
  return text;
}

function isModelNotFoundError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  return (
    status === 404 ||
    message.includes('404') ||
    message.includes('NOT_FOUND') ||
    message.toLowerCase().includes('not found')
  );
}

function validateBrief(body: unknown): OnboardingBrief | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const firstName = typeof b.firstName === 'string' ? b.firstName.trim() : '';
  const role = typeof b.role === 'string' ? b.role.trim() : '';
  const department = typeof b.department === 'string' ? b.department.trim() : '';
  const managerName = typeof b.managerName === 'string' ? b.managerName.trim() : '';
  const contractType = b.contractType;
  const workMode = b.workMode;
  const startDate = typeof b.startDate === 'string' ? b.startDate.trim() : '';
  const cond = (b.conditions && typeof b.conditions === 'object' ? b.conditions : {}) as Record<
    string,
    unknown
  >;

  if (!firstName || !role || !department || !managerName || !startDate) {
    return null;
  }

  if (
    contractType !== 'Umowa o pracę' &&
    contractType !== 'Umowa zlecenie' &&
    contractType !== 'Kontrakt B2B'
  ) {
    return null;
  }

  if (workMode !== 'Stacjonarny' && workMode !== 'Hybrydowy' && workMode !== '100% Zdalny') {
    return null;
  }

  return {
    firstName: firstName.slice(0, 60),
    role: role.slice(0, 100),
    department: department.slice(0, 80),
    managerName: managerName.slice(0, 60),
    contractType,
    workMode,
    startDate,
    conditions: {
      monitorOver4h: Boolean(cond.monitorOver4h),
      companyCar: Boolean(cond.companyCar),
      gdprAccess: Boolean(cond.gdprAccess),
    },
  };
}

const MODEL_CANDIDATES = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-4-hydrogen',
];

async function generateWithFallback(ai: GoogleGenAI, prompt: string): Promise<string> {
  let lastError: unknown;
  for (let i = 0; i < MODEL_CANDIDATES.length; i += 1) {
    const model = MODEL_CANDIDATES[i];
    try {
      return await generateWithModel(ai, model, prompt);
    } catch (err) {
      lastError = err;
      const isLast = i === MODEL_CANDIDATES.length - 1;
      if (!isLast && isModelNotFoundError(err)) {
        console.warn(`Model ${model} unavailable (404), trying next model...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/onboarding/generate', async (req, res) => {
    const brief = validateBrief(req.body);
    if (!brief) {
      res.status(400).json({
        error: 'Uzupełnij wszystkie wymagane pola briefu (imię, stanowisko, dział, przełożony i data startu).',
      });
      return;
    }

    try {
      const ai = createGeminiClient();
      const prompt = buildPrompt(brief);
      const rawJson = await generateWithFallback(ai, prompt);

      const parsed = JSON.parse(rawJson.trim());
      res.json({
        ...parsed,
        brief,
        generatedAt: new Date().toISOString(),
        source: 'ai',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number })?.status;
      console.error('Onboarding generation error:', status, message);

      if (message === 'MISSING_API_KEY') {
        res.status(503).json({
          error:
            'Brak skonfigurowanego klucza GEMINI_API_KEY po stronie serwera. Sprawdź konfigurację w panelu Settings > Secrets.',
        });
        return;
      }

      if (
        status === 401 ||
        status === 403 ||
        message.includes('API_KEY_INVALID') ||
        message.includes('PERMISSION_DENIED')
      ) {
        res.status(401).json({
          error:
            'Nieprawidłowy klucz API Gemini lub brak uprawnień. Sprawdź klucz w panelu Settings > Secrets.',
        });
        return;
      }

      if (status === 429 || message.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({
          error: 'Przekroczono chwilowy limit zapytań do Gemini API. Spróbuj ponownie za chwilę.',
        });
        return;
      }

      res.status(500).json({
        error: 'Nie udało się wygenerować pakietu onboardingowego. Spróbuj ponownie za moment.',
      });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
