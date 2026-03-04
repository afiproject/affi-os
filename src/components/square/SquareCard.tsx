"use client";

interface SquareCardProps {
  id: string;
  text: string;
  tags: string[];
  preferredMode: string;
  likeCount: number;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  isLiked?: boolean;
  onLike?: (postId: string) => void;
  onRequest?: (postId: string) => void;
}

const TAG_LABELS: Record<string, string> = {
  chat: "雑談",
  work: "作業",
  study: "勉強",
  consult: "相談",
  game: "ゲーム",
  walk: "散歩",
};

export default function SquareCard({
  id,
  text,
  tags,
  preferredMode,
  likeCount,
  createdAt,
  user,
  isLiked = false,
  onLike,
  onRequest,
}: SquareCardProps) {
  const timeAgo = getTimeAgo(new Date(createdAt));

  return (
    <div className="card">
      {/* ヘッダー */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm dark:bg-primary-900">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            user.displayName[0]
          )}
        </div>
        <div>
          <span className="text-sm font-medium">{user.displayName}</span>
          <span className="ml-2 text-xs text-[var(--color-text-secondary)]">
            {timeAgo}
          </span>
        </div>
      </div>

      {/* 本文 */}
      <p className="mt-3 text-sm leading-relaxed">{text}</p>

      {/* タグ */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
          >
            #{TAG_LABELS[tag] ?? tag}
          </span>
        ))}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {preferredMode === "call"
            ? "📞 通話"
            : preferredMode === "in_person"
              ? "🚶 対面"
              : "📞🚶 どちらでも"}
        </span>
      </div>

      {/* アクション */}
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => onLike?.(id)}
          className={`flex items-center gap-1 text-sm transition-colors ${
            isLiked
              ? "text-red-500"
              : "text-[var(--color-text-secondary)] hover:text-red-500"
          }`}
        >
          {isLiked ? "♥" : "♡"} {likeCount}
        </button>
        <button
          onClick={() => onRequest?.(id)}
          className="btn-primary text-xs"
        >
          時間共有を依頼
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}日前`;
}
