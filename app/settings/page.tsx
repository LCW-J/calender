import SettingsView from "@/components/Settings/SettingsView";
import { requireUser } from "@/lib/auth/require-user";

export default async function SettingsPage() {
  await requireUser();
  return <SettingsView />;
}
