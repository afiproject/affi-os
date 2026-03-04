"use client";

import { useState } from "react";
import SquareCard from "@/components/square/SquareCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEMO_POSTS } from "@/lib/demo-data";

export default function SquarePage() {
  const router = useRouter();
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    Object.fromEntries(DEMO_POSTS.map((p) => [p.id, p.likeCount]))
  );

  const toggleLike = (postId: string) => {
    const wasLiked = likes[postId] ?? false;
    setLikes((prev) => ({ ...prev, [postId]: !wasLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? 0) + (wasLiked ? -1 : 1),
    }));
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">広場</h1>
        <button className="text-xl">🔔</button>
      </div>

      <Link href="/square/new" className="btn-primary mt-4 flex w-full items-center justify-center gap-2 text-sm">
        + 投稿する <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">2🎫</span>
      </Link>

      <div className="mt-4 space-y-3">
        {DEMO_POSTS.map((post) => (
          <SquareCard
            key={post.id}
            {...post}
            likeCount={likeCounts[post.id] ?? post.likeCount}
            isLiked={likes[post.id] ?? false}
            onLike={toggleLike}
            onRequest={(postId) => router.push(`/square/request/${postId}`)}
          />
        ))}
      </div>
    </div>
  );
}
