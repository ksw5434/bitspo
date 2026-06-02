"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortableCategoryItem = {
  id: string;
  name: string;
};

type SortableCategoryListProps = {
  items: SortableCategoryItem[];
  /** 드래그 종료 시 새 순서 저장 */
  onReorder: (orderedItems: SortableCategoryItem[]) => Promise<void>;
  /** 수정 중인 행 ID (해당 행은 드래그 비활성) */
  editingId?: string | null;
  /** 순서 저장 중 */
  isSavingOrder?: boolean;
  /** 행 오른쪽 액션 버튼 (수정·삭제) */
  renderActions: (item: SortableCategoryItem) => React.ReactNode;
  /** 수정 모드일 때 행 전체 UI */
  renderEditRow?: (item: SortableCategoryItem) => React.ReactNode;
};

function SortableCategoryRow({
  item,
  isEditing,
  isDragDisabled,
  renderActions,
  renderEditRow,
}: {
  item: SortableCategoryItem;
  isEditing: boolean;
  isDragDisabled: boolean;
  renderActions: (item: SortableCategoryItem) => React.ReactNode;
  renderEditRow?: (item: SortableCategoryItem) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: isDragDisabled || isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isEditing && renderEditRow) {
    return (
      <li
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30"
      >
        {renderEditRow(item)}
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3",
        isDragging && "z-10 bg-accent shadow-md rounded-md opacity-90",
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          className={cn(
            "touch-none shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted",
            (isDragDisabled || isEditing) && "opacity-30 pointer-events-none",
          )}
          aria-label={`${item.name} 순서 변경`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <p className="text-sm font-medium truncate">{item.name}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">{renderActions(item)}</div>
    </li>
  );
}

export function SortableCategoryList({
  items,
  onReorder,
  editingId = null,
  isSavingOrder = false,
  renderActions,
  renderEditRow,
}: SortableCategoryListProps) {
  const [localItems, setLocalItems] = useState(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localItems.findIndex((item) => item.id === active.id);
    const newIndex = localItems.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(localItems, oldIndex, newIndex);
    const previous = localItems;
    setLocalItems(reordered);

    try {
      await onReorder(reordered);
    } catch {
      setLocalItems(previous);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {isSavingOrder
          ? "순서 저장 중..."
          : "왼쪽 핸들을 드래그하여 순서를 변경할 수 있습니다."}
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => void handleDragEnd(event)}
      >
        <SortableContext
          items={localItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul
            className={cn(
              "divide-y divide-border rounded-md border border-border",
              isSavingOrder && "opacity-60 pointer-events-none",
            )}
          >
            {localItems.map((item) => (
              <SortableCategoryRow
                key={item.id}
                item={item}
                isEditing={editingId === item.id}
                isDragDisabled={isSavingOrder}
                renderActions={renderActions}
                renderEditRow={renderEditRow}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
