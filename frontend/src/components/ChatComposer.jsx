import { Paperclip, Search, SendHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';

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
}) {
  const fileInputRef = useRef(null);
  const stopTypingTimeoutRef = useRef(null);
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
