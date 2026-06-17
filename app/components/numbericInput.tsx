import React from "react";

interface NumericInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const NumericDateInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (props, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowed = [
        "0","1","2","3","4","5","6","7","8","9",
        "Backspace","Delete","ArrowLeft","ArrowRight","Tab"
      ];
      if (!allowed.includes(e.key)) e.preventDefault();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.replace(/\D/g, "");

      if (v.length > 2 && v.length <= 4) v = v.slice(0, 2) + "/" + v.slice(2);
      else if (v.length > 4)
        v = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4, 8);

      props.onChange?.({
        ...e,
        target: { ...e.target, value: v },
      } as React.ChangeEvent<HTMLInputElement>);
    };

    return (
      <input
        {...props}
        ref={ref}
        readOnly                         // ❗ không cho nhập
        tabIndex={-1}                    // ❗ không cho focus
        onFocus={(e) => e.preventDefault()}  // ❗ chặn HTML5 blur validation

        onKeyDown={handleKeyDown}
        onChange={handleChange}

        maxLength={10}
        placeholder="dd/mm/yyyy"
        className="
          w-full px-4 py-3 rounded-xl
          border border-[#B8D7F9]
          bg-white outline-none
          text-gray-700 shadow-sm transition-all
          focus:ring-0 focus:outline-none
          pointer-events-none           // ❗ input không nhận interaction
        "
      />
    );
  }
);

export default NumericDateInput;
