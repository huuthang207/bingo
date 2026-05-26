import { HostRoomClient } from "./HostRoomClient";

type HostPageProps = {
  params: Promise<{ roomCode: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function HostPage({ params, searchParams }: HostPageProps) {
  const [{ roomCode }, { token }] = await Promise.all([params, searchParams]);

  return <HostRoomClient hostToken={token ?? ""} roomCode={roomCode} />;
}
