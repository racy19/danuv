import type { CSSProperties, ReactNode, RefObject } from "react";

import { Modal } from "../../ui/Modal";

type ActivityEditorModalProps = {
  isOpen: boolean;
  zIndexStyle?: CSSProperties;
  contentRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  onClose: () => void;
};

export const ActivityEditorModal = ({
  isOpen,
  zIndexStyle,
  contentRef,
  children,
  onClose,
}: ActivityEditorModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      contentRef={contentRef}
      className="bg-blue-50 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] h-auto border border-blue-200 relative transition-all duration-300"
      overlayClassName="bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      style={zIndexStyle}
    >
      {children}
    </Modal>
  );
};