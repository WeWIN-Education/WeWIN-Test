import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

// Format date utilities
const formatDate = (date: Date | null): string => {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
};

// Custom Input Component
function NumericDateInput({ value, onClick }: any) {
  return (
    <div onClick={onClick} className="relative w-full cursor-pointer">
      <input
        type="text"
        value={value || ""}
        readOnly
        placeholder="dd/MM/yyyy"
        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  );
}

// DatePicker Component
interface DatePickerProps {
  label: string;
  name: string;
  value?: string;
  onChange: (name: string, value: string) => void;
  required?: boolean;
}

export default function ModernDatePicker({
  label,
  name,
  value,
  onChange,
  required,
}: DatePickerProps) {
  const [selected, setSelected] = useState<Date | null>(parseDate(value));
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());

  useEffect(() => {
    setSelected(parseDate(value));
  }, [value]);

  const handleDateClick = (date: Date) => {
    setSelected(date);
    onChange(name, formatDate(date));
    setIsOpen(false);
  };

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1924 + 1 },
    (_, i) => currentYear - i
  );

  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const startingDayOfWeek = firstDay.getDay(); // CN = 0
    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = prevLastDay.getDate();

    let days: {
      date: Date;
      inCurrentMonth: boolean;
    }[] = [];

    // 1️⃣ Thêm ngày tháng trước
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        inCurrentMonth: false,
      });
    }

    // 2️⃣ Thêm ngày tháng hiện tại
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        inCurrentMonth: true,
      });
    }

    // 3️⃣ Thêm ngày tháng sau cho đủ 42 ô
    while (days.length < 42) {
      const nextDay = days.length - (startingDayOfWeek + daysInMonth) + 1;
      days.push({
        date: new Date(year, month + 1, nextDay),
        inCurrentMonth: false,
      });
    }

    return days;
  };

  const days = getCalendarDays(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentMonth(newDate);
  };

  return (
    <div className="flex flex-col relative">
      <label className="block text-sm font-semibold text-[#0E4BA9] mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div onClick={() => setIsOpen(!isOpen)}>
        <NumericDateInput value={formatDate(selected)} />
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-80">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  changeMonth(-1);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <select
                  value={currentMonth.getMonth()}
                  onChange={(e) => {
                    const newDate = new Date(currentMonth);
                    newDate.setMonth(Number(e.target.value));
                    setCurrentMonth(newDate);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {monthNames.map((month, idx) => (
                    <option key={idx} value={idx}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={currentMonth.getFullYear()}
                  onChange={(e) => {
                    const newDate = new Date(currentMonth);
                    newDate.setFullYear(Number(e.target.value));
                    setCurrentMonth(newDate);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  changeMonth(1);
                }}
                disabled={currentMonth >= new Date()}
                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 px-3 py-2 border-b border-gray-100">
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-gray-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1 p-3">
              {days.map(({ date, inCurrentMonth }, idx) => {
                const isSelected = isSameDay(date, selected);
                const isToday = isSameDay(date, today);
                const isFuture = date > today;

                return (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isFuture) handleDateClick(date);

                      // Khi click ngày tháng trước → chuyển currentMonth về tháng đó
                      if (!inCurrentMonth) {
                        setCurrentMonth(
                          new Date(date.getFullYear(), date.getMonth(), 1)
                        );
                      }
                    }}
                    disabled={isFuture}
                    className={`
                    aspect-square rounded-lg text-sm font-medium transition-all
                    ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md"
                        : isToday
                        ? "bg-blue-50 text-blue-600 border-2 border-blue-600"
                        : isFuture
                        ? "text-gray-300 cursor-not-allowed"
                        : inCurrentMonth
                        ? "text-gray-700 hover:bg-blue-50"
                        : "text-gray-400 hover:bg-blue-50" // tháng cũ nhưng click được
                    }
                  `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Today button */}
            <div className="px-3 pb-3 pt-2 border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const today = new Date();
                  setCurrentMonth(today);
                  handleDateClick(today);
                }}
                className="w-full py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                Hôm nay
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
