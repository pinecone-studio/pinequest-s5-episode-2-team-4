"use client";

import Link from "next/link";
import { useState } from "react";
import { switchTheme } from "@/components/ThemeToggle";
import { cn } from "@/lib/cn";
import { logOut } from "@/lib/actions";
import { MenuPopover, menuItemClass } from "./MenuPopover";
import { LogOutIcon, MoonIcon, SunIcon } from "./navIcons";

/** Every row has an icon of this size, so the labels line up. */
const ICON = "size-4.5 text-ink-muted";

type AccountMenuProps = {
  /** What the button shows: the pet chip, or the teacher's initial */
  trigger: React.ReactNode;
  label: string;
  /** First line of the panel, e.g. the pet or the teacher's name */
  title: string;
  subtitle?: string;
  links?: { href: string; label: string; detail?: string; icon: React.ReactNode }[];
  triggerClassName?: string;
};

/**
 * The account panel in the header: a few links, the dark / light switch and
 * «Гарах», so the header itself keeps only the sections.
 */
export function AccountMenu({ trigger, label, title, subtitle, links = [], triggerClassName }: AccountMenuProps) {
  // Read when the panel opens, so it names the theme you'd switch to.
  const [dark, setDark] = useState(false);

  return (
    <MenuPopover
      trigger={trigger}
      label={label}
      align="end"
      triggerClassName={triggerClassName}
      onOpen={() => setDark(document.documentElement.dataset.theme === "dark")}
    >
      <div className="px-3 pt-2 pb-2.5">
        <p className="font-bold">{title}</p>
        {subtitle && <p className="text-xs font-semibold text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-col border-t border-line pt-1.5">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={menuItemClass}>
            <span className={cn("flex *:size-full", ICON)}>{l.icon}</span>
            <span className="flex-1">{l.label}</span>
            {l.detail && <span className="text-xs text-ink-muted">{l.detail}</span>}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            switchTheme();
            setDark(!dark);
          }}
          className={menuItemClass}
        >
          {dark ? <SunIcon className={ICON} /> : <MoonIcon className={ICON} />}
          {dark ? "Light mode" : "Dark mode"}
        </button>
        <form action={logOut}>
          <button type="submit" className={menuItemClass}>
            <LogOutIcon className={ICON} />
            Гарах
          </button>
        </form>
      </div>
    </MenuPopover>
  );
}
