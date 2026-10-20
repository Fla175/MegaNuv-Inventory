// components/dashboard/RecentMovements.tsx
import { ArrowLeftRight } from "lucide-react";
import RecentList from "./RecentList";

interface ActiveItem {
  id: string;
  name: string;
  tag: string;
  fromSpaceId?: string;
  toSpaceId?: string;
}

export default function RecentMovements({
  items,
  page,
  totalPages,
  onNextPage,
  onPrevPage,
}: {
  items: ActiveItem[];
  page: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
}) {
  return (
    <RecentList
      title="Movimentações"
      icon={<ArrowLeftRight size={20} className="text-amber-500" />}
      items={items}
      page={page}
      totalPages={totalPages}
      onNextPage={onNextPage}
      onPrevPage={onPrevPage}
      emptyMessage="Sem movimentações registradas"
    />
  );
}
