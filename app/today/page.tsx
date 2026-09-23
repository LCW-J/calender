import TodayView from "@/components/Today/TodayView";
import { requireUser } from "@/lib/auth/require-user";

export default async function TodayPage() {
  await requireUser();
  return <TodayView />;
}
