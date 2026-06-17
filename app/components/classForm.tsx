"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CirclePlus, Pencil, X } from "lucide-react";
import { categoryOptions, Class } from "@/app/constants/class";

interface EditClassFormProps {
  cls?: Class | null;
  isAddMode?: boolean;
  onSave: (updated: Class) => void;
  onCancel: () => void;
}

export default function EditClassForm({
  cls,
  isAddMode = false,
  onSave,
  onCancel,
}: EditClassFormProps) {
  const [formData, setFormData] = useState({
    name: cls?.name || "",
    category: cls?.category || "",
    teacher1: cls?.teacher1 || "",
    teacher2: cls?.teacher2 || "",
    ta1: cls?.ta1 || "",
    ta2: cls?.ta2 || "",
    schedule: cls?.schedule || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClass: Class = {
      id: cls?.id || `CLS-${Math.floor(Math.random() * 10000)}`,
      ...formData,
      students: cls?.students || [],
    };
    onSave(newClass);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl shadow-xl w-[90%] max-w-lg p-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-xl font-bold">
            {isAddMode ? (
              <>
                <CirclePlus className="w-6 h-6 text-green-600" />
                <span className="text-green-700">Add New Class</span>
              </>
            ) : (
              <>
                <Pencil className="w-5 h-5 text-[#0E4BA9]" />
                <span className="text-[#0E4BA9]">Edit Class</span>
              </>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-black">
          {/* Class Name */}
          <div>
            <label className="block text-sm font-semibold text-[#0E4BA9] mb-1">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter class name (e.g., IELTS Foundation 1)"
              className="w-full border border-blue-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0E4BA9] outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-[#0E4BA9] mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full border border-blue-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0E4BA9] outline-none"
            >
              <option value="" disabled>
                Select category
              </option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Teachers & TAs */}
          {[
            { name: "teacher1", label: "Teacher 1" },
            { name: "teacher2", label: "Teacher 2" },
            { name: "ta1", label: "TA 1" },
            { name: "ta2", label: "TA 2" },
            {
              name: "schedule",
              label: "Schedule",
              hint: "Example: T4 17:30 - 19:00; T6 17:30 - 19:00",
            },
          ].map(({ name, label, hint }) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-[#0E4BA9] mb-1">
                {label}
              </label>
              <input
                name={name}
                value={(formData as any)[name]}
                onChange={handleChange}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="w-full border border-blue-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0E4BA9] outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">{hint}</p>
            </div>
          ))}

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg font-semibold hover:scale-[1.02] transition
                ${
                  isAddMode
                    ? "bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                    : "bg-linear-to-r from-[#0E4BA9] to-[#00A6FB] text-white hover:from-[#0C3E8C] hover:to-[#0090E0]"
                }
              `}
            >
              {isAddMode ? "Add Class" : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
