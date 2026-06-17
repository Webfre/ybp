import type { IconType } from "react-icons";
import {
  FaBook,
  FaCheckCircle,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaCog,
  FaDatabase,
  FaDownload,
  FaExclamationTriangle,
  FaFilter,
  FaHistory,
  FaHome,
  FaInfoCircle,
  FaLink,
  FaList,
  FaPen,
  FaPlus,
  FaRedoAlt,
  FaSave,
  FaSearch,
  FaServer,
  FaShieldAlt,
  FaSpinner,
  FaThLarge,
  FaTimes,
  FaTrash,
  FaUserCircle,
} from "react-icons/fa";

export const ICONS = {
  book: FaBook,
  check: FaCheckCircle,
  "chevron-down": FaChevronDown,
  "chevron-left": FaChevronLeft,
  "chevron-right": FaChevronRight,
  "chevron-up": FaChevronUp,
  catalog: FaBook,
  dashboard: FaHome,
  database: FaDatabase,
  download: FaDownload,
  edit: FaPen,
  error: FaExclamationTriangle,
  filter: FaFilter,
  history: FaHistory,
  info: FaInfoCircle,
  link: FaLink,
  list: FaList,
  plus: FaPlus,
  refresh: FaRedoAlt,
  remove: FaTimes,
  save: FaSave,
  search: FaSearch,
  server: FaServer,
  settings: FaCog,
  shield: FaShieldAlt,
  spinner: FaSpinner,
  "th-large": FaThLarge,
  trash: FaTrash,
  user: FaUserCircle,
  warning: FaExclamationTriangle,
} satisfies Record<string, IconType>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  className?: string;
  name: IconName;
};

export function Icon({ className, name }: IconProps) {
  const IconComponent = ICONS[name] ?? FaInfoCircle;

  return <IconComponent aria-hidden="true" className={className} />;
}
