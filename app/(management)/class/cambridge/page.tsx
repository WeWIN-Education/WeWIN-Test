"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  Mail,
  Mic,
  Phone,
  RefreshCw,
  Search,
  Star,
  UserRound,
} from "lucide-react";

interface CambridgeResult {
  id: string;
  submitTime: string;
  name: string;
  birthDate: string;
  location: string;
  phone: string;
  email: string;
  consultant: string;
  level: string;
  prompt1: string;
  audioLink1: string;
  transcript1: string;
  prompt2: string;
  audioLink2: string;
  transcript2: string;
  score: string;
  levelFit: string;
  englishFeedback: string;
  vietnameseFeedback: string;
  recommendation: string;
  status: string;
  lastUpdated: string;
}

function displayValue(value: string | number | undefined) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function scoreValue(value: string | number | undefined) {
  const n = Number(value || 0);
  return Number.isFinite(n) && n > 0 ? n.toFixed(1) : "N/A";
}

function scoreTone(value: string | number | undefined) {
  const n = Number(value || 0);
  if (n >= 4) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (n >= 3) return "bg-blue-50 text-[#0E4BA9] border-blue-200";
  if (n >= 2) return "bg-amber-50 text-amber-700 border-amber-200";
  if (n > 0) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-500 border-slate-200";
}

function statusTone(value: string | undefined) {
  const text = String(value || "").toLowerCase();
  if (text.includes("done")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (text.includes("error")) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function fetchCambridgeResults() {
  const res = await fetch("/api/admin/cambridge-speaking", { cache: "no-store" });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || "Cannot load Speaking_Cambridge.");
  }

  return {
    records: Array.isArray(json.records) ? json.records : [],
    source: String(json.source || ""),
  };
}

export default function CambridgeResultsPage() {
  const [records, setRecords] = useState<CambridgeResult[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");

  const loadResults = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError("");
    }

    try {
      const data = await fetchCambridgeResults();
      setRecords(data.records);
      setSource(data.source);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Cannot load Cambridge results."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialResults = async () => {
      try {
        const data = await fetchCambridgeResults();
        if (cancelled) return;
        setRecords(data.records);
        setSource(data.source);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Cannot load Cambridge results."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialResults();

    return () => {
      cancelled = true;
    };
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
        record.level,
        record.levelFit,
        record.status,
        record.id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [query, records]);

  const scored = records
    .map((record) => Number(record.score || 0))
    .filter((value) => value > 0);
  const averageScore = scored.length
    ? scored.reduce((sum, value) => sum + value, 0) / scored.length
    : 0;
  const latest = records[0]?.submitTime || records[0]?.lastUpdated || "";

  return (
    <div className="min-h-[calc(80vh-60px)] bg-[#F3F8FC] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-[#8A5A1E]">
              WeWIN Cambridge Speaking
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-[#0E4BA9]">
              Cambridge Results
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Records from Speaking_Cambridge, including score, level fit,
              contact details, consultant, and audio links.
            </p>
          </div>

          <button
            onClick={() => loadResults()}
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
            label="Scored tests"
            value={scored.length.toString()}
            icon={<Star className="h-5 w-5" />}
          />
          <SummaryTile
            label="Average score"
            value={scoreValue(averageScore)}
            icon={<Star className="h-5 w-5" />}
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
                Cambridge submissions
              </h2>
              <p className="text-sm text-slate-500">
                {filtered.length} records displayed
                {source ? `, source: ${source}` : ""}
              </p>
            </div>

            <label className="relative block w-full md:w-[420px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, phone, level, consultant"
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
                <Mic className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No Cambridge records found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                New Cambridge speaking submissions will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1240px] border-collapse text-left text-sm">
                  <thead className="bg-[#0E4BA9] text-white">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Student</th>
                      <th className="px-4 py-3 font-semibold">Contact</th>
                      <th className="px-4 py-3 text-center font-semibold">Level</th>
                      <th className="px-4 py-3 text-center font-semibold">Score</th>
                      <th className="px-4 py-3 font-semibold">Level fit</th>
                      <th className="px-4 py-3 font-semibold">Consultant</th>
                      <th className="px-4 py-3 font-semibold">Audio</th>
                      <th className="px-4 py-3 font-semibold">Submitted</th>
                      <th className="px-4 py-3 text-center font-semibold">Status</th>
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
                          <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-[#0E4BA9]">
                            {displayValue(record.level)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ScoreBadge value={record.score} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-[220px] font-semibold text-slate-800">
                            {displayValue(record.levelFit)}
                          </div>
                          <div className="mt-1 line-clamp-2 max-w-[260px] text-xs text-slate-500">
                            {displayValue(record.recommendation)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-[#0E4BA9]">
                            {displayValue(record.consultant)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {displayValue(record.location)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <AudioLink href={record.audioLink1} label="Prompt 1" />
                          <AudioLink href={record.audioLink2} label="Prompt 2" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-700">
                            {formatDate(record.submitTime || record.lastUpdated)}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <StatusBadge value={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 xl:hidden">
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
                      <ScoreBadge value={record.score} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <MiniField label="Level" value={displayValue(record.level)} />
                      <MiniField label="Fit" value={displayValue(record.levelFit)} />
                      <MiniField label="Phone" value={displayValue(record.phone)} />
                      <MiniField label="Consultant" value={displayValue(record.consultant)} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <AudioLink href={record.audioLink1} label="Prompt 1" />
                      <AudioLink href={record.audioLink2} label="Prompt 2" />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span>
                        Submitted: {formatDate(record.submitTime || record.lastUpdated)}
                      </span>
                      <StatusBadge value={record.status} />
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

function ScoreBadge({ value }: { value: string | number | undefined }) {
  return (
    <span
      className={`inline-flex min-w-16 items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-extrabold ${scoreTone(
        value
      )}`}
    >
      {scoreValue(value)}
    </span>
  );
}

function StatusBadge({ value }: { value: string | undefined }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-bold ${statusTone(
        value
      )}`}
    >
      {displayValue(value)}
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

function AudioLink({ href, label }: { href: string; label: string }) {
  if (!href) {
    return <div className="text-xs text-slate-400">{label}: no audio</div>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mb-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-[#0E4BA9] transition hover:bg-blue-50"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
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
