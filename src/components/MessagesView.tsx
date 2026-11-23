import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { MessageTemplate } from '../types/onboarding';

interface MessagesViewProps {
  welcomeEmail: MessageTemplate;
  managerBrief: MessageTemplate;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function MessageBlock({
  template,
  id,
}: {
  template: MessageTemplate;
  id: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const fullText = `Temat: ${template.subject}\n\n${template.body}`;
    const ok = await copyTextToClipboard(fullText);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <article aria-labelledby={`msg-${id}`} className="py-6 first:pt-0 last:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <h3 id={`msg-${id}`} className="text-base font-semibold text-[#111318]">
            {template.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#525B6B]">
            <span className="font-mono tabular-nums text-[#1E3A8A]">{template.sendDateLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{template.recipientLabel}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors duration-150 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] ${
            copied
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#0F6B54]'
              : 'bg-white border-[#D4DAE3] text-[#111318] hover:bg-[#F6F7F9]'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Skopiowano treść</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 shrink-0 text-[#525B6B]" aria-hidden="true" />
              <span>Kopiuj treść</span>
            </>
          )}
        </button>
      </div>

      {/* Email preview surface */}
      <div className="bg-[#F8F9FB] border border-[#E2E6EC] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#E2E6EC] text-xs flex items-baseline gap-2">
          <span className="text-[#647082] shrink-0">Temat:</span>
          <span className="font-medium text-[#111318]">{template.subject}</span>
        </div>
        <div className="px-4 py-4 text-sm text-[#222834] leading-relaxed whitespace-pre-line">
          {template.body}
        </div>
      </div>
    </article>
  );
}

export function MessagesView({ welcomeEmail, managerBrief }: MessagesViewProps) {
  return (
    <div className="divide-y divide-[#E2E6EC]">
      <MessageBlock id="welcome" template={welcomeEmail} />
      <MessageBlock id="manager" template={managerBrief} />
    </div>
  );
}
