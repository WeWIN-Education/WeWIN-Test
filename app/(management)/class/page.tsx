"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Mail,
  Phone,
  RefreshCw,
  Search,
  TrendingUp,
  UserRound,
} from "lucide-react";

interface StudentResult {
  id: string;
  name: string;
  email: string;
  score: string;
  writingBand: string;
  writingStatus: string;
  speakingBand: string;
  overallBand: string;
  lastUpdated: string;
  phone: string;
  consultant: string;
  ieltsNeed: string;
  selfScore: string;
  studyTime: string;
  startTime: string;
  finishTime: string;
  source: string;
  notes: string;
}

function displayValue(value: string | number | undefined) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function bandValue(value: string | number | undefined) {
  const n = Number(value || 0);
  return Number.isFinite(n) && n > 0 ? n.toFixed(1) : "N/A";
}

function bandTone(value: string | number | undefined) {
  const n = Number(value || 0);
  if (n >= 7) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (n >= 5.5) return "bg-blue-50 text-[#0E4BA9] border-blue-200";
  if (n >= 4) return "bg-amber-50 text-amber-700 border-amber-200";
  if (n > 0) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-500 border-slate-200";
}

function formatDate(value: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function ClassPage() {
  const [records, setRecords] = useState<StudentResult[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");

  const loadResults = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/final-list", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Không tải được Final_list.");
      }

      setRecords(Array.isArray(json.records) ? json.records : []);
      setSource(json.source || "");
    } catch (err: any) {
      setError(err?.message || "Không tải được danh sách học sinh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return records;

    return records.filter((record) =>
      [
        record.name,
        record.email,
        record.phone,
        record.consultant,
        record.ieltsNeed,
        record.id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [query, records]);

  const completedCount = records.filter(
    (record) => Number(record.overallBand || record.score || 0) > 0
  ).length;
  const averageOverall = completedCount
    ? records
        .map((record) => Number(record.overallBand || record.score || 0))
        .filter((value) => value > 0)
        .reduce((sum, value) => sum + value, 0) / completedCount
    : 0;
  const latest = records[0]?.finishTime || records[0]?.lastUpdated || "";

  return (
    <div className="min-h-[calc(80vh-60px)] bg-[#F3F8FC] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-[#8A5A1E]">
              WeWIN IELTS Placement Test
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-[#0E4BA9]">
              Student Test Results
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Danh sách học sinh đã nộp bài, lấy trực tiếp từ Final_list. Office
              có thể xem Overall và thông tin tư vấn nhanh tại đây.
            </p>
          </div>

          <button
            onClick={loadResults}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0E4BA9] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3F91] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile
            label="Total submissions"
            value={records.length.toString()}
            icon={<UserRound className="h-5 w-5" />}
          />
          <SummaryTile
            label="Completed overall"
            value={completedCount.toString()}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <SummaryTile
            label="Average overall"
            value={bandValue(averageOverall)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <SummaryTile
            label="Latest submit"
            value={formatDate(latest)}
            icon={<CalendarClock className="h-5 w-5" />}
            compact
          />
        </section>

        <section className="mt-6 rounded-lg border border-blue-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-blue-100 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Tested students
              </h2>
              <p className="text-sm text-slate-500">
                {filtered.length} học sinh đang hiển thị
                {source ? `, nguồn: ${source}` : ""}
              </p>
            </div>

            <label className="relative block w-full md:w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên, email, SĐT, tư vấn viên"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-[#0E4BA9] focus:bg-white focus:ring-2 focus:ring-[#0E4BA9]/15"
              />
            </label>
          </div>

          {error && (
            <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <ResultSkeleton />
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-[#0E4BA9]">
                <UserRound className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                Chưa có dữ liệu phù hợp
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Khi học sinh nộp bài, kết quả Overall sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                  <thead className="bg-[#0E4BA9] text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Student</th>
                      <th className="px-4 py-3 font-semibold">Contact</th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Overall
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Writing
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Speaking
                      </th>
                      <th className="px-4 py-3 font-semibold">Consulting</th>
                      <th className="px-4 py-3 font-semibold">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((record) => (
                      <tr key={record.id || record.email} className="hover:bg-blue-50/50">
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900">
                            {displayValue(record.name)}
                          </div>
                          <div className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                            {displayValue(record.id)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <ContactLine icon={<Mail />} value={record.email} />
                          <ContactLine icon={<Phone />} value={record.phone} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <BandBadge value={record.overallBand || record.score} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <BandBadge value={record.writingBand} />
                          {record.writingStatus && (
                            <div className="mt-1 text-xs text-slate-500">
                              {record.writingStatus}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <BandBadge value={record.speakingBand} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-[#0E4BA9]">
                            {displayValue(record.consultant)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Need: {displayValue(record.ieltsNeed)}
                          </div>
                          <div className="text-xs text-slate-500">
                            Self: {displayValue(record.selfScore)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-700">
                            {formatDate(record.finishTime || record.lastUpdated)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {displayValue(record.studyTime)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 lg:hidden">
                {filtered.map((record) => (
                  <article
                    key={record.id || record.email}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {displayValue(record.name)}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {displayValue(record.email)}
                        </p>
                      </div>
                      <BandBadge value={record.overallBand || record.score} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <MiniField label="Writing" value={bandValue(record.writingBand)} />
                      <MiniField label="Speaking" value={bandValue(record.speakingBand)} />
                      <MiniField label="Phone" value={displayValue(record.phone)} />
                      <MiniField label="Consultant" value={displayValue(record.consultant)} />
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Submitted: {formatDate(record.finishTime || record.lastUpdated)}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  icon,
  compact,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </div>
          <div
            className={`mt-2 font-extrabold text-[#0E4BA9] ${
              compact ? "text-base" : "text-3xl"
            }`}
          >
            {value}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F2FF] text-[#0E4BA9]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function BandBadge({ value }: { value: string | number | undefined }) {
  return (
    <span
      className={`inline-flex min-w-16 items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-extrabold ${bandTone(
        value
      )}`}
    >
      {bandValue(value)}
    </span>
  );
}

function ContactLine({
  icon,
  value,
}: {
  icon: React.ReactElement;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className="text-[#0E4BA9] [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      <span className="max-w-[230px] truncate">{displayValue(value)}</span>
    </div>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg bg-slate-100"
        />
      ))}
    </div>
  );
}
