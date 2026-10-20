// components/dashboard/RecentCreations.tsx
import { Activity } from "lucide-react";
import RecentList from "./RecentList";

interface ActiveItem {
  id: string;
  name: string;
  tag: string;
}

export default function RecentCreations({
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
      title="Novas Criações"
      icon={<Activity size={20} className="text-blue-600" />}
      items={items}
      page={page}
      totalPages={totalPages}
      onNextPage={onNextPage}
      onPrevPage={onPrevPage}
      emptyMessage="Nenhum ativo criado recentemente"
    />
  );
}
