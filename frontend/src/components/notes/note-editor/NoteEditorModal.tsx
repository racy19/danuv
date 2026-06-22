import type { CSSProperties, RefObject } from "react";
import type { Id, NoteType } from "../../../../../shared/types";
import { Modal } from "../../ui/Modal";
import { NoteEditorHeader } from "./NoteEditorHeader";
import { NoteTitleInput } from "./NoteTitleInput";
import { NoteContentInput } from "./NoteContentInput";
import { NoteLinkedItems } from "./NoteLinkedItems";
import { NoteLinkSearch } from "./NoteLinkSearch";
import type { LinkedNoteTarget, RenderableCalendarItem } from "../../../types/renderType";
type NoteEditorModalProps = {
  isOpen: boolean;
  zIndexStyle?: CSSProperties;

  noteType: NoteType;
  title: string;
  content: string;

  hasChanges: boolean;

  linkedItems: LinkedNoteTarget[];
  searchResults: RenderableCalendarItem[];
  linkedIds: Set<Id>;

  isLinkDropdownOpen: boolean;
  linkSearchQuery: string;

  noteTitleRef?: RefObject<HTMLTextAreaElement | null>;
  linkDropdownRef?: RefObject<HTMLDivElement | null>;

  onClose: () => void;
  onSave: () => void;

  onNoteTypeChange: (noteType: NoteType) => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;

  onUnlinkItem: (itemId: Id) => void;
  onLinkSearchQueryChange: (query: string) => void;
  onOpenLinkDropdown: () => void;
  onToggleLink: (itemId: Id, shouldLink: boolean) => void;
};

export const NoteEditorModal = ({
  isOpen,
  zIndexStyle,

  noteType,
  title,
  content,

  hasChanges,

  linkedItems,
  searchResults,
  linkedIds,

  isLinkDropdownOpen,
  linkSearchQuery,

  noteTitleRef,
  linkDropdownRef,

  onClose,
  onSave,

  onNoteTypeChange,
  onTitleChange,
  onContentChange,

  onUnlinkItem,
  onLinkSearchQueryChange,
  onOpenLinkDropdown,
  onToggleLink,
}: NoteEditorModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-yellow-50 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] h-auto border border-yellow-200 relative transition-all duration-300"
      overlayClassName="bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      style={zIndexStyle}
    >
      <NoteEditorHeader
        noteType={noteType}
        hasChanges={hasChanges}
        onNoteTypeChange={onNoteTypeChange}
        onSave={onSave}
        onClose={onClose}
      />

      <NoteTitleInput
        value={title}
        onChange={onTitleChange}
        inputRef={noteTitleRef}
      />

      {noteType !== "heading" && (
        <NoteContentInput
          value={content}
          onChange={onContentChange}
        />
      )}

      <div className="bg-yellow-100/50 p-3 border-t border-yellow-200 flex flex-col gap-2 shrink-0">
        <NoteLinkedItems
          items={linkedItems}
          onUnlink={onUnlinkItem}
        />

        <NoteLinkSearch
          query={linkSearchQuery}
          results={searchResults}
          linkedIds={linkedIds}
          isOpen={isLinkDropdownOpen}
          containerRef={linkDropdownRef}
          onQueryChange={onLinkSearchQueryChange}
          onOpen={onOpenLinkDropdown}
          onToggleLink={onToggleLink}
        />
      </div>
    </Modal>
  );
};