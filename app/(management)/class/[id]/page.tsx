"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, GraduationCap, UserCheck } from "lucide-react";
import { initialData } from "@/app/constants/class";
import { Routes } from "@/app/constants/routes";
import LearningResources, {
  BackButton,
  ClassHeader,
  ScheduleCard,
  StatCard,
  StudentRow,
} from "@/app/components/classDetail";
import { Pagination } from "@/app/components/pagination";
import { calculateAge } from "@/app/utils/date";

export default function ClassDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const classData = initialData.find((c) => c.id === id);

  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(5);
  const [selectedRows, setSelectedRows] = useState<"all" | number>(5);

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50 p-8 font-[Lexend]">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Class Not Found
          </h2>
          <p className="text-gray-600">
            The class with ID "{id}" does not exist.
          </p>
          <button
            onClick={() => router.push(Routes.MANAGE_CLASS)}
            className="mt-6 px-6 py-2 bg-[#0E4BA9] text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  const activeStudents = classData.students.filter(
    (s) => s.status === "Active"
  ).length;
  const inactiveStudents = classData.students.filter(
    (s) => s.status === "Inactive"
  ).length;

  const totalStudents = classData.students.length;
  const totalPages = Math.ceil(totalStudents / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = classData.students.slice(startIndex, endIndex);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const handleRowsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === "all" ? "all" : Number(e.target.value);
    setSelectedRows(val);
    setStudentsPerPage(val === "all" ? totalStudents : Number(val));
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 md:p-8 font-[Lexend]">
      <div className="max-w-8xl mx-auto">
        {/* 🔹 Back Button */}
        <div className="mb-4 sm:mb-6">
          <BackButton onClick={() => router.push(Routes.MANAGE_CLASS)} />
        </div>

        {/* 🔹 Class Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <ClassHeader
            name={classData.name}
            category={classData.category}
            id={classData.id}
          />

          {/* 🔹 Responsive Stat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 sm:p-8">
            <StatCard
              icon={Users}
              title="Total Students"
              value={classData.students.length}
              subtitle={
                <>
                  <span className="text-green-600 font-semibold">
                    {activeStudents} Active
                  </span>{" "}
                  ·{" "}
                  <span className="text-gray-500 ml-1">
                    {inactiveStudents} Inactive
                  </span>
                </>
              }
              gradient="bg-gradient-to-br from-emerald-50 to-teal-50"
              iconBg="bg-emerald-500"
              border="border-emerald-200"
            />

            <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Teachers</h3>
              </div>
              <p className="text-base sm:text-lg font-semibold text-gray-800">
                {classData.teacher1}
              </p>
              {classData.teacher2 && (
                <p className="text-base sm:text-lg font-semibold text-gray-800">
                  {classData.teacher2}
                </p>
              )}
            </div>

            <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-500 p-3 rounded-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Teaching Assistants
                </h3>
              </div>
              <p className="text-base sm:text-lg font-semibold text-gray-800">
                {classData.ta1 || "-"}
              </p>
              {classData.ta2 && (
                <p className="text-base sm:text-lg font-semibold text-gray-800">
                  {classData.ta2}
                </p>
              )}
            </div>

            <ScheduleCard schedule={classData.schedule} />
          </div>
        </div>

        {/* 🔹 Student List Section */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              Student List
            </h2>
            <span className="bg-blue-100 text-[#0E4BA9] px-4 py-1 rounded-full text-sm font-semibold w-fit">
              {classData.students.length} Students
            </span>
          </div>

          {/* 🔹 Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {["ID", "Name", "Age", "Gender", "Status", "Actions"].map(
                    (header) => (
                      <th
                        key={header}
                        className="text-left py-3 px-4 font-bold text-gray-700"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {currentStudents.map((student, index) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* 🔹 Mobile List */}
          <div className="block sm:hidden space-y-3">
            {currentStudents.map((stu, i) => (
              <div
                key={stu.id}
                className="border border-blue-100 rounded-xl shadow-sm p-4 bg-linear-to-br from-white to-blue-50"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[#0E4BA9] font-semibold">
                    {i + 1}. {stu.name}
                  </h3>
                  <span className="text-sm text-gray-500">{stu.gender}</span>
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  🎂 Age: {calculateAge(new Date(stu.dob))}
                </p>
                <p className="text-sm text-black">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`${
                      stu.status === "Active"
                        ? "text-green-600 font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    {stu.status}
                  </span>
                </p>
              </div>
            ))}
          </div>

          {/* 🔹 Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            totalStudents={totalStudents}
            selectedRows={selectedRows}
            onPrev={handlePrev}
            onNext={handleNext}
            onRowsChange={handleRowsChange}
          />

          {/* 🔹 Learning Resources Section */}
          {classData.resources && classData.resources.length > 0 && (
            <div className="mt-8">
              <LearningResources resources={classData.resources} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
