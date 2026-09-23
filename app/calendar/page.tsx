import CalendarView from "@/components/Calendar/CalendarView";
import { requireUser } from "@/lib/auth/require-user";

export default async function CalendarPage() {
  await requireUser();
  return <CalendarView />;
}
