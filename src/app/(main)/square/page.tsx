"use client";

import { useState, useEffect } from "react";
import SquareCard from "@/components/square/SquareCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPosts, getTicketBalance } from "@/lib/demo-store";
import type { DemoPost } from "@/lib/demo-store";

export default function SquarePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<DemoPost[]>([]);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [tickets, setTickets] = useState(18);

  useEffect(() => {
    const p = getPosts();
    setPosts(p);
    setLikeCounts(Object.fromEntries(p.map((x) => [x.id, x.likeCount])));
    setTickets(getTicketBalance());
  }, []);

  const toggleLike = (postId: string) => {
    const wasLiked = likes[postId] ?? false;
    setLikes((prev) => ({ ...prev, [postId]: !wasLiked }));
    setLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + (wasLiked ? -1 : 1) }));
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">広場</h1>
        <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>🎫 {tickets}枚</span>
      </div>

      <Link href="/square/new"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #7B8CFF 0%, #B79DFF 100%)" }}>
        + 投稿する <span className="rounded-full px-1.5 py-0.5 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>2🎫</span>
      </Link>

      <div className="mt-4 space-y-4">
        {posts.map((post) => (
          <SquareCard
            key={post.id}
            {...post}
            photos={post.photos ?? []}
            likeCount={likeCounts[post.id] ?? post.likeCount}
            isLiked={likes[post.id] ?? false}
            onLike={toggleLike}
            onRequest={(postId) => router.push(`/square/request/${postId}`)}
            onTap={(postId) => router.push(`/square/post/${postId}`)}
          />
        ))}
      </div>
    </div>
  );
}
