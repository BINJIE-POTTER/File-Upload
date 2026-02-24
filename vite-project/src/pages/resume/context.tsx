import React, { createContext, useContext, useState, useCallback } from "react";
import { type Block, DEFAULTS, mkPI, mkTitle, mkList, lighten } from "./types";

type ResumeCtx = {
  blocks:     Block[];
  setBlocks:  React.Dispatch<React.SetStateAction<Block[]>>;
  color:      string;
  lightColor: string;
  setColor:   (c: string) => void;
  padding:    number; // mm
  setPadding: (p: number) => void;
  addBlock:   (type: Block["type"]) => void;
};

const Ctx = createContext<ResumeCtx>(null!);

/** Access the shared resume state from any child component. */
export const useResume = () => useContext(Ctx);

/** Provides global resume state (blocks, colour, padding) to the component tree. */
export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [blocks,  setBlocks]  = useState<Block[]>(DEFAULTS);
  const [color,   setColor]   = useState("#3b82f6");
  const [padding, setPadding] = useState(15);

  const lightColor = lighten(color, 0.85);

  const addBlock = useCallback((type: Block["type"]) => {
    const block = type === "pi" ? mkPI() : type === "title" ? mkTitle() : mkList();
    setBlocks(bs => [...bs, block]);
  }, []);

  return (
    <Ctx.Provider value={{ blocks, setBlocks, color, lightColor, setColor, padding, setPadding, addBlock }}>
      {children}
    </Ctx.Provider>
  );
}
