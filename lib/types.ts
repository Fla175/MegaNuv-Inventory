import { FatherSpace, Active } from "@prisma/client";

export interface ListSectionFilters {
  query?: string;
  category?: string;
  manufacturer?: string;
  model?: string;
}

export interface ListSectionProps {
  filters: ListSectionFilters;
  onEdit: (item: Active, mode: 'view' | 'edit') => void; 
  onClone: (item: Active) => void;
  onRefresh: () => void;
  onMove?: (item: Active) => void;
  actives: Active[];
  fatherSpaces: FatherSpace[];
}