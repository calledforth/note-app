import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, } from 'lucide-react';
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

    // DEBUG: Keyboard shortcut to test toast (Ctrl+Shift+U)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'U') {
                e.preventDefault();
                setDismissed(false);
                setStatus((prev) => {
                    const states: UpdateStatus[] = ['available', 'downloading', 'downloaded', 'error', 'idle'];
                    const currentIndex = states.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % states.length;
                    const nextState = states[nextIndex];

                    // Set mock data for each state
                    if (nextState === 'available') {
                        setUpdateInfo({ version: '2.4.0' });
                    } else if (nextState === 'downloading') {
                        setDownloadProgress(45);
                    } else if (nextState === 'error') {
                        setErrorMessage('Network connection failed');
                    }

                    console.log('[UpdateToast] Debug: Switching to', nextState);
                    return nextState;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

    // Determine content based on status
    const getTitle = () => {
        switch (status) {
            case 'available': return 'Update available';
            case 'downloading': return 'Downloading update';
            case 'downloaded': return 'Ready to install';
            case 'error': return 'Update failed';
            default: return '';
        }
    };

    const getSubtitle = () => {
        switch (status) {
            case 'available': return `Version ${updateInfo?.version} is ready`;
            case 'downloading': return `${Math.round(downloadProgress)}% complete`;
            case 'downloaded': return `Version ${updateInfo?.version} downloaded`;
            case 'error': return errorMessage?.slice(0, 50) || 'An error occurred';
            default: return '';
        }
    };

    const getActionText = () => {
        switch (status) {
            case 'available': return 'Install now';
            case 'downloaded': return 'Restart now';
            default: return null;
        }
    };

    const handleAction = () => {
        if (status === 'available') {
            handleDownload();
        } else if (status === 'downloaded') {
            handleInstall();
        }
    };

    const actionText = getActionText();

    // Theme-specific colors
    const bgColor = isZenVoid ? 'var(--void-bg)' : 'var(--wabi-bg)';
    const borderColor = isZenVoid ? 'var(--void-border)' : 'var(--wabi-border)';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="fixed bottom-4 right-4 z-[9999] w-60 p-3 rounded-lg"
                style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`,
                }}
            >
                {/* Header row: title + close button */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <p className={clsx(
                            "text-[13px] mb-0.5",
                            isZenVoid ? "text-[var(--void-title)]" : "text-[var(--wabi-text)]"
                        )}>
                            {getTitle()}
                        </p>
                        <p className={clsx(
                            "text-[11px]",
                            isZenVoid ? "text-[var(--void-text)]" : "text-[var(--wabi-text-muted)]"
                        )}>
                            {getSubtitle()}
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-white/70 hover:text-white/90 transition-colors"
                    >
                        <X size={13} strokeWidth={2} />
                    </button>
                </div>

                {/* Progress bar for downloading state */}
                {status === 'downloading' && (
                    <div className={clsx(
                        "mt-2.5 h-0.5 rounded-full overflow-hidden",
                        isZenVoid ? "bg-white/5" : "bg-white/10"
                    )}>
                        <motion.div
                            className={clsx(
                                "h-full rounded-full",
                                isZenVoid ? "bg-white/30" : "bg-[var(--wabi-text-muted)]"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${downloadProgress}%` }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                )}

                {/* Action button */}
                {actionText && (
                    <button
                        onClick={handleAction}
                        className={clsx(
                            "mt-2.5 text-[11px] transition-colors",
                            isZenVoid
                                ? "text-[var(--void-title)] hover:text-white"
                                : "text-[var(--wabi-text)] hover:text-white"
                        )}
                    >
                        {actionText}
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

