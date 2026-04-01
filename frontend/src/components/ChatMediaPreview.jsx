function isImage(type = '') {
  return type.startsWith('image/');
}

function isVideo(type = '') {
  return type.startsWith('video/');
}

export function ChatMediaPreview({ message }) {
  if (!message.media_url) return null;

  if (isImage(message.media_type)) {
    return (
      <img
        src={message.media_url}
        alt={message.media_name || 'Attachment'}
        loading="lazy"
        className="mt-2 max-h-72 w-full rounded-2xl object-cover"
      />
    );
  }

  if (isVideo(message.media_type)) {
    return (
      <video controls preload="metadata" className="mt-2 max-h-72 w-full rounded-2xl">
        <source src={message.media_url} type={message.media_type} />
      </video>
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
