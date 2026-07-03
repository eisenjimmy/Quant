import React, { useState } from 'react';

export function NewsPreview({
  url,
  title,
  summary,
  meta,
  children,
  className,
}: {
  url: string;
  title: string;
  summary?: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    host = url;
  }
  return (
    <span
      className={className ? `preview-wrap ${className}` : 'preview-wrap'}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span className="preview-pop" role="tooltip">
          <span className="preview-title">{title}</span>
          {meta && <span className="preview-meta">{meta}</span>}
          <span className="preview-summary">
            {summary?.trim() || 'No feed summary was provided for this story. Click to open the source article.'}
          </span>
          <span className="preview-hint">{host}</span>
        </span>
      )}
    </span>
  );
}
