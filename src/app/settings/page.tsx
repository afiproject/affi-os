import { isDemoMode } from "@/lib/supabase/admin";
import { demoSystemSettings, demoAccountSettings, demoContentRules } from "@/lib/demo-data";
import { getSystemSettings, getFirstActiveAccount, getAccountSettings, getContentRules } from "@/lib/db";
import { SettingsPanel } from "@/components/settings/settings-panel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let system, account, rules;

  if (isDemoMode()) {
    system = demoSystemSettings;
    account = demoAccountSettings;
    rules = demoContentRules;
  } else {
    const activeAccount = await getFirstActiveAccount();
    [system, account, rules] = await Promise.all([
      getSystemSettings(),
      activeAccount ? getAccountSettings(activeAccount.id) : Promise.resolve(null),
      getContentRules(),
    ]);
    // Provide defaults if no settings exist yet
    system = system || demoSystemSettings;
    account = account || demoAccountSettings;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">運用ルールとシステム設定を管理します</p>
      <SettingsPanel
        system={system}
        account={account}
        rules={rules}
      />
    </div>
  );
}
