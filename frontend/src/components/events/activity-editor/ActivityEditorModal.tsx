import type { CSSProperties, ReactNode, RefObject } from "react";

import { Modal } from "../../ui/Modal";
import { ActivityType, Id, MultiRecurringDefinition } from "../../../../../shared/types";
import { ActivityEditorHeader } from "./ActivityEditorHeader";
import { ActivityEditorBasicFields } from "./ActivityEditorBasicFields";
import { ActivityAttachments } from "./ActivityAttachments";

type ActivityEditorHeaderPropsGroup = {
  activityType: ActivityType;
  multiDefs: MultiRecurringDefinition[];
  hasChanges: boolean;
  onActivityTypeChange: (activityType: ActivityType) => void;
  onMultiDefsChange: (multiDefs: MultiRecurringDefinition[]) => void;
  onSave: () => void;
};

type ActivityEditorBasicFieldsPropsGroup = {
  title: string;
  completed: boolean;
  showNameHelp: boolean;
  nameHelpRef?: RefObject<HTMLDivElement | null>;
  titleRef?: RefObject<HTMLTextAreaElement | null>;

  onTitleChange: (title: string) => void;
  onCompletedChange: (completed: boolean) => void;
  onShowNameHelpChange: (show: boolean) => void;
};

type ActivityEditorAttachmentsProps = {
  show: boolean;
  attachments: any[];
  searchResults: any[];
  linkedIds: Set<Id>;
  searchQuery: string;
  isDropdownOpen: boolean;
  dropdownRef?: RefObject<HTMLDivElement | null>;

  onSearchQueryChange: (query: string) => void;
  onOpenDropdown: () => void;
  onToggleAttachment: (itemId: Id, shouldLink: boolean) => void;
  onOpenNote: (noteId: Id) => void;
  onOpenProject: (projectId: Id) => void;
};

type ActivityEditorModalProps = {
  isOpen: boolean;
  zIndexStyle?: CSSProperties;
  contentRef?: RefObject<HTMLDivElement | null>;
  body: ReactNode;
  onClose: () => void;

  headerProps: ActivityEditorHeaderPropsGroup;
  basicFieldsProps: ActivityEditorBasicFieldsPropsGroup;
  attachmentsProps: ActivityEditorAttachmentsProps;
};

export const ActivityEditorModal = ({
  isOpen,
  zIndexStyle,
  contentRef,
  body,
  onClose,
  headerProps,
  basicFieldsProps,
  attachmentsProps,
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
      <ActivityEditorHeader
        activityType={headerProps.activityType}
        multiDefs={headerProps.multiDefs}
        hasChanges={headerProps.hasChanges}
        onActivityTypeChange={headerProps.onActivityTypeChange}
        onMultiDefsChange={headerProps.onMultiDefsChange}
        onSave={headerProps.onSave}
        onClose={onClose}
      />
      <ActivityEditorBasicFields
        activityType={headerProps.activityType}
        {...basicFieldsProps}
      />
      {body}
      {attachmentsProps.show && (
        <ActivityAttachments
          attachments={attachmentsProps.attachments}
          searchResults={attachmentsProps.searchResults}
          linkedIds={attachmentsProps.linkedIds}
          searchQuery={attachmentsProps.searchQuery}
          isDropdownOpen={attachmentsProps.isDropdownOpen}
          dropdownRef={attachmentsProps.dropdownRef}
          onSearchQueryChange={attachmentsProps.onSearchQueryChange}
          onOpenDropdown={attachmentsProps.onOpenDropdown}
          onToggleAttachment={attachmentsProps.onToggleAttachment}
          onOpenNote={attachmentsProps.onOpenNote}
          onOpenProject={attachmentsProps.onOpenProject}
        />
      )}
    </Modal>
  );
};