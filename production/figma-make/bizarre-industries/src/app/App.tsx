import { useEffect, useMemo, useRef, useState } from "react";
import gravityWellAsset from "figma:asset/8fc7b3897e356c8020e5e8319e6f8449fd803f32.png";
import shadedContourAsset from "figma:asset/ef9b4d6129aed5f75c122d99b123bd7de1687a02.png";
import "../styles/index.css";

type Subject = {
  id: string;
  label: string;
  chapter: string;
  chapterLabel: string;
  status: "NOT VERIFIED";
};

type LabelStateId = "live" | "ready" | "service";
type ProductionChannelId = "composite" | "k" | "spot" | "cut" | "laminate";
type PhotoStatus = "loading" | "ready" | "error";

const PHOTO_URL =
  "https://images.pexels.com/photos/13401910/pexels-photo-13401910.jpeg?cs=srgb&dl=pexels-2mephoto-13401910.jpg&fm=jpg";
const PHOTO_SOURCE_URL =
  "https://www.pexels.com/photo/close-up-of-the-switches-of-a-machine-13401910/";
const PHOTO_LICENSE_URL = "https://www.pexels.com/license/";

const SUBJECTS: Subject[] = [
  { id: "00.00", label: "Cover", chapter: "00", chapterLabel: "Entry and navigation", status: "NOT VERIFIED" },
  { id: "00.01", label: "System Map & Navigation", chapter: "00", chapterLabel: "Entry and navigation", status: "NOT VERIFIED" },
  { id: "00.02", label: "Getting Started / Authority / Source of Truth", chapter: "00", chapterLabel: "Entry and navigation", status: "NOT VERIFIED" },
  { id: "01.00", label: "Brand Core Overview", chapter: "01", chapterLabel: "Brand core", status: "NOT VERIFIED" },
  { id: "01.01", label: "Design Philosophy / Swiss-Working", chapter: "01", chapterLabel: "Brand core", status: "NOT VERIFIED" },
  { id: "01.02", label: "Recognition Grammar / Three-Distance Test", chapter: "01", chapterLabel: "Brand core", status: "NOT VERIFIED" },
  { id: "01.03", label: "Single Identity / Native Integration", chapter: "01", chapterLabel: "Brand core", status: "NOT VERIFIED" },
  { id: "01.04", label: "Voice / CATCH THE STARS / Metadata Copy", chapter: "01", chapterLabel: "Brand core", status: "NOT VERIFIED" },
  { id: "02.00", label: "Identity Overview", chapter: "02", chapterLabel: "Identity", status: "NOT VERIFIED" },
  { id: "02.01", label: "Gravity Well Master & Approved Variants", chapter: "02", chapterLabel: "Identity", status: "NOT VERIFIED" },
  { id: "02.02", label: "Name, Lockups & Coexistence", chapter: "02", chapterLabel: "Identity", status: "NOT VERIFIED" },
  { id: "02.03", label: "Clear Space, Minimum Size & Background Use", chapter: "02", chapterLabel: "Identity", status: "NOT VERIFIED" },
  { id: "02.04", label: "Invariance, Misuse & Verification", chapter: "02", chapterLabel: "Identity", status: "NOT VERIFIED" },
  { id: "03.00", label: "Color Overview", chapter: "03", chapterLabel: "Color", status: "NOT VERIFIED" },
  { id: "03.01", label: "Primitives & Neutral Chassis", chapter: "03", chapterLabel: "Color", status: "NOT VERIFIED" },
  { id: "03.02", label: "Signal Lime Operational Channel", chapter: "03", chapterLabel: "Color", status: "NOT VERIFIED" },
  { id: "03.03", label: "Data-Shaped Spectrum", chapter: "03", chapterLabel: "Color", status: "NOT VERIFIED" },
  { id: "03.04", label: "Semantic Modes & Status Colors", chapter: "03", chapterLabel: "Color", status: "NOT VERIFIED" },
  { id: "03.05", label: "Contrast & Physical/Accessible Translations", chapter: "03", chapterLabel: "Color", status: "NOT VERIFIED" },
  { id: "04.00", label: "Gradient Overview & Decision Matrix", chapter: "04", chapterLabel: "Gradients", status: "NOT VERIFIED" },
  { id: "04.01", label: "Field Gradient", chapter: "04", chapterLabel: "Gradients", status: "NOT VERIFIED" },
  { id: "04.02", label: "Optical-Coating Gradient", chapter: "04", chapterLabel: "Gradients", status: "NOT VERIFIED" },
  { id: "04.03", label: "Data-Ramp Gradient", chapter: "04", chapterLabel: "Gradients", status: "NOT VERIFIED" },
  { id: "04.04", label: "Heat Gradient", chapter: "04", chapterLabel: "Gradients", status: "NOT VERIFIED" },
  { id: "04.05", label: "Exposure Gradient", chapter: "04", chapterLabel: "Gradients", status: "NOT VERIFIED" },
  { id: "04.06", label: "Reflective-Film Gradient", chapter: "04", chapterLabel: "Gradients", status: "NOT VERIFIED" },
  { id: "04.07", label: "Material-Response Gradient", chapter: "04", chapterLabel: "Gradients", status: "NOT VERIFIED" },
  { id: "05.00", label: "Typography Overview", chapter: "05", chapterLabel: "Typography", status: "NOT VERIFIED" },
  { id: "05.01", label: "Unbounded / Display", chapter: "05", chapterLabel: "Typography", status: "NOT VERIFIED" },
  { id: "05.02", label: "Big Shoulders Stencil / Industrial", chapter: "05", chapterLabel: "Typography", status: "NOT VERIFIED" },
  { id: "05.03", label: "Hanken Grotesk / Body and UI", chapter: "05", chapterLabel: "Typography", status: "NOT VERIFIED" },
  { id: "05.04", label: "JetBrains Mono / Technical", chapter: "05", chapterLabel: "Typography", status: "NOT VERIFIED" },
  { id: "05.05", label: "Arabic Type System", chapter: "05", chapterLabel: "Typography", status: "NOT VERIFIED" },
  { id: "05.06", label: "Hierarchy, Numerals, Bilingual Composition & RTL", chapter: "05", chapterLabel: "Typography", status: "NOT VERIFIED" },
  { id: "06.00", label: "Geometry & Layout Overview", chapter: "06", chapterLabel: "Geometry and layout", status: "NOT VERIFIED" },
  { id: "06.01", label: "Continuous Lens Aperture v2", chapter: "06", chapterLabel: "Geometry and layout", status: "NOT VERIFIED" },
  { id: "06.02", label: "Precision Panel", chapter: "06", chapterLabel: "Geometry and layout", status: "NOT VERIFIED" },
  { id: "06.03", label: "Display Field", chapter: "06", chapterLabel: "Geometry and layout", status: "NOT VERIFIED" },
  { id: "06.04", label: "Grid & Spacing", chapter: "06", chapterLabel: "Geometry and layout", status: "NOT VERIFIED" },
  { id: "06.05", label: "Optical Sizes, Minimums & Responsive Scaling", chapter: "06", chapterLabel: "Geometry and layout", status: "NOT VERIFIED" },
  { id: "06.06", label: "Lines, Corners, Depth & Composition", chapter: "06", chapterLabel: "Geometry and layout", status: "NOT VERIFIED" },
  { id: "06.07", label: "Iconography, Instrument Indices & Directional Symbols", chapter: "06", chapterLabel: "Geometry and layout", status: "NOT VERIFIED" },
  { id: "07.00", label: "Atlas Patterns Overview / One Field, Many Representations", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "07.01", label: "Field Source & Provenance", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "07.02", label: "Continuous Spectral Field", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "07.03", label: "Stepped Bands", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "07.04", label: "Contour Lines", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "07.05", label: "Shaded Contour / Provisional", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "07.06", label: "Dot Density", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "07.07", label: "Hatching", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "07.08", label: "Grain and Halftone / Provisional", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "07.09", label: "Material, Reflective and UV / Provisional", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "07.10", label: "One-Color Translation / Provisional", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "07.11", label: "Micro Derivative", chapter: "07", chapterLabel: "Astronomical Atlas patterns", status: "NOT VERIFIED" },
  { id: "08.00", label: "Motion & Interaction Overview", chapter: "08", chapterLabel: "Motion and interaction", status: "NOT VERIFIED" },
  { id: "08.01", label: "Capture Sequence", chapter: "08", chapterLabel: "Motion and interaction", status: "NOT VERIFIED" },
  { id: "08.02", label: "Approach", chapter: "08", chapterLabel: "Motion and interaction", status: "NOT VERIFIED" },
  { id: "08.03", label: "Compress", chapter: "08", chapterLabel: "Motion and interaction", status: "NOT VERIFIED" },
  { id: "08.04", label: "Eclipse", chapter: "08", chapterLabel: "Motion and interaction", status: "NOT VERIFIED" },
  { id: "08.05", label: "Lock", chapter: "08", chapterLabel: "Motion and interaction", status: "NOT VERIFIED" },
  { id: "08.06", label: "Release", chapter: "08", chapterLabel: "Motion and interaction", status: "NOT VERIFIED" },
  { id: "08.07", label: "Timing & Easing", chapter: "08", chapterLabel: "Motion and interaction", status: "NOT VERIFIED" },
  { id: "08.08", label: "Reduced Motion & Low Power", chapter: "08", chapterLabel: "Motion and interaction", status: "NOT VERIFIED" },
  { id: "08.09", label: "Micro-interactions & State Feedback", chapter: "08", chapterLabel: "Motion and interaction", status: "NOT VERIFIED" },
  { id: "09.00", label: "Components Overview", chapter: "09", chapterLabel: "Components", status: "NOT VERIFIED" },
  { id: "09.01", label: "SDS / Host-Infrastructure Boundary", chapter: "09", chapterLabel: "Components", status: "NOT VERIFIED" },
  { id: "09.02", label: "Shared State, Target, Focus & RTL Contract", chapter: "09", chapterLabel: "Components", status: "NOT VERIFIED" },
  { id: "09.03", label: "Signal Action", chapter: "09", chapterLabel: "Components", status: "NOT VERIFIED" },
  { id: "09.04", label: "Status Indicator", chapter: "09", chapterLabel: "Components", status: "NOT VERIFIED" },
  { id: "09.05", label: "Atlas Panel", chapter: "09", chapterLabel: "Components", status: "NOT VERIFIED" },
  { id: "09.06", label: "Calibration Label", chapter: "09", chapterLabel: "Components", status: "NOT VERIFIED" },
  { id: "09.07", label: "Instrument Dial", chapter: "09", chapterLabel: "Components", status: "NOT VERIFIED" },
  { id: "09.08", label: "Bilingual Data Panel", chapter: "09", chapterLabel: "Components", status: "NOT VERIFIED" },
  { id: "09.09", label: "Physical Label", chapter: "09", chapterLabel: "Components", status: "NOT VERIFIED" },
  { id: "10.00", label: "Materials & Finishes Overview", chapter: "10", chapterLabel: "Materials and finishes", status: "NOT VERIFIED" },
  { id: "10.01", label: "Matte and Gloss Void", chapter: "10", chapterLabel: "Materials and finishes", status: "NOT VERIFIED" },
  { id: "10.02", label: "Aluminum and Brushed Aluminum", chapter: "10", chapterLabel: "Materials and finishes", status: "NOT VERIFIED" },
  { id: "10.03", label: "Carbon, Bakelite and Composite", chapter: "10", chapterLabel: "Materials and finishes", status: "NOT VERIFIED" },
  { id: "10.04", label: "Signal Spot Media", chapter: "10", chapterLabel: "Materials and finishes", status: "NOT VERIFIED" },
  { id: "10.05", label: "Translucent, Ceramic and Optical Materials", chapter: "10", chapterLabel: "Materials and finishes", status: "NOT VERIFIED" },
  { id: "10.06", label: "Foil, Emboss, Deboss, Screen and UV", chapter: "10", chapterLabel: "Materials and finishes", status: "NOT VERIFIED" },
  { id: "10.07", label: "Assembly, Seams, Fasteners & Wear", chapter: "10", chapterLabel: "Materials and finishes", status: "NOT VERIFIED" },
  { id: "11.00", label: "Applications & Mockups Overview", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.01", label: "Image Direction", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.02", label: "ImageGen → Affinity Reconstruction & Mockup Honesty", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.03", label: "Poster / Campaign", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.04", label: "Calibration Label / Sticker", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.05", label: "Hardware Panel / Camera Body", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.06", label: "Pit Instrument / Dial", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.07", label: "Film / Physical Media", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.08", label: "Packaging / Technical Manual", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.09", label: "Vehicle Livery / Day", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.10", label: "Vehicle Livery / Night", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.11", label: "Product-Family Mockup", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "11.12", label: "Digital Product / Figma Make Handoff", chapter: "11", chapterLabel: "Applications and mockups", status: "NOT VERIFIED" },
  { id: "12.00", label: "Production & Release Overview", chapter: "12", chapterLabel: "Production and release", status: "NOT VERIFIED" },
  { id: "12.01", label: "Print, One-Color & Production Profiles", chapter: "12", chapterLabel: "Production and release", status: "NOT VERIFIED" },
  { id: "12.02", label: "Vinyl, Reflective & UV Registration", chapter: "12", chapterLabel: "Production and release", status: "NOT VERIFIED" },
  { id: "12.03", label: "Fabrication & Physical-Sample Requirements", chapter: "12", chapterLabel: "Production and release", status: "NOT VERIFIED" },
  { id: "12.04", label: "Digital, Vector & Raster Export Matrix", chapter: "12", chapterLabel: "Production and release", status: "NOT VERIFIED" },
  { id: "12.05", label: "Accessibility, RTL, Motion & Visual-QA Evidence", chapter: "12", chapterLabel: "Production and release", status: "NOT VERIFIED" },
  { id: "12.06", label: "Provenance, Approval & Change Control", chapter: "12", chapterLabel: "Production and release", status: "NOT VERIFIED" },
  { id: "12.07", label: "Full Brand Guide Assembly / Release / Handoff", chapter: "12", chapterLabel: "Production and release", status: "NOT VERIFIED" },
  { id: "99.00", label: "Noncanonical References & Legacy Index", chapter: "99", chapterLabel: "Noncanonical reference", status: "NOT VERIFIED" },
];

const LABEL_STATES: Array<{ id: LabelStateId; label: string; command: string; rail: string }> = [
  { id: "live", label: "LIVE", command: "CATCH THE STARS", rail: "FIELD ACTIVE" },
  { id: "ready", label: "READY", command: "ALIGN TO FIELD", rail: "TRACE STANDBY" },
  { id: "service", label: "SERVICE", command: "CALIBRATION", rail: "POWER ISOLATED" },
];

const PRODUCTION_CHANNELS: Array<{
  id: ProductionChannelId;
  label: string;
  output: string;
  rule: string;
}> = [
  { id: "composite", label: "COMPOSITE", output: "Screen proof", rule: "Paper, Void, Signal, and the exact field spectrum." },
  { id: "k", label: "K", output: "One-color proof", rule: "Black artwork only. Signal and spectrum are removed." },
  { id: "spot", label: "SPOT", output: "Signal plate", rule: "Signal Lime remains one flat, isolated operational channel." },
  { id: "cut", label: "CUT", output: "Knife path", rule: "The perimeter is isolated from all printed artwork." },
  { id: "laminate", label: "LAMINATE", output: "Surface layer", rule: "The field spectrum is retained without Signal interpolation." },
];

const CHAPTER_NOTES: Record<string, string> = {
  "00": "Entry, authority, navigation, and source-of-truth behavior.",
  "01": "The recognition grammar and Swiss-working design philosophy.",
  "02": "The original Gravity Well and its approved monochrome contexts.",
  "03": "Signal Lime, the neutral chassis, spectrum, and contrast behavior.",
  "04": "Governed gradients with declared purpose, source, and fallback.",
  "05": "Display, industrial, body, technical, Arabic, and RTL typography.",
  "06": "Continuous Lens v2, panel geometry, optical sizing, and composition.",
  "07": "One governed field translated across exact atlas representations.",
  "08": "Capture states, timing, feedback, reduced motion, and low power.",
  "09": "Reusable interface and physical components over host infrastructure.",
  "10": "Material response, finishes, fabrication details, and wear.",
  "11": "Observed, licensed, or original application mockups with honest status.",
  "12": "Production profiles, evidence, release gates, and handoff.",
  "99": "Locked noncanonical references retained only for traceability.",
};

function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function capturePhase(value: number) {
  if (value < 20) return "APPROACH";
  if (value < 45) return "COMPRESS";
  if (value < 70) return "ECLIPSE";
  if (value < 90) return "LOCK";
  return "RELEASE";
}

export default function App() {
  const [query, setQuery] = useState("");
  const [chapter, setChapter] = useState("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState("11.05");
  const [labelState, setLabelState] = useState<LabelStateId>("live");
  const [productionChannel, setProductionChannel] = useState<ProductionChannelId>("composite");
  const [capture, setCapture] = useState(76);
  const [photoStatus, setPhotoStatus] = useState<PhotoStatus>("loading");
  const searchRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotionPreference();

  const chapters = useMemo(
    () => Array.from(new Map(SUBJECTS.map((subject) => [subject.chapter, subject.chapterLabel])).entries()),
    [],
  );

  const filteredSubjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return SUBJECTS.filter((subject) => {
      const matchesChapter = chapter === "all" || subject.chapter === chapter;
      const haystack = `${subject.id} ${subject.label} ${subject.chapterLabel}`.toLocaleLowerCase();
      return matchesChapter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [chapter, query]);

  const selectedSubject =
    SUBJECTS.find((subject) => subject.id === selectedSubjectId) ?? SUBJECTS[0];
  const selectedIndex = SUBJECTS.findIndex((subject) => subject.id === selectedSubject.id);
  const activeLabelState =
    LABEL_STATES.find((state) => state.id === labelState) ?? LABEL_STATES[0];
  const activeProductionChannel =
    PRODUCTION_CHANNELS.find((channelItem) => channelItem.id === productionChannel) ??
    PRODUCTION_CHANNELS[0];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (event.key === "/" && !isEditing) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const moveSelection = (direction: -1 | 1) => {
    const nextIndex = Math.min(Math.max(selectedIndex + direction, 0), SUBJECTS.length - 1);
    setSelectedSubjectId(SUBJECTS[nextIndex].id);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <a className="brand-lockup" href="#system" aria-label="Bizarre Industries, back to system overview">
          <span>BIZARRE</span>
          <span>INDUSTRIES</span>
        </a>
        <nav className="primary-nav" aria-label="Prototype sections">
          <a href="#system">System</a>
          <a href="#atlas">Atlas</a>
          <a href="#hardware">Hardware</a>
          <a href="#production">Production</a>
          <a href="#provenance">Provenance</a>
        </nav>
        <div className="motion-readout" aria-live="polite">
          MOTION {reducedMotion ? "REDUCED" : "STANDARD"}
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="system" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hero-kicker">BIZARRE INDUSTRIES</p>
            <h1 id="hero-title">CATCH THE STARS</h1>
            <p className="hero-summary">
              A working masterbrand instrument for identity, patterns, hardware applications, motion, and production release.
            </p>
            <div className="hero-actions">
              <a className="action action-primary" href="#atlas">
                Open atlas
              </a>
              <a className="action action-secondary" href="#hardware">
                Calibrate hardware
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Governed Bizarre visual assets">
            <div className="hero-visual-primary">
              <img src={gravityWellAsset} alt="Governed Bizarre Gravity Well asset" />
            </div>
            <div className="hero-visual-secondary">
              <img src={shadedContourAsset} alt="Governed Bizarre shaded contour asset" />
            </div>
            <div className="hero-visual-data">
              <span>MONOCHROME MARK</span>
              <span>ONE FIELD</span>
              <span>MANY REPRESENTATIONS</span>
            </div>
          </div>

          <div className="field-gradient-specimen" aria-label="Exact 04.01 field gradient">
            <span>04.01 FIELD</span>
            <span>EXACT SOURCE STOPS</span>
          </div>
        </section>

        <section className="section-shell atlas-section" id="atlas" aria-labelledby="atlas-title">
          <div className="section-intro">
            <h2 id="atlas-title">104 governed subjects</h2>
            <p>
              Search the permanent system, filter by chapter, and inspect one exact subject without flattening the guide into a single page.
            </p>
          </div>

          <div className="atlas-controls">
            <div className="field-group atlas-search-group">
              <label htmlFor="atlas-search">Search ID, subject, or chapter</label>
              <div className="search-control">
                <input
                  id="atlas-search"
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try 11.05 or gradient"
                  autoComplete="off"
                />
                {query ? (
                  <button type="button" onClick={() => setQuery("")}>
                    Clear
                  </button>
                ) : (
                  <span className="key-hint" aria-hidden="true">
                    /
                  </span>
                )}
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="chapter-filter">Chapter</label>
              <select id="chapter-filter" value={chapter} onChange={(event) => setChapter(event.target.value)}>
                <option value="all">All chapters</option>
                {chapters.map(([chapterId, chapterLabel]) => (
                  <option key={chapterId} value={chapterId}>
                    {chapterId} / {chapterLabel}
                  </option>
                ))}
              </select>
            </div>
            <output className="atlas-count" aria-live="polite">
              {String(filteredSubjects.length).padStart(3, "0")} / 104
            </output>
          </div>

          <div className="atlas-workspace">
            <div className="subject-results" aria-label="Filtered brand guide subjects">
              {filteredSubjects.length ? (
                <ul>
                  {filteredSubjects.map((subject) => (
                    <li key={subject.id}>
                      <button
                        type="button"
                        className={subject.id === selectedSubject.id ? "subject-row is-selected" : "subject-row"}
                        onClick={() => setSelectedSubjectId(subject.id)}
                        aria-current={subject.id === selectedSubject.id ? "true" : undefined}
                      >
                        <span className="subject-code">{subject.id}</span>
                        <span className="subject-label">{subject.label}</span>
                        <span className="subject-chapter">{subject.chapterLabel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <strong>No governed subject matches.</strong>
                  <span>Clear the query or return to all chapters.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setChapter("all");
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>

            <aside className="subject-detail" aria-live="polite" aria-labelledby="selected-subject-title">
              <div className="detail-head">
                <span className="detail-code">{selectedSubject.id}</span>
                <span className="verification-status">{selectedSubject.status}</span>
              </div>
              <h3 id="selected-subject-title">{selectedSubject.label}</h3>
              <p className="detail-chapter">{selectedSubject.chapterLabel}</p>
              <p className="detail-summary">{CHAPTER_NOTES[selectedSubject.chapter]}</p>
              {selectedSubject.id === "11.05" ? (
                <div className="detail-callout">
                  Observed hardware photo plus an editable HTML label. The placement remains provisional until Affinity reconstruction and physical evidence pass.
                </div>
              ) : null}
              <dl className="detail-contract">
                <div>
                  <dt>Authority</dt>
                  <dd>Manifest-backed</dd>
                </div>
                <div>
                  <dt>Tool mirror</dt>
                  <dd>Figma, Affinity, Make</dd>
                </div>
                <div>
                  <dt>Release state</dt>
                  <dd>{selectedSubject.status}</dd>
                </div>
              </dl>
              <div className="detail-nav">
                <button type="button" onClick={() => moveSelection(-1)} disabled={selectedIndex === 0}>
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => moveSelection(1)}
                  disabled={selectedIndex === SUBJECTS.length - 1}
                >
                  Next
                </button>
              </div>
            </aside>
          </div>
        </section>

        <section className="section-shell hardware-section" id="hardware" aria-labelledby="hardware-title">
          <div className="section-intro">
            <h2 id="hardware-title">Apply the system to a real object</h2>
            <p>
              An observed control panel carries one editable HTML label. The mockup stays provisional until reconstruction and physical proof pass.
            </p>
          </div>

          <div className="hardware-layout">
            <figure className="hardware-mockup">
              <div className="hardware-photo-stage" aria-busy={photoStatus === "loading"}>
                <img
                  className={photoStatus === "ready" ? "hardware-photo is-ready" : "hardware-photo"}
                  src={PHOTO_URL}
                  alt="Close-up of industrial control panel switches photographed by Sean P. Twomey"
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setPhotoStatus("ready")}
                  onError={() => setPhotoStatus("error")}
                />
                {photoStatus === "loading" ? (
                  <div className="photo-status" role="status">
                    Loading observed photo
                  </div>
                ) : null}
                {photoStatus === "error" ? (
                  <div className="photo-status photo-error" role="alert">
                    <strong>Observed photo could not load.</strong>
                    <a href={PHOTO_SOURCE_URL} target="_blank" rel="noreferrer">
                      Open source photo
                    </a>
                  </div>
                ) : null}
                {photoStatus === "ready" ? (
                  <div
                    className={`calibration-label channel-${productionChannel} state-${labelState}`}
                    aria-label={`Editable provisional calibration label, ${activeLabelState.label} state, ${activeProductionChannel.label} channel`}
                  >
                    <div className="label-topline">
                      <span>BIZARRE</span>
                      <span>11.05 / CAL</span>
                    </div>
                    <div className="label-body">
                      <img className="label-mark" src={gravityWellAsset} alt="" aria-hidden="true" />
                      <div>
                        <strong>{activeLabelState.command}</strong>
                        <span>{activeLabelState.rail}</span>
                      </div>
                    </div>
                    <div className="label-spectrum" aria-hidden="true" />
                    <div className="label-status">
                      <span>{activeLabelState.label}</span>
                      <span>{capturePhase(capture)}</span>
                      <span>{String(capture).padStart(3, "0")}%</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <figcaption>
                Provisional digital placement. Observed photo by Sean P. Twomey, used under the Pexels License.
              </figcaption>
            </figure>

            <div className="hardware-controls">
              <fieldset>
                <legend>Label state</legend>
                <div className="segmented-control" role="radiogroup" aria-label="Calibration label state">
                  {LABEL_STATES.map((state) => (
                    <button
                      key={state.id}
                      type="button"
                      role="radio"
                      aria-checked={labelState === state.id}
                      className={labelState === state.id ? "is-active" : undefined}
                      onClick={() => setLabelState(state.id)}
                    >
                      {state.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Capture position</legend>
                <div className="capture-readout">
                  <output htmlFor="capture-slider">{String(capture).padStart(3, "0")}%</output>
                  <span>{capturePhase(capture)}</span>
                </div>
                <input
                  id="capture-slider"
                  className="capture-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={capture}
                  onChange={(event) => setCapture(Number(event.target.value))}
                  aria-label="Capture position"
                />
                <div className="capture-scale" aria-hidden="true">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </fieldset>

              <div className="hardware-facts">
                <div>
                  <span>BASE</span>
                  <strong>OBSERVED PHOTO</strong>
                </div>
                <div>
                  <span>LABEL</span>
                  <strong>EDITABLE HTML</strong>
                </div>
                <div>
                  <span>STATUS</span>
                  <strong>PROVISIONAL</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell production-section" id="production" aria-labelledby="production-title">
          <div className="section-intro">
            <h2 id="production-title">Five channel proof</h2>
            <p>
              Inspect composite, black, Signal spot, cut path, and laminate intent without presenting simulated output as physical evidence.
            </p>
          </div>

          <div className="production-workspace">
            <div className="channel-selector" role="radiogroup" aria-label="Production channel selector">
              {PRODUCTION_CHANNELS.map((channelItem) => (
                <button
                  key={channelItem.id}
                  type="button"
                  role="radio"
                  aria-checked={productionChannel === channelItem.id}
                  className={productionChannel === channelItem.id ? "is-active" : undefined}
                  onClick={() => setProductionChannel(channelItem.id)}
                >
                  <span>{channelItem.label}</span>
                  <span>{channelItem.output}</span>
                </button>
              ))}
            </div>

            <div className={`channel-proof proof-${productionChannel}`} aria-live="polite">
              <div className="channel-proof-image">
                <img src={shadedContourAsset} alt="Governed shaded contour asset under the selected production channel" />
              </div>
              <div className="channel-proof-spectrum" aria-hidden="true" />
              <div className="channel-proof-copy">
                <div>
                  <span>ACTIVE CHANNEL</span>
                  <strong>{activeProductionChannel.label}</strong>
                </div>
                <div>
                  <span>OUTPUT</span>
                  <strong>{activeProductionChannel.output}</strong>
                </div>
                <p>{activeProductionChannel.rule}</p>
              </div>
              <div className="channel-proof-status">NOT VERIFIED / SCREEN SIMULATION ONLY</div>
            </div>
          </div>
        </section>

        <section className="section-shell provenance-section" id="provenance" aria-labelledby="provenance-title">
          <div className="section-intro">
            <h2 id="provenance-title">Every visible source stays named</h2>
            <p>
              The prototype exposes the observed photo, exact assets, governed gradient, content manifest, and direct Make synchronization boundary.
            </p>
          </div>

          <div className="provenance-grid">
            <article>
              <h3>Observed hardware base</h3>
              <p>Close-up of the Switches of a Machine by Sean P. Twomey.</p>
              <div className="provenance-links">
                <a href={PHOTO_SOURCE_URL} target="_blank" rel="noreferrer">
                  Source photo
                </a>
                <a href={PHOTO_LICENSE_URL} target="_blank" rel="noreferrer">
                  Pexels License
                </a>
              </div>
            </article>
            <article>
              <h3>Governed Make assets</h3>
              <code>figma:asset/8fc7b3897e356c8020e5e8319e6f8449fd803f32.png</code>
              <code>figma:asset/ef9b4d6129aed5f75c122d99b123bd7de1687a02.png</code>
            </article>
            <article>
              <h3>Field gradient 04.01</h3>
              <p>90 degrees. Seven exact stops. Signal Lime is excluded from interpolation.</p>
              <code>production/affinity/manifests/bizarre-gradient-recipes-v1.json</code>
              <div className="stop-register" aria-label="Exact field gradient color stops">
                <span style={{ backgroundColor: "#20274D" }}>0</span>
                <span style={{ backgroundColor: "#3156A6" }}>17</span>
                <span style={{ backgroundColor: "#4AA5AF" }}>34</span>
                <span style={{ backgroundColor: "#5C887C" }}>49</span>
                <span style={{ backgroundColor: "#D5A347" }}>66</span>
                <span style={{ backgroundColor: "#C96C3E" }}>82</span>
                <span style={{ backgroundColor: "#B64C63" }}>100</span>
              </div>
            </article>
            <article>
              <h3>Permanent guide topology</h3>
              <p>{SUBJECTS.length} exact subject rows mirrored in source and checked against the current v2 content contract.</p>
              <code>production/affinity/bizarre-masterbrand-content-spec-v2.json</code>
            </article>
            <article>
              <h3>Figma Make boundary</h3>
              <p>The repository mirror targets the canonical interactive Make project. Source changes are not applied automatically and must be verified in Make.</p>
              <code>s9stWDZe0kwBisJjfFMOqT</code>
            </article>
            <article className="provenance-warning">
              <h3>Evidence state</h3>
              <strong>NOT VERIFIED</strong>
              <p>No screen simulation in this prototype is a physical proof, print proof, or fabrication claim.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>BIZARRE INDUSTRIES</span>
        <span>CATCH THE STARS</span>
      </footer>
    </div>
  );
}
