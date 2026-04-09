import { createContext } from "react";
import type { ResumeCtx } from "./resume-context-types";

export const ResumeContext = createContext<ResumeCtx>(null!);
