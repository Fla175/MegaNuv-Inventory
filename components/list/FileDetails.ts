// components/list/FileDetails.ts
import { FileText, File, Image } from "lucide-react";

export interface FileDetail {
  displayName: string;
  extension: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
  bgClass: string;
}

export function getFileDetails(url: string): FileDetail {
  const rawFilename = url.split("/").pop()?.split("?")[0] || "link-anexado";
  const displayName = decodeURIComponent(rawFilename);

  const extMatch = displayName.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extMatch ? extMatch[1].toLowerCase() : "link";

  let Icon = LinkIcon;
  let colorClass = "text-gray-500";
  let bgClass = "bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700";

  if (extension === "pdf") {
    Icon = FileText;
    colorClass = "text-red-500";
    bgClass = "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50";
  } else if (["doc", "docx"].includes(extension)) {
    Icon = File;
    colorClass = "text-blue-500";
    bgClass = "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50";
  } else if (["png", "jpg", "jpeg"].includes(extension)) {
    Icon = Image;
    colorClass = "text-emerald-500";
    bgClass = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50";
  }

  return { displayName, extension, Icon, colorClass, bgClass };
}

import { LinkIcon } from "lucide-react";
