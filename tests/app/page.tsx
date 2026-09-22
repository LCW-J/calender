import { redirect } from "next/navigation";

export default function RootPage() {
  // PROJECT_SPEC.md §4：使用者打開 App 後，預設進入 Today。
  redirect("/today");
}
