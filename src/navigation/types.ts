export type RootStackParamList = {
  Home: { roomCode?: string } | undefined;
  Nickname: { mode: 'create' | 'join'; roomCode?: string };
  Waiting: undefined;
  Scanner: undefined;
  Battle: undefined;
  History: undefined;
  Result: undefined;
};
