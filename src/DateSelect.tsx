import { useEffect, useState } from "react";

type DateSelectProps = {
  value: string;
  onChange: (value: string) => void;
  yearsBack?: number;
  yearsForward?: number;
};

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const parseDate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return {
    year: y || undefined,
    month: m || undefined,
    day: d || undefined
  };
};

function DateSelect({ value, onChange, yearsBack = 1, yearsForward = 1 }: DateSelectProps) {
  const years = Array.from({ length: yearsBack + yearsForward + 1 }, (_, i) => CURRENT_YEAR - yearsBack + i);
  const [year, setYear] = useState<number | undefined>(() => parseDate(value).year);
  const [month, setMonth] = useState<number | undefined>(() => parseDate(value).month);
  const [day, setDay] = useState<number | undefined>(() => parseDate(value).day);

  useEffect(() => {
    const parsed = parseDate(value);
    setYear(parsed.year);
    setMonth(parsed.month);
    setDay(parsed.day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const dayOptions = Array.from({ length: daysInMonth(year ?? CURRENT_YEAR, month ?? 1) }, (_, i) => i + 1);

  const updatePart = (part: "year" | "month" | "day", raw: string) => {
    const parsedValue = raw === "" ? undefined : Number(raw);
    const nextYear = part === "year" ? parsedValue : year;
    const nextMonth = part === "month" ? parsedValue : month;
    const nextDay = part === "day" ? parsedValue : day;
    setYear(nextYear);
    setMonth(nextMonth);
    setDay(nextDay);
    if (nextYear && nextMonth && nextDay) {
      const clampedDay = Math.min(nextDay, daysInMonth(nextYear, nextMonth));
      onChange(`${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`);
    } else {
      onChange("");
    }
  };

  return (
    <div className="birthdate-select-row">
      <select value={year ?? ""} onChange={(event) => updatePart("year", event.target.value)}>
        <option value="">年</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}年
          </option>
        ))}
      </select>
      <select value={month ?? ""} onChange={(event) => updatePart("month", event.target.value)}>
        <option value="">月</option>
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            {m}月
          </option>
        ))}
      </select>
      <select value={day ?? ""} onChange={(event) => updatePart("day", event.target.value)}>
        <option value="">日</option>
        {dayOptions.map((d) => (
          <option key={d} value={d}>
            {d}日
          </option>
        ))}
      </select>
    </div>
  );
}

export default DateSelect;
