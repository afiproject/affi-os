import { isDemoMode } from "@/lib/supabase/admin";
import { demoCandidates } from "@/lib/demo-data";
import { getCandidates } from "@/lib/db";
import { CandidateList } from "@/components/candidates/candidate-list";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const candidates = isDemoMode() ? demoCandidates : await getCandidates();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            AIが選んだ今日の投稿候補 · {candidates.filter((c) => c.status === "pending").length}件が承認待ち
          </p>
        </div>
      </div>
      <CandidateList candidates={candidates} />
    </div>
  );
}
