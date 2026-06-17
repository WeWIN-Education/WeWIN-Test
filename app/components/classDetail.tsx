import {
  ArrowLeft,
  Calendar,
  Eye,
  Edit,
  Ban,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { calculateAge } from "../utils/date";

export const ACTIONS = [
  { icon: Eye, color: "bg-blue-500 hover:bg-blue-600", label: "View" },
  { icon: Edit, color: "bg-yellow-500 hover:bg-yellow-600", label: "Edit" },
  { icon: Ban, color: "bg-orange-500 hover:bg-orange-600", label: "Delete" },
];

// 🔹 Back Button
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-[#0E4BA9] hover:text-blue-700 mb-4 sm:mb-6 
                 transition-all duration-200 hover:-translate-x-1"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="font-medium text-sm sm:text-base">Back to Classes</span>
    </button>
  );
}

// 🔹 Class Header
export function ClassHeader({
  name,
  category,
  id,
}: {
  name: string;
  category: string;
  id: string;
}) {
  return (
    <div
      className="bg-linear-to-r from-[#0E4BA9] to-blue-600 
                    p-5 sm:p-8 text-white rounded-xl sm:rounded-2xl 
                    flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
    >
      <div className="flex-1 text-center sm:text-left">
        <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">{name}</h1>
        <p className="text-blue-100 text-base sm:text-lg">{category}</p>
      </div>
      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-center sm:text-right">
        <p className="text-xs sm:text-sm font-medium">Class ID</p>
        <p className="text-lg sm:text-xl font-bold">{id}</p>
      </div>
    </div>
  );
}

// 🔹 Stat Card
export function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  gradient,
  iconBg,
  border,
}: {
  icon: any;
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  gradient: string;
  iconBg: string;
  border: string;
}) {
  return (
    <div
      className={`${gradient} rounded-xl p-4 sm:p-6 border ${border} 
                  flex flex-col justify-between h-full transition hover:shadow-md`}
    >
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <div className={`${iconBg} p-2 sm:p-3 rounded-lg`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-800">
          {title}
        </h3>
      </div>
      <p className="text-3xl sm:text-4xl font-bold text-emerald-600">{value}</p>
      {subtitle && (
        <div className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
          {subtitle}
        </div>
      )}
    </div>
  );
}

// 🔹 Schedule Card
export function ScheduleCard({ schedule }: { schedule: string | string[] }) {
  const scheduleItems = Array.isArray(schedule)
    ? schedule
    : schedule.split(";").map((s) => s.trim());

  return (
    <div
      className="bg-linear-to-br from-blue-50 to-indigo-50 
                    rounded-xl p-4 sm:p-6 border border-blue-200 w-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-500 p-2 sm:p-3 rounded-lg">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-800">
          Class Schedule
        </h3>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {scheduleItems.map((time, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-2 sm:p-3 border-l-4 border-[#0E4BA9] shadow-sm"
          >
            <p className="text-gray-800 font-semibold text-xs sm:text-sm">
              {time}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 🔹 Student Row
export function StudentRow({
  student,
  index,
}: {
  student: any;
  index: number;
}) {
  return (
    <tr
      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
      }`}
    >
      <td className="py-3 px-3 sm:py-4 sm:px-4 text-xs sm:text-sm font-medium text-[#0E4BA9]">
        {student.id}
      </td>
      <td className="py-3 px-3 sm:py-4 sm:px-4 text-xs sm:text-sm font-semibold text-gray-800">
        {student.name}
      </td>
      <td className="py-3 px-3 sm:py-4 sm:px-4 text-xs sm:text-sm text-gray-600">
        {calculateAge(new Date(student.dob))}
      </td>
      <td className="py-3 px-3 sm:py-4 sm:px-4 text-xs sm:text-sm text-gray-600">
        {student.gender}
      </td>
      <td className="py-3 px-3 sm:py-4 sm:px-4">
        <span
          className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
            student.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {student.status}
        </span>
      </td>
      <td className="py-3 px-3 sm:py-4 sm:px-4">
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {ACTIONS.map(({ icon: Icon, color, label }) => (
            <button
              key={label}
              onClick={() => alert(`${label} student: ${student.name}`)}
              className={`p-1.5 sm:p-2 rounded-lg text-white shadow-sm transition ${color} hover:scale-105 active:scale-95`}
            >
              <Icon size={14} className="sm:w-4 sm:h-4" />
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}

// 🔹 Learning Resources
interface Resource {
  id: string;
  title: string;
  type: string;
  link: string;
  description?: string;
}

export default function LearningResources({
  resources,
}: {
  resources: Resource[];
}) {
  if (!resources?.length) return null;

  return (
    <div className="mt-8 sm:mt-10 bg-white rounded-2xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 sm:gap-0">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#0E4BA9]" />
          Learning Resources
        </h2>
        <span className="bg-blue-100 text-[#0E4BA9] px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold">
          {resources.length} Resources
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {resources.map((r) => (
          <a
            key={r.id}
            href={r.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 
                       p-4 sm:p-5 hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-[#0E4BA9] bg-white/50 px-3 py-1 rounded-full">
                {r.type}
              </span>
              <ExternalLink size={14} className="sm:w-4 sm:h-4 text-gray-500" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
              {r.title}
            </h3>
            {r.description && (
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                {r.description}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
