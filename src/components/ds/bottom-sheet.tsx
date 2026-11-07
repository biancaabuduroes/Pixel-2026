"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Icon } from "./icon";

/**
 * Figma: BottomSheet (node 37:305). Drawer over the parent screen with the bg-scrim overlay,
 * 24px top radius, grabber, close button, display title; content is swapped per use.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  header = "center",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /**
   * "left": buyer-flow sheets (Joined, Pickup code) — left title-xl and a grey round close button.
   * "nav": Search drawer (B3.2) — 44px grey close on the left, centred title-md, full height.
   */
  header?: "center" | "left" | "nav";
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} swipeDirection="down">
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-50 bg-bg-scrim transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
          <Drawer.Popup className={`relative flex ${header === "nav" ? "h-[93dvh] overflow-hidden px-3" : "max-h-[90dvh] gap-4 overflow-y-auto px-page pb-6"} w-full max-w-[430px] flex-col items-center rounded-t-xl bg-bg-surface pt-2 shadow-sheet outline-none [transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-300 data-ending-style:[transform:translateY(100%)] data-starting-style:[transform:translateY(100%)]`}>
            <div className="h-[5px] w-9 shrink-0 rounded-pill bg-bg-strong" aria-hidden />
            {header === "nav" ? (
              <div className="flex h-navbar w-full items-center">
                <Drawer.Close aria-label="Închide" className="flex size-control-md shrink-0 items-center justify-center rounded-pill bg-bg-muted outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
                  <Icon name="close-24" size={24} />
                </Drawer.Close>
                <Drawer.Title className="flex-1 text-center title-md text-text-primary">{title}</Drawer.Title>
                <span className="size-control-md shrink-0" aria-hidden />
              </div>
            ) : header === "left" ? (
              <div className="flex w-full items-center justify-between gap-3">
                <Drawer.Title className="title-xl text-text-primary">{title}</Drawer.Title>
                <Drawer.Close aria-label="Închide" className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-bg-muted outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
                  <Icon name="close-24" size={20} />
                </Drawer.Close>
              </div>
            ) : (
              <>
                <Drawer.Close aria-label="Închide" className="absolute top-2 right-2 flex size-control-md items-center justify-center rounded-pill outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
                  <Icon name="close-24" size={24} />
                </Drawer.Close>
                <Drawer.Title className="w-full px-10 text-center display-md text-text-primary">{title}</Drawer.Title>
              </>
            )}
            <Drawer.Content className={header === "nav" ? "flex min-h-0 w-full flex-1 flex-col" : "flex w-full flex-col gap-4 pb-[34px]"}>{children}</Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export const BottomSheetClose = Drawer.Close;
