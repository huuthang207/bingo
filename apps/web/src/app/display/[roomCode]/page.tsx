import { DisplayRoomClient } from "./DisplayRoomClient";

type DisplayPageProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function DisplayPage({ params }: DisplayPageProps) {
  const { roomCode } = await params;

  return <DisplayRoomClient roomCode={roomCode} />;
}
