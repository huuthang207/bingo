import { PlayRoomClient } from "./PlayRoomClient";

type PlayPageProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function PlayPage({ params }: PlayPageProps) {
  const { roomCode } = await params;

  return <PlayRoomClient roomCode={roomCode} />;
}
