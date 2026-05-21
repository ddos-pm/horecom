"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return { days, hours, mins, secs };
}

export function LiveCountdown({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime();
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="gb-time">
      <div className="cell">
        <div className="n">{pad(t.days)}</div>
        <div className="l">{t.days === 1 ? "день" : "дня"}</div>
      </div>
      <div className="cell">
        <div className="n">{pad(t.hours)}</div>
        <div className="l">часов</div>
      </div>
      <div className="cell">
        <div className="n">{pad(t.mins)}</div>
        <div className="l">мин</div>
      </div>
      <div className="cell">
        <div className="n">{pad(t.secs)}</div>
        <div className="l">сек</div>
      </div>
    </div>
  );
}
