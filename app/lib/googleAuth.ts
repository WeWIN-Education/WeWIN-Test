export function getGoogleClientId(): string | undefined {
  return (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    undefined
  );
}

export function getGoogleClientSecret(): string | undefined {
  return (
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET ||
    undefined
  );
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
}
