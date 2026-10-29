import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

/** Pixel icons for the menus (student and teacher headers and docks), sized by `className`. */
const navIcon = (name: PixelIconName) =>
  function NavIcon({ className }: { className?: string }) {
    return <PixelIcon name={name} className={className} />;
  };

export const HomeIcon = navIcon("home");
export const BookIcon = navIcon("book");
export const VideoIcon = navIcon("video");
export const TaskIcon = navIcon("task");
export const PlayIcon = navIcon("play");
export const GridIcon = navIcon("grid");
export const UsersIcon = navIcon("users");
export const ClockIcon = navIcon("clock");
export const PawIcon = navIcon("paw");
/** «Хичээл солих», «Анги солих» */
export const SwapIcon = navIcon("swap");
export const MoonIcon = navIcon("moon");
export const SunIcon = navIcon("sun");
export const LogOutIcon = navIcon("logout");
