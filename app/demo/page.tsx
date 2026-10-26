import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { createDemoShips, DEMO_PROFILE } from "@/lib/demo";
import { getDateKey } from "@/lib/dates";

export default function DemoPage() {
  const timeZone = "UTC";
  return (
    <AppShell>
      <Dashboard
        demoMode
        initialShips={createDemoShips()}
        demoProfile={DEMO_PROFILE}
        initialRestDays={[]}
        isPro={false}
        timeZone={timeZone}
        todayKey={getDateKey(new Date(), timeZone)}
      />
    </AppShell>
  );
}
