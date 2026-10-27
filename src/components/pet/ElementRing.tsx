import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PetElement } from "@/lib/types";
import "./ElementRing.css";

type ElementRingProps = {
  element: PetElement;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/** A round frame whose ring animation matches the pet's element. */
export function ElementRing({ element, className, style, children }: ElementRingProps) {
  return (
    <div data-element={element} className={cn("el-ring", className)} style={style}>
      <span className="el-body">{children}</span>
    </div>
  );
}
