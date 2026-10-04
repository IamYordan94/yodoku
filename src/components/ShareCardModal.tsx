// ShareCardModal.tsx — modal that previews + exports a canvas share card.
// Sticker Pack styling via var(--yodoku-*) tokens.

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { drawShareCard, type ShareCardOptions } from '../utils/shareCard';
import { track } from '../utils/telemetry';

export interface ShareCardModalProps {
  open: boolean;
  onClose: () => void;
  options: ShareCardOptions;      // card content (gameId, title, accent, lines)
  shareText: string;              // the game's existing share text (for WhatsApp)
}

const SITE_URL = 'https://www.yodoku.app';

export default function ShareCardModal({ open, onClose, options, shareText }: ShareCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  // Draw the card whenever the modal opens or the options change.
  useEffect(() => {
    if (open && canvasRef.current) {
      drawShareCard(canvasRef.current, options);
      track('share_open', { game: options.gameId });
    }
  }, [open, options]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    track('share_download', { game: options.gameId });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${options.gameId}-share-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [options.gameId]);

  const handleWhatsApp = useCallback(() => {
    // wa.me deep link — no API, no SDK. Opens WhatsApp with prefilled text.
    track('share_whatsapp', { game: options.gameId });
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${SITE_URL}`)}`,
      '_blank',
      'noopener'
    );
  }, [shareText, options.gameId]);

  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    track('share_copy', { game: options.gameId });
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (blob && 'ClipboardItem' in window && navigator.clipboard && 'write' in navigator.clipboard) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = new (window as any).ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
      } else {
        // Fallback: copy the text version instead of failing silently.
        await navigator.clipboard.writeText(`${shareText}\n${SITE_URL}`);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — fall back to text.
      try { await navigator.clipboard.writeText(`${shareText}\n${SITE_URL}`); } catch { /* give up */ }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [shareText, options.gameId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(20,20,20,0.6)', zIndex: 1000 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            style={{
              background: 'var(--yodoku-bg, #f6f3ec)',
              border: '2.5px solid #141414',
              borderRadius: '12px',
              boxShadow: '8px 8px 0 #141414',
              padding: '20px',
              maxWidth: 'min(480px, calc(100vw - 32px))',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 800,
                  fontSize: '13px',
                  textTransform: 'uppercase' as const,
                  background: options.accentColor,
                  border: '2px solid #141414',
                  borderRadius: '6px',
                  padding: '4px 10px',
                }}
              >
                Share card
              </span>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: 'var(--yodoku-panel)',
                  border: '2px solid #141414',
                  borderRadius: '6px',
                  width: '30px',
                  height: '30px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            {/* Preview — hidden full-res canvas scaled down with CSS */}
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                border: '2.5px solid #141414',
                borderRadius: '10px',
                display: 'block',
              }}
            />

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDownload}
                style={{
                  flex: 1,
                  background: '#141414',
                  color: 'var(--yodoku-bg, #f6f3ec)',
                  border: '2.5px solid #141414',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxShadow: '3px 3px 0 rgba(0,0,0,0.25)',
                  cursor: 'pointer',
                }}
              >
                Download PNG
              </button>
              <button
                onClick={handleWhatsApp}
                style={{
                  flex: 1,
                  background: 'var(--yodoku-panel)',
                  color: '#141414',
                  border: '2.5px solid #141414',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                }}
              >
                WhatsApp
              </button>
              <button
                onClick={handleCopy}
                style={{
                  flex: 1,
                  background: 'var(--yodoku-panel)',
                  color: '#141414',
                  border: '2.5px solid #141414',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
