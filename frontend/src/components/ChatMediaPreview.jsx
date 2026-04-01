function isImage(type = '') {
  return type.startsWith('image/');
}

function isVideo(type = '') {
  return type.startsWith('video/');
}

export function ChatMediaPreview({ message, onOpenMedia }) {
  if (!message.media_url) return null;

  if (isImage(message.media_type)) {
    return (
      <button type="button" className="mt-2 block w-full" onClick={() => onOpenMedia?.({ url: message.media_url, type: message.media_type, name: message.media_name })}>
        <img
          src={message.media_url}
          alt={message.media_name || 'Attachment'}
          loading="lazy"
          className="max-h-72 w-full rounded-2xl object-cover"
        />
      </button>
    );
  }

  if (isVideo(message.media_type)) {
    return (
      <button type="button" className="mt-2 block w-full" onClick={() => onOpenMedia?.({ url: message.media_url, type: message.media_type, name: message.media_name })}>
        <video preload="metadata" className="max-h-72 w-full rounded-2xl">
          <source src={message.media_url} type={message.media_type} />
        </video>
      </button>
    );
  }

  return (
    <a
      href={message.media_url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 flex items-center justify-between rounded-2xl border border-white/20 bg-black/5 px-3 py-3 text-sm"
    >
      <span className="truncate">{message.media_name || 'Download attachment'}</span>
      <span className="shrink-0 font-semibold">Open</span>
    </a>
  );
}
