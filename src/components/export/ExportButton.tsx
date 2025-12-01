'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Download,
  Image,
  FileText,
  Copy,
  Check,
  ChevronDown,
  Share2,
  Loader2,
} from 'lucide-react';

// Types
export interface ExportOptions {
  format: 'png' | 'jpeg' | 'pdf' | 'json' | 'clipboard';
  quality?: number; // 0-1 for images
  scale?: number; // Resolution multiplier
  backgroundColor?: string;
  padding?: number;
  filename?: string;
  includeWatermark?: boolean;
}

interface ExportButtonProps {
  targetRef: React.RefObject<HTMLElement>;
  filename?: string;
  formats?: ('png' | 'jpeg' | 'pdf' | 'json' | 'clipboard')[];
  data?: Record<string, unknown>; // For JSON export
  variant?: 'button' | 'dropdown' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  onExportStart?: () => void;
  onExportComplete?: (format: string) => void;
  onExportError?: (error: Error) => void;
  className?: string;
}

// Export utilities
async function exportAsImage(
  element: HTMLElement,
  options: ExportOptions
): Promise<Blob> {
  // Dynamic import to avoid SSR issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2canvasModule = await import('html2canvas' as any);
  const html2canvas = html2canvasModule.default || html2canvasModule;

  const canvas = await html2canvas(element, {
    backgroundColor: options.backgroundColor || '#111827',
    scale: options.scale || 2,
    logging: false,
    useCORS: true,
    allowTaint: true,
  });

  // Add padding if needed
  if (options.padding) {
    const paddedCanvas = document.createElement('canvas');
    const ctx = paddedCanvas.getContext('2d')!;
    const padding = options.padding;

    paddedCanvas.width = canvas.width + padding * 2;
    paddedCanvas.height = canvas.height + padding * 2;

    ctx.fillStyle = options.backgroundColor || '#111827';
    ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
    ctx.drawImage(canvas, padding, padding);

    // Add watermark if enabled
    if (options.includeWatermark) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '14px sans-serif';
      ctx.fillText('CS2 Coach', paddedCanvas.width - 100, paddedCanvas.height - 20);
    }

    return new Promise<Blob>((resolve) => {
      paddedCanvas.toBlob(
        (blob: Blob | null) => resolve(blob!),
        options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        options.quality || 0.95
      );
    });
  }

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob: Blob | null) => resolve(blob!),
      options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
      options.quality || 0.95
    );
  });
}

async function copyToClipboard(element: HTMLElement, options: ExportOptions): Promise<void> {
  const blob = await exportAsImage(element, { ...options, format: 'png' });

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ]);
  } catch {
    // Fallback for browsers without ClipboardItem support
    const url = URL.createObjectURL(blob);
    const img = document.createElement('img');
    img.src = url;

    const range = document.createRange();
    range.selectNode(img);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    document.execCommand('copy');
    selection?.removeAllRanges();

    URL.revokeObjectURL(url);
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadJSON(data: Record<string, unknown>, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, filename);
}

// Format config
const FORMAT_CONFIG = {
  png: {
    icon: Image,
    label: 'Image PNG',
    description: 'Haute qualité, transparent',
  },
  jpeg: {
    icon: Image,
    label: 'Image JPEG',
    description: 'Taille réduite',
  },
  pdf: {
    icon: FileText,
    label: 'PDF',
    description: 'Document imprimable',
  },
  json: {
    icon: FileText,
    label: 'JSON',
    description: 'Données brutes',
  },
  clipboard: {
    icon: Copy,
    label: 'Copier',
    description: 'Copier dans le presse-papier',
  },
};

// Export dropdown menu
function ExportDropdown({
  formats,
  isExporting,
  exportingFormat,
  onExport,
}: {
  formats: ('png' | 'jpeg' | 'pdf' | 'json' | 'clipboard')[];
  isExporting: boolean;
  exportingFormat: string | null;
  onExport: (format: 'png' | 'jpeg' | 'pdf' | 'json' | 'clipboard') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
          'bg-gray-800 text-white hover:bg-gray-700',
          isExporting && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Exporter
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {formats.map((format) => {
              const config = FORMAT_CONFIG[format];
              const Icon = config.icon;
              const isExportingThis = exportingFormat === format;

              return (
                <button
                  key={format}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    'hover:bg-gray-700',
                    isExportingThis && 'bg-gray-700'
                  )}
                  onClick={() => {
                    onExport(format);
                    setIsOpen(false);
                  }}
                  disabled={isExporting}
                >
                  {isExportingThis ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{config.label}</div>
                    <div className="text-xs text-gray-500">{config.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Main component
export function ExportButton({
  targetRef,
  filename = 'cs2-coach-export',
  formats = ['png', 'clipboard'],
  data,
  variant = 'dropdown',
  size = 'md',
  onExportStart,
  onExportComplete,
  onExportError,
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = useCallback(
    async (format: 'png' | 'jpeg' | 'pdf' | 'json' | 'clipboard') => {
      if (!targetRef.current && format !== 'json') {
        onExportError?.(new Error('Target element not found'));
        return;
      }

      setIsExporting(true);
      setExportingFormat(format);
      onExportStart?.();

      try {
        const timestamp = new Date().toISOString().split('T')[0];
        const baseFilename = `${filename}-${timestamp}`;

        switch (format) {
          case 'png':
          case 'jpeg': {
            const blob = await exportAsImage(targetRef.current!, {
              format,
              scale: 2,
              padding: 20,
              includeWatermark: true,
            });
            downloadBlob(blob, `${baseFilename}.${format}`);
            break;
          }

          case 'clipboard': {
            await copyToClipboard(targetRef.current!, {
              format: 'png',
              scale: 2,
              padding: 10,
            });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            break;
          }

          case 'json': {
            if (data) {
              downloadJSON(data, `${baseFilename}.json`);
            } else {
              throw new Error('No data provided for JSON export');
            }
            break;
          }

          case 'pdf': {
            // For PDF, we'll generate an image and inform user
            // Full PDF generation would require a server-side solution
            const blob = await exportAsImage(targetRef.current!, {
              format: 'png',
              scale: 2,
              padding: 40,
              includeWatermark: true,
            });
            downloadBlob(blob, `${baseFilename}.png`);
            // Note: Full PDF support would require jspdf or server-side generation
            break;
          }
        }

        onExportComplete?.(format);
      } catch (error) {
        console.error('Export failed:', error);
        onExportError?.(error instanceof Error ? error : new Error('Export failed'));
      } finally {
        setIsExporting(false);
        setExportingFormat(null);
      }
    },
    [targetRef, filename, data, onExportStart, onExportComplete, onExportError]
  );

  // Icon only variant
  if (variant === 'icon') {
    return (
      <button
        className={cn(
          'p-2 rounded-lg transition-colors',
          'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700',
          isExporting && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={() => handleExport(formats[0])}
        disabled={isExporting}
        title="Exporter"
      >
        {isExporting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : copied ? (
          <Check className="w-5 h-5 text-green-400" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </button>
    );
  }

  // Single button variant
  if (variant === 'button') {
    return (
      <button
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
          'bg-blue-600 text-white hover:bg-blue-500',
          isExporting && 'opacity-50 cursor-not-allowed',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'lg' && 'px-5 py-3',
          className
        )}
        onClick={() => handleExport(formats[0])}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {copied ? 'Copié !' : FORMAT_CONFIG[formats[0]].label}
      </button>
    );
  }

  // Dropdown variant (default)
  return (
    <ExportDropdown
      formats={formats}
      isExporting={isExporting}
      exportingFormat={exportingFormat}
      onExport={handleExport}
    />
  );
}

// Export hook for programmatic use
export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportElement = useCallback(
    async (
      element: HTMLElement,
      options: ExportOptions & { filename: string }
    ): Promise<void> => {
      setIsExporting(true);

      try {
        const blob = await exportAsImage(element, options);
        downloadBlob(blob, `${options.filename}.${options.format}`);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const copyElement = useCallback(
    async (element: HTMLElement, options?: Partial<ExportOptions>): Promise<void> => {
      setIsExporting(true);

      try {
        await copyToClipboard(element, { format: 'png', ...options });
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return {
    isExporting,
    exportElement,
    copyElement,
    downloadJSON,
  };
}

// Export types
export type { ExportButtonProps };
