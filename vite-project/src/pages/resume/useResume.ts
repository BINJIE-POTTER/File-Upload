import { useContext } from "react";
import { ResumeContext } from "./resumeContext";

/**
 * useResume - 简历 Context Hook
 *
 * 提供访问 ResumeContext 的快捷方式
 */
export function useResume() {
  return useContext(ResumeContext);
}
