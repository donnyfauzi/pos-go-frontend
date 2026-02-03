import { useState, useEffect } from 'react';

const locale = 'id-ID';
const dateOptions: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};
const timeOptions: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
};

export default function DateTimeWidget() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString(locale, dateOptions);
  const timeStr = now.toLocaleTimeString(locale, timeOptions);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-sm text-gray-600">
      <span>{dateStr}</span>
      <span className="hidden sm:inline text-gray-300">·</span>
      <span className="tabular-nums font-medium text-gray-800">{timeStr}</span>
    </div>
  );
}
