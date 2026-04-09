"use client";

import { useState } from "react";
import { X, Instagram, Facebook, Plus } from "lucide-react";
import { createPost } from "@/lib/api";
import type { PostRecord } from "digital-office-shared";

const LOGOS = [
  { label: "Cannavative",        url: "http://204.168.231.23:3001/static/logo.png" },
  { label: "Motivator",          url: "http://204.168.231.23:3001/static/logo-motivator.png" },
  { label: "Resin8",             url: "http://204.168.231.23:3001/static/logo-resin8.png" },
];

const IG_BANNED = new Set(["weed","marijuana","420","stoner","high","blazed","pot","dank"]);

export function CreatePostModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (post: PostRecord) => void;
}) {
  const [platform, setPlatform] = useState<"facebook" | "instagram">("instagram");
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<string>(LOGOS[0].url);
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addHashtag() {
    const tag = hashtagInput.trim().replace(/^#/, "").toLowerCase();
    if (!tag || hashtags.includes(tag)) { setHashtagInput(""); return; }
    if (platform === "instagram" && IG_BANNED.has(tag)) {
      setError(`"#${tag}" is a banned Instagram hashtag.`);
      return;
    }
    setHashtags((prev) => [...prev, tag]);
    setHashtagInput("");
    setError(null);
  }

  function removeHashtag(tag: string) {
    setHashtags((prev) => prev.filter((h) => h !== tag));
  }

  async function submit() {
    if (!caption.trim()) { setError("Caption is required."); return; }
    if (platform === "instagram" && useCustomUrl && !customUrl.trim()) {
      setError("Instagram requires an image URL."); return;
    }
    const media_urls = platform === "instagram"
      ? [useCustomUrl ? customUrl.trim() : selectedLogo]
      : [];

    // Auto-append age disclaimer if missing
    const fullCaption = caption.includes("21+") ? caption : `${caption}\n\n21+ only.`;

    setBusy(true);
    setError(null);
    try {
      const post = await createPost({ platform, caption: fullCaption, hashtags, media_urls });
      onCreated(post);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create post.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg flex flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">New Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform */}
        <div className="flex gap-2">
          {(["instagram", "facebook"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
                platform === p
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {p === "instagram" ? <Instagram className="w-4 h-4" /> : <Facebook className="w-4 h-4" />}
              <span className="capitalize">{p}</span>
            </button>
          ))}
        </div>

        {/* Caption */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Caption</label>
          <textarea
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write your post caption..."
            className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-500"
          />
          <p className="text-xs text-gray-600">Age disclaimer (21+ only.) will be auto-appended if missing.</p>
        </div>

        {/* Hashtags */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Hashtags</label>
          <div className="flex gap-2">
            <input
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
              placeholder="add tag (no #)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={addHashtag}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => removeHashtag(tag)}
                  className="text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-full px-2.5 py-0.5 cursor-pointer hover:bg-red-600/20 hover:text-red-300 hover:border-red-500/30 transition-colors"
                >
                  #{tag} ×
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Image — Instagram only */}
        {platform === "instagram" && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Image</label>
            <div className="flex gap-2">
              {LOGOS.map((logo) => (
                <button
                  key={logo.url}
                  onClick={() => { setSelectedLogo(logo.url); setUseCustomUrl(false); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    !useCustomUrl && selectedLogo === logo.url
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {logo.label}
                </button>
              ))}
              <button
                onClick={() => setUseCustomUrl(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  useCustomUrl
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Custom URL
              </button>
            </div>
            {useCustomUrl && (
              <input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://... (publicly accessible image URL)"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-400 bg-red-500/10 rounded p-2">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {busy ? "Creating…" : "Create Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
