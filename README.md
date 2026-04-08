# SPECTRUM — Autism Detection Toolkit

A cyberpunk-styled web application for autism pre-diagnostic screening. Implements 6 validated clinical questionnaires as an interactive self-report battery.

## Tests Included

| Test | Questions | What it measures | Reference |
|------|-----------|-----------------|-----------|
| **AQ-50** | 50 | Autistic traits (social, communication, attention, imagination) | Baron-Cohen et al. (2001) |
| **CAT-Q** | 25 | Social camouflaging / masking of autistic traits | Hull et al. (2019) |
| **RAADS-R** | 80 | Comprehensive autism diagnostic scale (97% sensitivity) | Ritvo et al. (2011) |
| **EQ** | 60 | Empathy (cognitive + emotional) | Baron-Cohen & Wheelwright (2004) |
| **SQ** | 75 | Systemizing drive | Wheelwright et al. (2006) |
| **RBQ-2A** | 20 | Restricted & repetitive behaviours | Barrett et al. (2015) |

## Features

- **Battery mode** — run multiple tests in sequence with auto-advance
- **Score context bars** — visual comparison against clinical norms (NT mean, threshold, autistic mean)
- **Progress auto-save** — resume after browser crash
- **Question review** — review missing answers before submit
- **PDF export** — individual or combined multi-test reports with cover page
- **Keyboard-driven** — full keyboard navigation (number keys, arrows, ESC, F-keys)

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- jsPDF (PDF export)
- localStorage (data persistence)

## Development

```bash
npm install
npm run dev
```

## Disclaimer

This application is for **informational and educational purposes only**. It is not a medical device and does not provide clinical diagnoses. Results should be interpreted by a qualified healthcare professional.

All questionnaires are the intellectual property of their respective authors and institutions. This implementation is for personal screening use only.

## License

MIT
