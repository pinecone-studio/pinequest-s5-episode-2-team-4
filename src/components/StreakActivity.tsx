import { readSession } from "@/lib/session";
import { StreakActivityTracker } from "./StreakActivityTracker";

/** Authenticated identity keeps automatic activity separate between accounts. */
export async function StreakActivity() {
  const session = await readSession();
  if (!session || session.role !== "student") return null;
  return <StreakActivityTracker key={session.id} accountId={session.id} recordedDay={session.streak?.lastDate} />;
}
