import { calculateOnboardingTimeline, getDefaultStartDateIso } from '../lib/dates';
import type { OnboardingBrief, OnboardingPackage, PresetBrief } from '../types/onboarding';

export const PRESET_BRIEFS: PresetBrief[] = [
  {
    id: 'hr-specialist',
    label: 'Specjalista HR · UoP · Hybryda',
    brief: {
      firstName: 'Anna',
      role: 'Specjalista ds. Kadr i Płac',
      department: 'Dział Kadr i Płac',
      managerName: 'Marek',
      contractType: 'Umowa o pracę',
      workMode: 'Hybrydowy',
      conditions: {
        monitorOver4h: true,
        companyCar: false,
        gdprAccess: true,
      },
    },
  },
  {
    id: 'senior-data-analyst',
    label: 'Senior Data Analyst · B2B · Zdalnie',
    brief: {
      firstName: 'Tomasz',
      role: 'Senior Data Analyst',
      department: 'Analityka i BI',
      managerName: 'Katarzyna',
      contractType: 'Kontrakt B2B',
      workMode: '100% Zdalny',
      conditions: {
        monitorOver4h: true,
        companyCar: false,
        gdprAccess: true,
      },
    },
  },
  {
    id: 'sales-rep',
    label: 'Przedstawiciel Handlowy · UoP · Auto służbowe',
    brief: {
      firstName: 'Karolina',
      role: 'Przedstawiciel Handlowy',
      department: 'Sprzedaż B2B',
      managerName: 'Piotr',
      contractType: 'Umowa o pracę',
      workMode: 'Hybrydowy',
      conditions: {
        monitorOver4h: false,
        companyCar: true,
        gdprAccess: true,
      },
    },
  },
];

export function createInitialBrief(): OnboardingBrief {
  return {
    ...PRESET_BRIEFS[0].brief,
    startDate: getDefaultStartDateIso(14),
  };
}

export function createDefaultAnnaPackage(startDateIso?: string): OnboardingPackage {
  const brief: OnboardingBrief = {
    ...PRESET_BRIEFS[0].brief,
    startDate: startDateIso ?? getDefaultStartDateIso(14),
  };
  const t = calculateOnboardingTimeline(brief.startDate);

  return {
    brief,
    summary:
      'Pakiet dla umowy o pracę w trybie hybrydowym na stanowisku z dostępem do danych kadrowo-płacowych (RODO) i pracą przy monitorze powyżej 4 godzin dziennie. Uwzględnia badania wstępne z czynnikiem monitora ekranowego, formalności z Kodeksu pracy, termin 7 dni na ZUS ZUA oraz konfigurację dostępów kadrowych.',
    hrStages: [
      {
        id: 'hr-pre',
        title: 'Przed 1. dniem',
        deadlineLabel: `do ${t.preboarding1WorkDayBefore}`,
        tasks: [
          {
            id: 'hr-1',
            title: 'Skierowanie na wstępne badania lekarskie (medycyna pracy)',
            description:
              'Wystawienie skierowania z wyraźnym wskazaniem pracy przy monitorze ekranowym >4h dziennie. Orzeczenie o braku przeciwwskazań musi wpłynąć przed dopuszczeniem do pracy.',
            owner: 'Kadry',
            dueDate: t.preboarding5WorkDaysBefore,
            legalRef: 'art. 229 § 1 i 4 KP',
          },
          {
            id: 'hr-2',
            title: 'Zebranie kwestionariusza osobowego i dokumentów stażowych',
            description:
              'Pozyskanie danych kandydata/pracownika, świadectw pracy oraz dyplomu ukończenia studiów w celu prawidłowego naliczenia wymiaru urlopu wypoczynkowego.',
            owner: 'Kadry',
            dueDate: t.preboarding3WorkDaysBefore,
            legalRef: 'art. 22¹ KP',
          },
          {
            id: 'hr-3',
            title: 'Przygotowanie umowy o pracę i pakietu dokumentów kadrowych',
            description:
              'Przygotowanie projektu umowy o pracę, porozumienia dot. pracy hybrydowej/zdalnej, oświadczenia PIT-2, klauzuli informacyjnej RODO oraz oceny ryzyka zawodowego.',
            owner: 'Kadry',
            dueDate: t.preboarding1WorkDayBefore,
            legalRef: 'art. 29 § 1–2 KP',
          },
        ],
      },
      {
        id: 'hr-day1',
        title: '1. dzień pracy',
        deadlineLabel: t.startDateFormatted,
        tasks: [
          {
            id: 'hr-4',
            title: 'Podpisanie umowy o pracę i odbiór oświadczeń startowych',
            description:
              'Podpisanie umowy przed rozpoczęciem obowiązków. Odbiór PIT-2, dyspozycji numeru rachunku bankowego do wypłaty wynagrodzenia oraz oświadczenia o zapoznaniu z regulaminem pracy.',
            owner: 'Kadry',
            dueDate: t.startDateFormatted,
            legalRef: 'art. 29 § 2 i art. 86 § 3 KP',
          },
          {
            id: 'hr-5',
            title: 'Szkolenie wstępne BHP (instruktaż ogólny i stanowiskowy)',
            description:
              'Przeprowadzenie instruktażu ogólnego przez służbę BHP oraz instruktażu stanowiskowego przez Marka. Zapoznanie z zasadami BHP pracy zdalnej i ergonomii stanowiska komputerowego.',
            owner: 'BHP / Marek',
            dueDate: t.startDateFormatted,
            legalRef: 'art. 237³ § 2 KP',
          },
          {
            id: 'hr-6',
            title: 'Nadanie upoważnienia do przetwarzania danych osobowych (RODO)',
            description:
              'Podpisanie imiennego upoważnienia do przetwarzania danych kadrowo-płacowych oraz zobowiązania do zachowania poufności (w tym danych szczególnych kategorii, np. zwolnień lekarskich).',
            owner: 'Kadry / IOD',
            dueDate: t.startDateFormatted,
            legalRef: 'art. 29 RODO',
          },
        ],
      },
      {
        id: 'hr-day7',
        title: 'Do 7 dni od startu',
        deadlineLabel: `do ${t.plus7CalendarDays}`,
        tasks: [
          {
            id: 'hr-7',
            title: 'Zgłoszenie do ubezpieczeń społecznych i zdrowotnego (ZUS ZUA)',
            description:
              'Wysłanie formularza ZUS ZUA przez Płatnika/PUE ZUS z kodem tytułu ubezpieczenia 01 10 xx w ustawowym, nieprzekraczalnym terminie 7 dni od daty powstania obowiązku.',
            owner: 'Kadry i Płace',
            dueDate: t.plus7CalendarDays,
            legalRef: 'art. 36 ust. 4 ustawy o SUS',
          },
          {
            id: 'hr-8',
            title: 'Przekazanie informacji o warunkach zatrudnienia',
            description:
              'Wydanie pisemnej lub elektronicznej informacji o normach czasu pracy, wymiarze urlopu, terminach wypłaty wynagrodzenia, polityce szkoleń i instytucjach zabezpieczenia społecznego.',
            owner: 'Kadry',
            dueDate: t.plus7CalendarDays,
            legalRef: 'art. 29 § 3 KP',
          },
          {
            id: 'hr-9',
            title: 'Założenie teczki akt osobowych (części A i B)',
            description:
              'Kompletowanie i zindeksowanie dokumentów rekrutacyjnych (część A) oraz dokumentów związanych z nawiązaniem stosunku pracy (część B), w tym karty szkolenia BHP i orzeczenia lekarskiego.',
            owner: 'Kadry',
            dueDate: t.plus7CalendarDays,
            legalRef: 'Rozp. MRPiPS ws. dokumentacji pracowniczej',
          },
        ],
      },
      {
        id: 'hr-day30',
        title: 'Do 30 dni',
        deadlineLabel: `do ${t.plus30CalendarDays}`,
        tasks: [
          {
            id: 'hr-10',
            title: 'Weryfikacja PPK oraz dofinansowania okularów korekcyjnych',
            description:
              'Przekazanie informacji o zasadach PPK (zapis automatyczny po 3 miesiącach lub wcześniejszy wniosek) oraz procedury refundacji okularów/soczewek korekcyjnych przy zaleceniu lekarza medycyny pracy.',
            owner: 'Kadry i Płace',
            dueDate: t.plus30CalendarDays,
            legalRef: 'Ustawa o PPK / Rozp. BHP monitory',
          },
          {
            id: 'hr-11',
            title: 'Pierwsze rozliczenie czasu pracy i weryfikacja listy płac',
            description:
              'Sprawdzenie poprawności naliczenia pierwszego wynagrodzenia, ryczałtu za pracę zdalną w trybie hybrydowym, zastosowania PIT-2 oraz salda urlopowego w systemie kadrowym.',
            owner: 'Kadry i Płace',
            dueDate: t.plus30CalendarDays,
          },
        ],
      },
    ],
    itStages: [
      {
        id: 'it-pre',
        title: 'Przygotowanie przed startem',
        deadlineLabel: `do ${t.preboarding3WorkDaysBefore}`,
        tasks: [
          {
            id: 'it-1',
            title: 'Konto służbowe, poczta e-mail i komunikator z MFA',
            description:
              'Utworzenie konta w domenie firmowej (Google Workspace / Microsoft 365), dodanie do grup działu Kadr i Płac oraz wymuszenie uwierzytelniania dwuskładnikowego (MFA).',
            owner: 'IT',
            dueDate: t.preboarding5WorkDaysBefore,
          },
          {
            id: 'it-2',
            title: 'Konfiguracja laptopa z szyfrowaniem dysku i VPN',
            description:
              'Przygotowanie laptopa służbowego z zaszyfrowanym dyskiem (BitLocker/FileVault), klientem VPN do bezpiecznej pracy zdalnej oraz pakietem biurowym z obsługą arkuszy kalkulacyjnych.',
            owner: 'IT',
            dueDate: t.preboarding3WorkDaysBefore,
          },
          {
            id: 'it-3',
            title: 'Nadanie uprawnień do systemu kadrowo-płacowego i PUE ZUS',
            description:
              'Założenie konta z rolą specjalisty w systemie kadrowo-płacowym (np. enova365 / Comarch Optima / Teta), systemie wniosków urlopowych oraz przygotowanie pełnomocnictwa PUE ZUS (ZUS PEL).',
            owner: 'IT / Marek',
            dueDate: t.preboarding1WorkDayBefore,
          },
          {
            id: 'it-4',
            title: 'Przygotowanie biurka w biurze i karty dostępu',
            description:
              'Wyznaczenie stanowiska dla dni stacjonarnych (zewnętrzny monitor, podkładka, ergonomiczne krzesło), wyrobienie karty dostępu do biura oraz strefy archiwum akt osobowych.',
            owner: 'Administracja',
            dueDate: t.preboarding1WorkDayBefore,
          },
        ],
      },
      {
        id: 'it-day1',
        title: '1. dzień — przekazanie i konfiguracja',
        deadlineLabel: t.startDateFormatted,
        tasks: [
          {
            id: 'it-5',
            title: 'Wydanie sprzętu służbowego i podpisanie protokołu powierzenia',
            description:
              'Przekazanie laptopa, zasilacza, słuchawek i karty dostępu wraz z obustronnym podpisaniem protokołu zdawczo-odbiorczego z numerami seryjnymi.',
            owner: 'IT / Administracja',
            dueDate: t.startDateFormatted,
          },
          {
            id: 'it-6',
            title: 'Test logowania VPN, menedżera haseł i szyfrowanego obiegu dokumentów',
            description:
              'Pierwsze logowanie przy wsparciu IT: sprawdzenie połączenia VPN przed pierwszym dniem pracy zdalnej, konfiguracja menedżera haseł oraz bezpiecznego wysyłania pasków płacowych.',
            owner: 'IT',
            dueDate: t.startDateFormatted,
          },
        ],
      },
    ],
    weekOnePlan: [
      {
        dayNumber: 1,
        dateLabel: t.weekOneDates[0],
        focus: 'Formalności, sprzęt i pierwsze spotkanie z zespołem',
        activities: [
          { timeSlot: '09:00 – 10:00', title: 'Powitanie w biurze, podpisanie dokumentów kadrowych i odbiór karty dostępu', lead: 'Kadry' },
          { timeSlot: '10:00 – 11:30', title: 'Odbiór laptopa, pierwsze logowanie, konfiguracja MFA i VPN', lead: 'IT' },
          { timeSlot: '11:30 – 13:00', title: 'Szkolenie wstępne BHP (ogólne i stanowiskowe) oraz zasady RODO w dziale', lead: 'BHP / Marek' },
          { timeSlot: '14:00 – 15:30', title: 'Rozmowa wprowadzająca z przełożonym: zakres odpowiedzialności, kalendarz płacowy i przedstawienie Buddy’ego', lead: 'Marek' },
        ],
      },
      {
        dayNumber: 2,
        dateLabel: t.weekOneDates[1],
        focus: 'Architektura procesów kadrowych i system kadrowo-płacowy',
        activities: [
          { timeSlot: '09:30 – 11:30', title: 'Przegląd struktury akt osobowych, wzorów umów i procedury zatrudniania', lead: 'Buddy' },
          { timeSlot: '12:00 – 14:00', title: 'Wprowadzenie do systemu kadrowo-płacowego: kartoteki pracowników, absencje, limity urlopowe', lead: 'Buddy' },
          { timeSlot: '14:30 – 16:00', title: 'Samodzielne przejrzenie regulaminu pracy, regulaminu wynagradzania i polityki pracy zdalnej', lead: 'Anna' },
        ],
      },
      {
        dayNumber: 3,
        dateLabel: t.weekOneDates[2],
        focus: 'Ewidencja czasu pracy, ZUS i obieg wniosków',
        activities: [
          { timeSlot: '09:30 – 11:30', title: 'Obsługa zwolnień lekarskich (e-ZLA na PUE ZUS), wniosków urlopowych i nadgodzin', lead: 'Buddy' },
          { timeSlot: '12:00 – 13:30', title: 'Spotkanie z działem księgowości: harmonogram księgowania list płac i rozliczeń ZUS/US', lead: 'Główny Księgowy' },
          { timeSlot: '14:00 – 16:00', title: 'Praca w parze: przygotowanie testowego kompletu dokumentów dla nowego zatrudnienia', lead: 'Buddy' },
        ],
      },
      {
        dayNumber: 4,
        dateLabel: t.weekOneDates[3],
        focus: 'Pierwszy dzień w trybie zdalnym i naliczanie płac',
        activities: [
          { timeSlot: '09:00 – 09:30', title: 'Test pracy zdalnej (VPN, komunikator) i krótka synchronizacja z zespołem', lead: 'Marek' },
          { timeSlot: '10:00 – 12:30', title: 'Omówienie składników płacowych, premii, PPK, potrąceń oraz świadczeń z ZFŚS / benefitów', lead: 'Buddy' },
          { timeSlot: '13:30 – 15:30', title: 'Analiza kalendarza rozliczeń miesięcznych (DRA, PIT-4R, GUS, PFRON)', lead: 'Anna' },
        ],
      },
      {
        dayNumber: 5,
        dateLabel: t.weekOneDates[4],
        focus: 'Pierwsze samodzielne zadania i podsumowanie tygodnia',
        activities: [
          { timeSlot: '09:30 – 11:30', title: 'Samodzielna weryfikacja bieżących zaświadczeń o zatrudnieniu i aktualizacji danych pracowników (pod opieką Buddy’ego)', lead: 'Anna / Buddy' },
          { timeSlot: '12:00 – 13:30', title: 'Przegląd najczęstszych pytań pracowników na skrzynce kadrowej i standardów odpowiedzi', lead: 'Buddy' },
          { timeSlot: '14:30 – 15:30', title: 'Podsumowanie 1. tygodnia 1:1 z Markiem: pytania, brakujące dostępy i priorytety na kolejne 3 tygodnie', lead: 'Marek' },
        ],
      },
    ],
    goals306090: [
      {
        period: '30 dni',
        targetDate: t.plus30CalendarDays,
        headline: 'Opanowanie bieżącej obsługi kadrowej i narzędzi',
        milestones: [
          'Samodzielna obsługa dokumentacji zatrudnienia i zwolnień (umowy, aneksy, świadectwa pracy) w uzgodnieniu z Buddym.',
          'Bieżące prowadzenie ewidencji czasu pracy, absencji (e-ZLA, urlopy) i pilnowanie terminów badań lekarskich oraz szkoleń BHP.',
          'Udział w pełnym cyklu zamknięcia pierwszego miesiąca płacowego w roli obserwatora i wsparcia weryfikacyjnego.',
        ],
        successMetric: 'Kompletna obsługa min. 10 bieżących spraw pracowniczych bez błędów formalnych oraz znajomość kalendarza kadrowo-płacowego.',
      },
      {
        period: '60 dni',
        targetDate: t.plus60CalendarDays,
        headline: 'Samodzielne naliczanie list płac i rozliczenia ZUS/US',
        milestones: [
          'Samodzielne przygotowanie listy płac dla przypisanej grupy pracowników (UoP oraz umowy cywilnoprawne) do akceptacji przełożonego.',
          'Przygotowanie i weryfikacja dokumentów rozliczeniowych ZUS (DRA/RCA/RSA), plików PPK oraz raportów do księgowości.',
          'Bieżące odpowiadanie na zapytania pracowników i menedżerów w zakresie prawa pracy i rozliczeń w uzgodnionym SLA.',
        ],
        successMetric: 'Terminowe i bezbłędne naliczenie pełnego cyklu płacowego zatwierdzone przez Marka przy pierwszym przeglądzie.',
      },
      {
        period: '90 dni',
        targetDate: t.plus90CalendarDays,
        headline: 'Pełna samodzielność procesowa i usprawnienia w dziale',
        milestones: [
          'Pełna odpowiedzialność za przypisany obszar kadrowo-płacowy, w tym terminowość zgłoszeń ZUS i kompletność akt osobowych.',
          'Przeprowadzenie wewnętrznego przeglądu wybranych teczek osobowych i aktualizacja przynajmniej jednego wzoru dokumentu lub instrukcji.',
          'Podsumowanie okresu próbnego z Markiem i ustalenie celów rozwojowych (np. zmiany w przepisach prawa pracy i podatków).',
        ],
        successMetric: 'Pozytywna ocena okresu próbnego, 100% terminowość deklaracji ustawowych oraz wdrożenie min. jednego usprawnienia dokumentacyjnego.',
      },
    ],
    messages: {
      welcomeEmail: {
        title: 'Mail powitalny dla nowego pracownika',
        sendDateLabel: `Wyślij ${t.preboarding3WorkDaysBefore} (3 dni robocze przed startem)`,
        recipientLabel: 'Do: Anna (prywatny adres e-mail)',
        subject: `Witamy na pokładzie — plan Twojego 1. dnia (${t.startDateFormatted})`,
        body: `Cześć Anno,

już wkrótce zaczynamy współpracę — czekamy na Ciebie w biurze w ${t.startDateFull} o godzinie 9:00.

Najważniejsze informacje na start:
• Miejsce spotkania: nasze biuro (recepcja na parterze) — przy wejściu odbierze Cię Marek, Twój przełożony.
• Co warto zabrać 1. dnia: dowód osobisty do wglądu przy podpisaniu umowy, oryginał orzeczenia od lekarza medycyny pracy (jeśli nie dostarczyłaś go wcześniej) oraz numer rachunku bankowego do wypłaty wynagrodzenia.
• Plan pierwszych godzin: zaczniemy od spokojnego dopełnienia formalności kadrowych i odbioru laptopa w IT, następnie przejdziesz szkolenie wstępne BHP, a po krótkiej przerwie porozmawiasz z Markiem o planie wdrożenia na pierwszy tydzień.
• Praca hybrydowa: pierwsze 3 dni zaplanowaliśmy w biurze, żeby wygodnie poznać zespół i skonfigurować sprzęt, a czwartek będzie pierwszym dniem pracy zdalnej.

Jeśli masz jakiekolwiek pytania przed startem lub potrzebujesz wsparcia w sprawach organizacyjnych, po prostu odpisz na tę wiadomość albo zadzwoń.

Do zobaczenia ${t.startDateFormatted}!

Pozdrawiam serdecznie,
Zespół HR`,
      },
      managerBrief: {
        title: 'Brief organizacyjny dla menedżera i Buddy’ego',
        sendDateLabel: `Wyślij ${t.preboarding5WorkDaysBefore} (5 dni roboczych przed startem)`,
        recipientLabel: 'Do: Marek (przełożony) i wyznaczony Buddy',
        subject: `Przygotowania do startu Anny (Specjalista ds. Kadr i Płac) — ${t.startDateFormatted}`,
        body: `Cześć Marku,

za kilka dni (${t.startDateFormatted}) do Działu Kadr i Płac dołącza Anna na stanowisko Specjalisty ds. Kadr i Płac (umowa o pracę, tryb hybrydowy). Poniżej krótka lista rzeczy, które warto dopiąć przed jej przyjściem:

Do zrobienia przed ${t.startDateFormatted}:
1. Potwierdź z IT zakres uprawnień dla Anny w systemie kadrowo-płacowym oraz przygotuj wniosek o pełnomocnictwo PUE ZUS.
2. Wyślij Annie w kalendarzu zaproszenia na kluczowe spotkania z 1. tygodnia (m.in. rozmowa startowa 1. dnia o 14:00, wprowadzenie z Buddym i podsumowanie tygodnia w piątek).
3. Przygotuj krótką listę 2–3 bezpiecznych, pierwszych spraw kadrowych do wspólnego przejścia z Buddym w 2. połowie pierwszego tygodnia.
4. Pamiętaj o przeprowadzeniu instruktażu stanowiskowego BHP 1. dnia — Kadry przekażą gotową kartę do podpisu.

Rola Buddy’ego w 1. tygodniu:
• Pomoc w poznaniu zespołu i codziennych zwyczajów (w tym zasad pracy hybrydowej).
• Przeprowadzenie przez strukturę akt osobowych, obieg wniosków i kalendarz zamknięcia miesiąca.
• Codzienne krótkie 15-minutowe sprawdzenie, czy wszystko jest jasne i czy nie brakuje dostępów.

W załączniku / w aplikacji dostępny jest pełny harmonogram 1. tygodnia oraz cele na 30-60-90 dni. Daj znać, jeśli chcesz wprowadzić w nim poprawki przed startem.

Pozdrawiam,
Zespół HR`,
      },
    },
    generatedAt: new Date().toISOString(),
    source: 'example',
  };
}
