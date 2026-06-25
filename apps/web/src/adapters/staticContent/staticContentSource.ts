import { abstractContent, rulebookContent } from "@shorir/content";
import type { ContentSource } from "../../ports/contentSource";

export function createStaticContentSource(): ContentSource {
  return {
    getProductContent: () => abstractContent,
    getReportContent: () => ({
      title: "SHORIR AI Technical Report",
      sections: [
        { heading: "Problem", body: abstractContent.problem },
        { heading: "Solution", body: abstractContent.solution },
        { heading: "AI Role", body: abstractContent.aiRole },
        { heading: "Rulebook Alignment", body: rulebookContent.requirements.join(" ") }
      ]
    }),
    getPresentationContent: () => ({
      title: "SHORIR AI by Team El Bracino",
      slides: [
        { title: "Problem", bullets: [abstractContent.problem] },
        { title: "Solution", bullets: [abstractContent.solution] },
        { title: "AI Architecture", bullets: [abstractContent.aiRole] },
        { title: "MVP Demo", bullets: [abstractContent.mvp] }
      ]
    })
  };
}
