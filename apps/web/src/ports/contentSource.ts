import type { abstractContent } from "@shorir/content";

export interface ReportContent {
  title: string;
  sections: Array<{ heading: string; body: string }>;
}

export interface PresentationContent {
  title: string;
  slides: Array<{ title: string; bullets: string[] }>;
}

export interface ContentSource {
  getProductContent(): typeof abstractContent;
  getReportContent(): ReportContent;
  getPresentationContent(): PresentationContent;
}
