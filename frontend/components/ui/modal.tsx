
// @ts-nocheck
import * as Dialog from '@radix-ui/react-dialog';
import { ReactNode } from 'react';

export function Modal({ open, onClose, children }: { open: boolean, onClose: () => void, children: ReactNode }) {
    return (
        <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
                <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-xl shadow-xl p-6 w-full max-w-md">
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export function ModalHeader({ children }: { children: ReactNode }) {
    return <div className="text-xl font-bold mb-4">{children}</div>;
}
export function ModalContent({ children }: { children: ReactNode }) {
    return <div className="mb-4">{children}</div>;
}
export function ModalFooter({ children }: { children: ReactNode }) {
    return <div className="flex gap-2 justify-end">{children}</div>;
} 