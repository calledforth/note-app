import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, RefreshCw, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import clsx from 'clsx';

// Types for update info
interface UpdateInfo {
    version: string;
    releaseNotes?: string;
}

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';

interface UpdateToastProps {
    // These would be controlled by the main process via IPC
}

export const UpdateToast: React.FC<UpdateToastProps> = () => {
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const currentNoteStyle = useThemeStore((state) => state.currentNoteStyle);
    const isZenVoid = currentNoteStyle === 'zen-void';

    // Listen for IPC messages from main process
    useEffect(() => {
        const api = window.electronAPI;
        if (!api?.updater) return;

        const handleCheckingForUpdate = () => {
            setStatus('checking');
            setDismissed(false);
        };

        const handleUpdateAvailable = (info: UpdateInfo) => {
            setStatus('available');
            setUpdateInfo(info);
            setDismissed(false);
        };

        const handleUpdateNotAvailable = () => {
            setStatus('idle');
        };

        const handleDownloadProgress = (progress: number) => {
            setStatus('downloading');
            setDownloadProgress(progress);
        };

        const handleUpdateDownloaded = () => {
            setStatus('downloaded');
            setDownloadProgress(100);
        };

        const handleError = (error: string) => {
            setStatus('error');
            setErrorMessage(error);
            console.error('[UpdateToast] Error:', error);
        };

        // Subscribe to events
        api.updater.onCheckingForUpdate(handleCheckingForUpdate);
        api.updater.onUpdateAvailable(handleUpdateAvailable);
        api.updater.onUpdateNotAvailable(handleUpdateNotAvailable);
        api.updater.onDownloadProgress(handleDownloadProgress);
        api.updater.onUpdateDownloaded(handleUpdateDownloaded);
        api.updater.onError(handleError);

        // Cleanup
        return () => {
            // Note: In a real implementation, you'd want to remove listeners
        };
    }, []);

    const handleDownload = () => {
        window.electronAPI?.updater?.downloadUpdate();
    };

    const handleInstall = () => {
        window.electronAPI?.updater?.quitAndInstall();
    };

    const handleDismiss = () => {
        setDismissed(true);
    };

    // Don't show if dismissed or idle
    if (dismissed || status === 'idle' || status === 'checking') {
        return null;
    }

    // Font family based on theme
    const fontFamily = isZenVoid
        ? "'Inter', sans-serif"
        : "'JetBrains Mono', monospace";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={clsx(
                    "fixed bottom-5 right-5 z-[9999]",
                    "w-[280px] overflow-hidden",
                    isZenVoid
                        ? "bg-[var(--void-bg)] border border-[var(--void-border)] rounded-md"
                        : "bg-[var(--wabi-bg)] border border-[var(--wabi-border)] rounded-xs"
                )}
                style={{ fontFamily }}
            >
                {/* Header */}
                <div className={clsx(
                    "px-3 py-2 flex items-center justify-between",
                    isZenVoid
                        ? "border-b border-[var(--void-border)]"
                        : "border-b border-[var(--wabi-border)]"
                )}>
                    <div className="flex items-center gap-2">
                        {status === 'error' ? (
                            <AlertCircle className={clsx(
                                "w-3.5 h-3.5",
                                "text-red-400/70"
                            )} />
                        ) : status === 'downloaded' ? (
                            <RefreshCw className={clsx(
                                "w-3.5 h-3.5",
                                isZenVoid ? "text-white/50" : "text-[#666]"
                            )} />
                        ) : (
                            <Download className={clsx(
                                "w-3.5 h-3.5",
                                isZenVoid ? "text-white/50" : "text-[#666]"
                            )} />
                        )}
                        <span className={clsx(
                            isZenVoid
                                ? "text-xs text-white/40 font-light tracking-wide"
                                : "text-[10px] text-[var(--wabi-title)] uppercase tracking-[0.1em]"
                        )}>
                            {status === 'available' && 'Update'}
                            {status === 'downloading' && 'Downloading'}
                            {status === 'downloaded' && 'Ready'}
                            {status === 'error' && 'Error'}
                        </span>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className={clsx(
                            "p-0.5 rounded transition-colors",
                            isZenVoid
                                ? "text-white/30 hover:text-white/60 hover:bg-white/5"
                                : "text-[#555] hover:text-[#888] hover:bg-white/5"
                        )}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-3 py-2.5">
                    {status === 'available' && (
                        <div className="space-y-2.5">
                            <p className={clsx(
                                isZenVoid
                                    ? "text-sm text-[var(--void-title)] font-light"
                                    : "text-xs text-[var(--wabi-text)]"
                            )}>
                                v{updateInfo?.version} available
                            </p>
                            <button
                                onClick={handleDownload}
                                className={clsx(
                                    "w-full py-1.5 px-3 text-xs",
                                    "flex items-center justify-center gap-1.5",
                                    "transition-colors duration-150",
                                    isZenVoid
                                        ? "bg-white/5 hover:bg-white/10 text-white/70 border border-[var(--void-border)] rounded"
                                        : "bg-[#0c0c0b] hover:bg-[#111] text-[var(--wabi-text)] border border-[var(--wabi-border)] rounded-xs"
                                )}
                            >
                                <Download className="w-3 h-3" />
                                Download
                            </button>
                        </div>
                    )}

                    {status === 'downloading' && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px]">
                                <span className={isZenVoid ? "text-white/40" : "text-[var(--wabi-text-muted)]"}>
                                    Progress
                                </span>
                                <span className={isZenVoid ? "text-white/60" : "text-[var(--wabi-text)]"}>
                                    {Math.round(downloadProgress)}%
                                </span>
                            </div>
                            <div className={clsx(
                                "h-1 rounded-full overflow-hidden",
                                isZenVoid ? "bg-white/5" : "bg-[#111]"
                            )}>
                                <motion.div
                                    className={clsx(
                                        "h-full rounded-full",
                                        isZenVoid ? "bg-white/30" : "bg-[#444]"
                                    )}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${downloadProgress}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                        </div>
                    )}

                    {status === 'downloaded' && (
                        <div className="space-y-2.5">
                            <p className={clsx(
                                isZenVoid
                                    ? "text-sm text-[var(--void-title)] font-light"
                                    : "text-xs text-[var(--wabi-text)]"
                            )}>
                                Restart to apply update
                            </p>
                            <button
                                onClick={handleInstall}
                                className={clsx(
                                    "w-full py-1.5 px-3 text-xs",
                                    "flex items-center justify-center gap-1.5",
                                    "transition-colors duration-150",
                                    isZenVoid
                                        ? "bg-white/10 hover:bg-white/15 text-white/90 border border-[var(--void-border)] rounded"
                                        : "bg-[#111] hover:bg-[#1a1a1a] text-[var(--wabi-text)] border border-[var(--wabi-border)] rounded-xs"
                                )}
                            >
                                <RefreshCw className="w-3 h-3" />
                                Restart Now
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-1.5">
                            <p className={clsx(
                                "text-xs text-red-400/80"
                            )}>
                                Update failed
                            </p>
                            {errorMessage && (
                                <p className={clsx(
                                    "text-[10px] p-1.5 rounded overflow-hidden text-ellipsis",
                                    isZenVoid
                                        ? "bg-white/5 text-white/40 border border-[var(--void-border)]"
                                        : "bg-[#0c0c0b] text-[var(--wabi-text-muted)] border border-[var(--wabi-border)]"
                                )}
                                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                >
                                    {errorMessage.slice(0, 80)}{errorMessage.length > 80 ? '...' : ''}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
