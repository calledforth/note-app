import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, RefreshCw } from 'lucide-react';
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

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={clsx(
                    "fixed bottom-6 right-6 z-[9999]",
                    "w-[320px] rounded-xl overflow-hidden",
                    "shadow-2xl",
                    isZenVoid
                        ? "bg-[#0a0a0b] border border-white/10"
                        : "bg-[#1a1a1a] border border-white/5"
                )}
            >
                {/* Header */}
                <div className={clsx(
                    "px-4 py-3 flex items-center justify-between",
                    isZenVoid
                        ? "bg-gradient-to-r from-white/5 to-transparent"
                        : "bg-gradient-to-r from-purple-500/10 to-transparent"
                )}>
                    <div className="flex items-center gap-2">
                        <div className={clsx(
                            "w-2 h-2 rounded-full animate-pulse",
                            status === 'error' ? "bg-red-500" :
                                status === 'downloaded' ? "bg-green-500" :
                                    "bg-purple-500"
                        )} />
                        <span className={clsx(
                            "text-xs font-medium uppercase tracking-wider",
                            isZenVoid ? "text-white/70" : "text-white/80"
                        )}>
                            {status === 'available' && 'Update Available'}
                            {status === 'downloading' && 'Downloading...'}
                            {status === 'downloaded' && 'Ready to Install'}
                            {status === 'error' && 'Update Error'}
                        </span>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className={clsx(
                            "p-1 rounded transition-colors",
                            isZenVoid
                                ? "text-white/30 hover:text-white/60 hover:bg-white/5"
                                : "text-white/40 hover:text-white/70 hover:bg-white/10"
                        )}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 py-3">
                    {status === 'available' && (
                        <div className="space-y-3">
                            <p className={clsx(
                                "text-sm",
                                isZenVoid ? "text-white/60" : "text-white/70"
                            )}>
                                Version <span className="font-semibold text-white">{updateInfo?.version}</span> is available.
                            </p>
                            <button
                                onClick={handleDownload}
                                className={clsx(
                                    "w-full py-2 px-4 rounded-lg text-sm font-medium",
                                    "flex items-center justify-center gap-2",
                                    "transition-all duration-200",
                                    isZenVoid
                                        ? "bg-white/10 hover:bg-white/15 text-white/90"
                                        : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
                                )}
                            >
                                <Download className="w-4 h-4" />
                                Download Update
                            </button>
                        </div>
                    )}

                    {status === 'downloading' && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className={isZenVoid ? "text-white/50" : "text-white/60"}>
                                    Downloading...
                                </span>
                                <span className={isZenVoid ? "text-white/70" : "text-white/80"}>
                                    {Math.round(downloadProgress)}%
                                </span>
                            </div>
                            <div className={clsx(
                                "h-1.5 rounded-full overflow-hidden",
                                isZenVoid ? "bg-white/10" : "bg-white/5"
                            )}>
                                <motion.div
                                    className={clsx(
                                        "h-full rounded-full",
                                        isZenVoid
                                            ? "bg-gradient-to-r from-white/40 to-white/60"
                                            : "bg-gradient-to-r from-purple-500 to-purple-400"
                                    )}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${downloadProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>
                    )}

                    {status === 'downloaded' && (
                        <div className="space-y-3">
                            <p className={clsx(
                                "text-sm",
                                isZenVoid ? "text-white/60" : "text-white/70"
                            )}>
                                Update downloaded. Restart to apply.
                            </p>
                            <button
                                onClick={handleInstall}
                                className={clsx(
                                    "w-full py-2 px-4 rounded-lg text-sm font-medium",
                                    "flex items-center justify-center gap-2",
                                    "transition-all duration-200",
                                    isZenVoid
                                        ? "bg-white/90 hover:bg-white text-black"
                                        : "bg-purple-500 hover:bg-purple-400 text-white"
                                )}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Restart Now
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-2">
                            <p className={clsx(
                                "text-sm",
                                "text-red-400/80"
                            )}>
                                Update failed
                            </p>
                            {errorMessage && (
                                <p className={clsx(
                                    "text-xs font-mono p-2 rounded",
                                    isZenVoid ? "bg-white/5 text-white/50" : "bg-red-500/10 text-red-300/70"
                                )}>
                                    {errorMessage}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
