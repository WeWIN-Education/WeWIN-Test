import { ChangeEvent } from "react";

export function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  fullWidth = false,
  onFocus,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-[#0E4BA9] mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        required={required}
        placeholder={placeholder}
        max={
          type === "date" ? new Date().toISOString().split("T")[0] : undefined
        }
        className={`w-full px-4 py-3 border border-[#B8D7F9] rounded-xl bg-white text-gray-900 placeholder-gray-400 
          focus:outline-none focus:ring-2 focus:ring-[#0E4BA9] transition-all ${
            type === "date" ? "cursor-pointer" : ""
          }`}
      />
    </div>
  );
}