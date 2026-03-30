// SlotContext — provides current slot name across the component tree
import React from "react";

const SlotContext = React.createContext<string>("default");

export function SlotProvider({
  slot,
  children,
}: {
  slot: string;
  children: React.ReactNode;
}): React.ReactElement {
  return <SlotContext.Provider value={slot}>{children}</SlotContext.Provider>;
}

export function useSlot(): string {
  return React.useContext(SlotContext);
}
