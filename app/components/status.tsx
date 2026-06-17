export const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
      status === "Active"
        ? "bg-green-100 text-green-700 border-green-300"
        : "bg-red-100 text-red-700 border-red-300"
    }`}
  >
    {status}
  </span>
);
