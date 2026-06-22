import type { CSSProperties, ReactNode, Ref } from "react";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    overlayClassName?: string;
    style?: CSSProperties;
    contentRef?: Ref<HTMLDivElement>;
};

export const Modal = ({
    isOpen,
    onClose,
    children,
    className = "",
    overlayClassName = "",
    style,
    contentRef,
}: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center ${overlayClassName}`}
            style={style}
            onClick={onClose}
        >
            <div
                ref={contentRef}
                className={className}
                onClick={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};