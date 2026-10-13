import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CalendarRange,
  Combine,
  Copy,
  Download,
  FileImage,
  FileInput,
  FileOutput,
  FilePenLine,
  FileSearch,
  GitCompareArrows,
  History,
  Images,
  IndianRupee,
  ListFilter,
  Mail,
  MessagesSquare,
  Minimize2,
  RefreshCcw,
  RotateCw,
  ScanText,
  Scissors,
  Sparkles,
  Tags,
  UploadCloud,
  Wand2,
} from 'lucide-react'

/**
 * Lucide registry for the Career Tools.
 *
 * The tool catalog in `src/tools/registry.js` is plain data (importable from
 * anywhere, including the Node smoke harness), so icons are referenced by name
 * and resolved here at render time — exactly like the nav icon registry.
 */
export const TOOL_ICONS = {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CalendarRange,
  Combine,
  Copy,
  Download,
  FileImage,
  FileInput,
  FileOutput,
  FilePenLine,
  FileSearch,
  GitCompareArrows,
  History,
  Images,
  IndianRupee,
  ListFilter,
  Mail,
  MessagesSquare,
  Minimize2,
  RefreshCcw,
  RotateCw,
  ScanText,
  Scissors,
  Sparkles,
  Tags,
  UploadCloud,
  Wand2,
}

/** Resolves a registry `icon` string; unknown names fall back to Sparkles. */
export function getToolIcon(name) {
  return TOOL_ICONS[name] ?? Sparkles
}

export default TOOL_ICONS
