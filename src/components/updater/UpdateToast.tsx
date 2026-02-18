import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, } from 'lucide-react';
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
    const bgColor = 'var(--note-bg)';
    const borderColor = 'var(--note-border)';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="fixed bottom-5 right-5 z-9999 w-72 p-4 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]"
                style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`,
                }}
            >
                {/* Header row: title + close button */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <p className="text-sm font-medium mb-1 text-(--note-title)">
                            {getTitle()}
                        </p>
                        <p className="text-xs text-(--note-text-muted)">
                            {getSubtitle()}
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="cursor-pointer text-(--note-control-muted) hover:text-(--note-control) transition-colors -mt-0.5"
                    >
                        <X size={15} strokeWidth={2} />
                    </button>
                </div>

                {/* Progress bar for downloading state */}
                {status === 'downloading' && (
                    <div className="mt-3 h-1 rounded-full overflow-hidden bg-(--note-control-bg-hover)">
                        <motion.div
                            className="h-full rounded-full bg-(--note-control-bg-active)"
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
                        className="mt-3 cursor-pointer text-xs font-medium text-(--note-title) transition-colors hover:text-(--note-control)"
                    >
                        {actionText}
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

