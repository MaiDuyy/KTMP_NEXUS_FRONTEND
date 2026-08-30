export function isMeetingVoiceEnabled(
  configuredValue: string | undefined = process.env.NEXT_PUBLIC_MEETING_VOICE_ENABLED,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  if (configuredValue === undefined || configuredValue === '') {
    return nodeEnv !== 'production';
  }
  if (configuredValue === 'true' || configuredValue === '1') return true;
  if (configuredValue === 'false' || configuredValue === '0') return false;
  return false;
}

export const MEETING_VOICE_ENABLED = isMeetingVoiceEnabled();
