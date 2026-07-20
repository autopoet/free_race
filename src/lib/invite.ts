const ROOM_CODE_PATTERN = /^[A-F0-9]{10}$/;
const WEB_APP_URL =
  process.env.EXPO_PUBLIC_WEB_APP_URL?.replace(/\/+$/, '') ||
  'https://autopoet.github.io/free_race';

export function normalizeRoomCode(value?: string | null) {
  const code = value?.trim().toUpperCase();
  return code && ROOM_CODE_PATTERN.test(code) ? code : undefined;
}

export function roomCodeFromInvite(data: string) {
  try {
    const parsed = new URL(data);
    const isNativeInvite =
      parsed.protocol === 'sushiking:' && parsed.hostname === 'join';
    const isWebInvite =
      parsed.protocol === 'https:' || parsed.protocol === 'http:';

    if (!isNativeInvite && !isWebInvite) return undefined;
    return normalizeRoomCode(parsed.searchParams.get('roomCode'));
  } catch {
    return undefined;
  }
}

export function createInviteLink(roomCode?: string | null) {
  const code = normalizeRoomCode(roomCode);
  if (!code) return WEB_APP_URL;
  return `${WEB_APP_URL}/?roomCode=${encodeURIComponent(code)}`;
}
