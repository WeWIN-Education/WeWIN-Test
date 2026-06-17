// utils/date.ts
export function calculateAge(dob: Date): number {
  const diff = Date.now() - new Date(dob).getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age;
}
