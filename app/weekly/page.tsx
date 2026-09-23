import WeeklyView from "@/components/Weekly/WeeklyView";
import { requireUser } from "@/lib/auth/require-user";

export default async function WeeklyPage() {
  await requireUser();
  return <WeeklyView />;
}
