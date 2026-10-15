import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadTrackingScripts, setTrackingEnabled } from "@/lib/tracking";

type ConsentChoice = "accepted" | "rejected" | null;
interface ConsentContextValue {
  choice: ConsentChoice;
  openSettings: () => void;
  setChoice: (choice: ConsentChoice) => void;
}
const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);
const KEY = "wardity-cookie-consent";

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ConsentChoice>(() => localStorage.getItem(KEY) as ConsentChoice);
  const setChoice = (next: ConsentChoice) => {
    setChoiceState(next);
    if (next) localStorage.setItem(KEY, next); else localStorage.removeItem(KEY);
    setTrackingEnabled(next === "accepted");
    if (next === "accepted") loadTrackingScripts();
  };
  useEffect(() => { setTrackingEnabled(choice === "accepted"); if (choice === "accepted") loadTrackingScripts(); }, [choice]);
  return <ConsentContext.Provider value={{ choice, openSettings: () => setChoice(null), setChoice }}>{children}<ConsentBanner /></ConsentContext.Provider>;
}

function ConsentBanner() {
  const context = useContext(ConsentContext);
  const [customizing, setCustomizing] = useState(false);
  if (!context || context.choice) return null;
  return <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-white p-5 shadow-2xl dark:bg-gray-900" dir={document.documentElement.dir}>
    <h2 className="font-serif text-lg font-bold text-gray-900 dark:text-white">Your privacy matters</h2>
    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">We use optional marketing and analytics cookies to improve Wardity. / نستخدم ملفات اختيارية لتحسين تجربتك.</p>
    {customizing && <p className="mt-2 text-xs text-gray-500">Marketing and analytics are optional and remain off unless you accept.</p>}
    <div className="mt-4 flex flex-wrap gap-2">
      <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={() => context.setChoice("accepted")}>Accept all / قبول الكل</button>
      <button className="rounded-full border border-gray-300 px-4 py-2 text-sm" onClick={() => context.setChoice("rejected")}>Reject / رفض</button>
      <button className="rounded-full border border-primary px-4 py-2 text-sm text-primary" onClick={() => setCustomizing((value) => !value)}>Customize / تخصيص</button>
    </div>
  </div>;
}

export function useConsent(): ConsentContextValue {
  const value = useContext(ConsentContext);
  if (!value) throw new Error("useConsent must be used within ConsentProvider");
  return value;
}
