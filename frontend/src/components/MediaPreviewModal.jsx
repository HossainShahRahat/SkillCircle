import { X } from 'lucide-react';

function isImage(type = '') {
  return type.startsWith('image/');
}

function isVideo(type = '') {
  return type.startsWith('video/');
}

export function MediaPreviewModal({ media, open, onClose }) {
  if (!open || !media?.url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6" onClick={onClose}>
      <div className="relative max-h-full w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white"
        >
          <X size={18} />
        </button>

        {isImage(media.type) ? (
          <img src={media.url} alt={media.name || 'Attachment'} className="max-h-[85vh] w-full rounded-[28px] object-contain" />
        ) : isVideo(media.type) ? (
          <video controls autoPlay className="max-h-[85vh] w-full rounded-[28px] bg-black">
            <source src={media.url} type={media.type} />
          </video>
        ) : (
          <div className="rounded-[28px] bg-white p-8 text-slate-900">
            <p className="text-lg font-bold">{media.name || 'Attachment'}</p>
            <a href={media.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Open file
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
