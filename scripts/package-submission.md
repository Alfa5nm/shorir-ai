# Package Submission Checklist

Final files should be named:

- `deliverables/SHORIR_AI_Source_Code.zip`
- `deliverables/SHORIR_AI_Project_Presentation.pptx`
- `deliverables/SHORIR_AI_Technical_Report.docx`
- `deliverables/SHORIR_AI_Demo_Walkthrough.mp4`
- `deliverables/SHORIR_AI_Demo_Sequence.md`

Before packaging:

- Run `pnpm -r typecheck`.
- Run `pnpm -r lint`.
- Run `pnpm -r test`.
- Run `pnpm -r build`.
- Confirm live website URL: https://shorir-ai-production.up.railway.app
- Confirm live backend health URL: https://shorir-ai-production.up.railway.app/api/health
- Confirm `/demo` presents the first-time walkthrough.
- Confirm no `.env`, dependency folders, build folders, or secrets are included in the source archive.
