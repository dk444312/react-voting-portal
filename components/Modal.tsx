
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isConfirming?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, children, confirmText = "Confirm", cancelText = "Cancel", isConfirming = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 text-center animate-fade-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{title}</h3>
                <div className="my-4 text-gray-600 dark:text-gray-300">
                    {children}
                </div>
                <div className="flex gap-4 justify-center mt-6">
                    <button
                        onClick={onConfirm}
                        disabled={isConfirming}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition disabled:bg-green-400 disabled:cursor-wait"
                    >
                        {isConfirming ? 'Confirming...' : confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isConfirming}
                        className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
