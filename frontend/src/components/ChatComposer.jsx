import { Paperclip, Search, SendHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { buildMentionToken, extractActiveMentionQuery, scoreMentionMatch } from '../utils/mentions.js';

async function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ChatComposer({
  disabled,
  draft,
  onDraftChange,
  onSend,
  onTyping,
  searchQuery,
  onSearchChange,
  activeMembers = [],
  currentUser,
}) {
  const fileInputRef = useRef(null);
  const stopTypingTimeoutRef = useRef(null);
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const mentionQuery = extractActiveMentionQuery(draft || '');
  const suggestions = mentionQuery === null
    ? []
    : activeMembers
      .filter((member) => member.id !== currentUser?.id)
      .map((member) => ({ member, score: scoreMentionMatch(member.name, mentionQuery) }))
      .filter((entry) => entry.score >= 0)
      .sort((left, right) => right.score - left.score || left.member.name.localeCompare(right.member.name))
      .map((entry) => entry.member)
      .slice(0, 6);

  useEffect(() => () => {
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }
  }, []);

  async function handleFileChange(event) {
    const [file] = Array.from(event.target.files || []);
    if (!file) return;
    const dataUrl = await toDataUrl(file);
    setAttachment({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if ((!draft || !draft.trim()) && !attachment) return;
    setSubmitting(true);
    try {
      await onSend({
        content: draft.trim(),
        attachment,
      });
      setAttachment(null);
    } finally {
      setSubmitting(false);
    }
  }

  function insertMention(member) {
    onDraftChange((draft || '').replace(/@([A-Za-z0-9_ ]*)$/, `${buildMentionToken(member)} `));
    onTyping(`${buildMentionToken(member)} `);
  }

  return (
    <div className="border-t">
      <div className="flex items-center gap-3 border-b px-4 py-3 sm:px-5">
        <Search size={16} className="text-[rgb(var(--muted))]" />
        <input
          id="chat-search"
          name="chat_search"
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search this chat"
          className="w-full bg-transparent text-sm placeholder:text-[rgb(var(--muted))]"
        />
      </div>
      <form className="px-4 py-4 sm:px-5" onSubmit={handleSubmit}>
        {suggestions.length ? (
          <div className="mb-3 rounded-2xl border bg-[rgb(var(--bg-soft))] p-2">
            <p className="px-2 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
              Mention someone
            </p>
            <div className="space-y-1">
              {suggestions.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-[rgb(var(--bg-elevated))]"
                  onClick={() => insertMention(member)}
                >
                  <span className="font-semibold">{member.name}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">{buildMentionToken(member)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {attachment ? (
          <div className="mb-3 flex items-center justify-between rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold">{attachment.name}</p>
              <p className="text-[rgb(var(--muted))]">{Math.max(1, Math.round(attachment.size / 1024))} KB</p>
            </div>
            <button type="button" onClick={() => setAttachment(null)} className="shrink-0 text-[rgb(var(--muted))]">
              <X size={16} />
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-3">
          <button
            type="button"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--bg-soft))] text-[rgb(var(--text))]"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={16} />
          </button>
          <Input
            name="message"
            value={draft}
            onChange={(event) => {
              const value = event.target.value;
              onDraftChange(value);
              onTyping(value);
              if (stopTypingTimeoutRef.current) {
                clearTimeout(stopTypingTimeoutRef.current);
              }
              stopTypingTimeoutRef.current = setTimeout(() => {
                onTyping('');
              }, 1200);
            }}
            className="py-3"
            placeholder="Write a message"
            disabled={disabled || submitting}
          />
          <Button className="h-12 shrink-0 rounded-2xl px-4" disabled={disabled || submitting || ((!draft || !draft.trim()) && !attachment)}>
            <SendHorizontal size={16} />
          </Button>
        </div>
        <input
          id="chat-attachment"
          name="attachment"
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt"
          onChange={handleFileChange}
        />
      </form>
    </div>
  );
}
