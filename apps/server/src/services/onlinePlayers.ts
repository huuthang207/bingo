const playerSocketIds = new Map<string, Set<string>>();

export function addOnlinePlayer(playerId: string, socketId: string) {
  const socketIds = playerSocketIds.get(playerId) ?? new Set<string>();
  socketIds.add(socketId);
  playerSocketIds.set(playerId, socketIds);

  return socketIds.size === 1;
}

export function removeOnlinePlayer(playerId: string, socketId: string) {
  const socketIds = playerSocketIds.get(playerId);

  if (!socketIds) {
    return true;
  }

  socketIds.delete(socketId);

  if (socketIds.size > 0) {
    return false;
  }

  playerSocketIds.delete(playerId);
  return true;
}

export function isPlayerOnline(playerId: string) {
  return playerSocketIds.has(playerId);
}

export function countOnlinePlayers(playerIds: string[]) {
  return playerIds.filter((playerId) => playerSocketIds.has(playerId)).length;
}
