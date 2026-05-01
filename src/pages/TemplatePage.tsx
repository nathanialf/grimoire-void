import { PageFrame } from '../components/PageFrame'
import { EntryHeader } from '../components/EntryHeader'
import { ChapterDivider } from '../components/ChapterDivider'
import { MetaTable } from '../components/MetaTable'
import { Timeline } from '../components/Timeline'
import { NumberedList } from '../components/NumberedList'
import { PixelatedHeading } from '../components/PixelatedHeading'
import { ImagePanel } from '../components/ImagePanel'
import { StatBlock } from '../components/StatBlock'
import { ClassNoticeBlock } from '../components/ClassNoticeBlock'
import { DocFooter } from '../components/DocChrome'
import { renderBlocks } from '../utils/renderBlocks'
import { renderText } from '../utils/renderText'
import { deriveMedia } from '../data'
import shared from '../styles/shared.module.css'
import styles from '../styles/TemplatePage.module.css'
import type {
  ActionItem,
  ArtifactTemplate,
  COETemplate,
  CommTemplate,
  IncidentResponseAnalysis,
  ProfileChainEntry,
  ProfileTemplate,
  Section,
  ServiceEntry,
  SurveyTemplate,
  TemplateData,
} from '../types'

// One page, five kinds (comm / profile / COE / artifact / survey). Each kind
// composes the same primitives the rest of the wiki uses — EntryHeader,
// ChapterDivider, MetaTable, Timeline, NumberedList, shared.prose +
// renderBlocks — so the template chrome reads as part of the same archive,
// not a parallel one.

export function TemplatePage(props: TemplateData) {
  return (
    <PageFrame pageNumber={props.pageNumber}>
      <div className={shared.page}>
        {props.kind === 'comm' && <CommDoc doc={props} />}
        {props.kind === 'profile' && <ProfileDoc doc={props} />}
        {props.kind === 'coe' && <COEDoc doc={props} />}
        {props.kind === 'artifact' && <ArtifactDoc doc={props} />}
        {props.kind === 'survey' && <SurveyDoc doc={props} />}
        <DocFooter footer={props.footer} />
      </div>
    </PageFrame>
  )
}

// ── Per-kind compositions ──

function CommDoc({ doc }: { doc: CommTemplate }) {
  // Subject / From / To / Cc / Sent / Variant are all surfaced in the
  // header chrome (subject in meta[0], from in author, to+cc in sharedWith,
  // sent in meta[1], variant in classification) — no body table needed.
  return (
    <>
      <EntryHeader {...chromeProps(doc)} classification={`Communication · ${doc.variant}`} title={doc.title} />
      <div className={shared.prose}>{renderBlocks(doc.body, shared)}</div>
    </>
  )
}

function ProfileDoc({ doc }: { doc: ProfileTemplate }) {
  return (
    <>
      <EntryHeader {...chromeProps(doc)} classification="Personnel" title={doc.name} />
      <div className={styles.profileLayout}>
        <div className={styles.profilePortrait} aria-hidden="true">
          <span className="visually-hidden">Portrait unavailable</span>
          <span className={styles.profilePortraitLabel}>NO IMG</span>
        </div>
        <MetaTable rows={[
          { label: 'Name', value: doc.name, variant: 'accent' as const },
          { label: 'Emp. ID', value: doc.employeeNumber },
          { label: 'Role', value: doc.role },
          { label: 'Dept.', value: doc.department },
          { label: 'Site', value: doc.location },
        ]} />
      </div>
      <div className={shared.twoCol}>
        <div className={shared.sectionCol}>
          <ChapterDivider label="Reporting Chain" />
          <ChainTree
            manager={doc.manager}
            subject={{ name: doc.name, role: doc.role, employeeNumber: doc.employeeNumber }}
            reports={doc.reports}
          />
          <ChapterDivider label="Dossier" />
          <div className={shared.prose}>{renderBlocks(doc.dossier, shared)}</div>
          {renderSections(doc.sections)}
        </div>
        <div className={shared.sidebar}>
          <ServiceRecord entries={doc.serviceRecord} />
        </div>
      </div>
    </>
  )
}

function ServiceRecord({ entries }: { entries: ServiceEntry[] }) {
  return (
    <div className={styles.serviceRecord}>
      <div className={styles.serviceRecordHeading}>Service Record</div>
      <ol className={styles.serviceRecordList}>
        {entries.map((e, i) => (
          <li key={i} className={styles.serviceRecordRow}>
            <span className={styles.serviceRecordDate}>{e.date}</span>
            <span className={styles.serviceRecordEntry}>{renderText(e.entry)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function COEDoc({ doc }: { doc: COETemplate }) {
  return (
    <>
      <EntryHeader {...chromeProps(doc)} classification="Correction of Error" title={doc.title} />
      <MetaTable rows={[
        { label: 'Incident', value: doc.incidentId },
        { label: 'Service', value: doc.service },
        { label: 'Severity', value: doc.severity, variant: 'danger' as const },
        { label: 'Status', value: doc.status, variant: 'accent' as const },
        { label: 'Detected', value: doc.detected },
        { label: 'Mitigated', value: doc.mitigated, variant: 'accent' as const },
        ...(doc.resolved ? [{ label: 'Resolved', value: doc.resolved, variant: 'accent' as const }] : []),
        { label: 'COE Filed', value: doc.filed },
        { label: 'Authors', value: doc.authors.join(', ') },
        ...(doc.reviewers && doc.reviewers.length > 0
          ? [{ label: 'Reviewers', value: doc.reviewers.join(', ') }]
          : []),
      ]} />

      <ChapterDivider label="Issue Summary" />
      <div className={shared.prose}>{renderBlocks(doc.issueSummary, shared)}</div>

      <ChapterDivider label="Customer Impact" />
      <div className={shared.prose}>{renderBlocks(doc.customerImpact, shared)}</div>

      <ChapterDivider label="Incident Response Analysis" />
      <ResponseAnalysisTable analysis={doc.incidentResponseAnalysis} />

      <ChapterDivider label="Timeline" />
      <Timeline entries={doc.timeline} />

      <ChapterDivider label="Five Whys" />
      <NumberedList items={doc.fiveWhys} />

      <ChapterDivider label="Lessons Learned" />
      <div className={shared.prose}>{renderBlocks(doc.lessonsLearned, shared)}</div>

      <ChapterDivider label="Action Items" />
      <ActionItemsTable items={doc.actionItems} />

      {doc.relatedItems && doc.relatedItems.length > 0 && (
        <>
          <ChapterDivider label="Related Items" />
          <MetaTable rows={doc.relatedItems.map((r) => ({
            label: r.id,
            value: r.path ? `[[${r.title}|${r.path}]]` : r.title,
          }))} />
        </>
      )}
    </>
  )
}

function ResponseAnalysisTable({ analysis }: { analysis: IncidentResponseAnalysis }) {
  const rows: { metric: string; abbr: string; data: typeof analysis.ttd }[] = [
    { metric: 'Time to Detect', abbr: 'TTD', data: analysis.ttd },
    { metric: 'Time to Engage', abbr: 'TTE', data: analysis.tte },
    { metric: 'Time to Resolve', abbr: 'TTR', data: analysis.ttr },
  ]
  return (
    <div className={styles.responseTable}>
      {rows.map((r) => (
        <div key={r.abbr} className={styles.responseRow}>
          <div className={styles.responseMetric}>
            <span className={styles.responseAbbr}>{r.abbr}</span>
            <span className={styles.responseMetricLabel}>{r.metric}</span>
            <span className={styles.responseValue}>{r.data.value}</span>
          </div>
          <div className={styles.responseDetail}>
            <span className={styles.responseDetailLabel}>Rationale</span>
            <span className={styles.responseDetailText}>{r.data.rationale}</span>
          </div>
          <div className={styles.responseDetail}>
            <span className={styles.responseDetailLabel}>Improvement</span>
            <span className={styles.responseDetailText}>{r.data.improvement ?? 'None.'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ActionItemsTable({ items }: { items: ActionItem[] }) {
  return (
    <div className={styles.actionsTable}>
      <div className={`${styles.actionsRow} ${styles.actionsHeader}`}>
        <span className={styles.actionsCellNum}>#</span>
        <span className={styles.actionsCellAction}>Action</span>
        <span className={styles.actionsCellOwner}>Owner</span>
        <span className={styles.actionsCellPriority}>Priority</span>
        <span className={styles.actionsCellDue}>Due</span>
        <span className={styles.actionsCellStatus}>Status</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className={styles.actionsRow}>
          <span className={styles.actionsCellNum}>{String(i + 1).padStart(2, '0')}</span>
          <span className={styles.actionsCellAction}>{renderText(item.description)}</span>
          <span className={styles.actionsCellOwner}>{item.owner}</span>
          <span className={`${styles.actionsCellPriority} ${priorityClass(item.priority)}`}>{item.priority}</span>
          <span className={styles.actionsCellDue}>{item.dueDate}</span>
          <span className={`${styles.actionsCellStatus} ${statusClass(item.status)}`}>{item.status}</span>
        </div>
      ))}
    </div>
  )
}

function priorityClass(p: ActionItem['priority']): string {
  if (p === 'P0') return styles.priorityP0
  if (p === 'P1') return styles.priorityP1
  return ''
}

function statusClass(s: ActionItem['status']): string {
  if (s === 'Done') return styles.statusDone
  if (s === 'Blocked') return styles.statusBlocked
  return ''
}

// ArtifactDoc mirrors the ItemPage layout (header → image → first
// section → twoCol with sidebar StatBlocks) and adds the template
// chrome: DriftStrip in the header, ClassNotice if present.
function ArtifactDoc({ doc }: { doc: ArtifactTemplate }) {
  return (
    <>
      <EntryHeader {...chromeProps(doc)} {...doc.header} />
      {doc.image && <ImagePanel {...doc.image} />}
      <div className={shared.twoCol}>
        <div className={shared.sectionCol}>
          {doc.sections.flatMap((section, i) => [
            <ChapterDivider key={`d${i}`} label={section.heading} />,
            <div key={`p${i}`} className={shared.prose}>
              {renderBlocks(section.blocks, shared)}
            </div>,
          ])}
        </div>
        <div className={shared.sidebar}>
          {doc.statBlocks.map((block, i) => (
            <StatBlock key={i} {...block} />
          ))}
        </div>
      </div>
      {doc.classNotice && <ClassNoticeBlock classNotice={doc.classNotice} />}
    </>
  )
}

// SurveyDoc mirrors the ReportPage layout (header → optional image →
// sections → mission stats → timeline → recommendations) and adds the
// template chrome.
function SurveyDoc({ doc }: { doc: SurveyTemplate }) {
  return (
    <>
      <EntryHeader {...chromeProps(doc)} {...doc.header} />
      {doc.image && <ImagePanel {...doc.image} />}
      {renderSections(doc.sections)}
      <ChapterDivider label="Mission Parameters" />
      <MetaTable rows={doc.missionStats.stats.map((s) => ({
        label: s.label,
        value: s.value,
        variant: s.variant,
      }))} />
      {doc.timeline.length > 0 && (
        <>
          <ChapterDivider label="Operational Timeline" />
          <Timeline entries={doc.timeline} />
        </>
      )}
      {doc.casualties.length > 0 && (
        <>
          <ChapterDivider label="Casualties & Losses" />
          <ul className={styles.casualtyList}>
            {doc.casualties.map((c, i) => (
              <li key={i} className={styles.casualtyRow}>
                <span className={c.status === 'KIA' ? styles.casualtyKia : styles.casualtyLost}>
                  {c.status}
                </span>{' '}
                {c.text}
              </li>
            ))}
          </ul>
        </>
      )}
      {doc.recommendations.length > 0 && (
        <>
          <ChapterDivider label="Recommendations" />
          <NumberedList items={doc.recommendations} />
        </>
      )}
      {doc.classNotice && <ClassNoticeBlock classNotice={doc.classNotice} />}
    </>
  )
}

// ── Helpers ──

// Pulls the universal six-slot header chrome off any TemplateData. Each
// per-kind sub-component spreads this onto EntryHeader, then overrides
// the kind-specific classification/title/tags after. `media` is derived
// from the document's actual content blocks (see deriveMedia) so the
// indicator can't drift from what the doc carries.
function chromeProps(doc: TemplateData) {
  return {
    filename: doc.filename,
    filetype: doc.filetype,
    author: doc.author,
    sharedWith: doc.sharedWith,
    meta: doc.meta,
    media: deriveMedia(doc),
    drift: doc.drift,
  }
}

function renderSections(sections: Section[]) {
  return sections.flatMap((s, i) => [
    <ChapterDivider key={`d${i}`} label={s.heading} />,
    <div key={`p${i}`} className={shared.prose}>
      {renderBlocks(s.blocks, shared)}
    </div>,
  ])
}

// Reporting chain as a top-down tree: manager above, subject in the
// middle, direct reports branched below with bus + drop connectors.
function ChainTree({
  manager,
  subject,
  reports,
}: {
  manager: ProfileChainEntry
  subject: ProfileChainEntry
  reports: ProfileChainEntry[]
}) {
  return (
    <div className={styles.chainTree}>
      <ChainNode entry={manager} />
      <div className={styles.chainBar} />
      <ChainNode entry={subject} subject />
      {reports.length > 0 && (
        <>
          <div className={styles.chainBar} />
          <div className={styles.chainReports}>
            {reports.map((r, i) => (
              <div key={`${r.employeeNumber}-${i}`} className={styles.chainReportSlot}>
                <ChainNode entry={r} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ChainNode({ entry, subject }: { entry: ProfileChainEntry; subject?: boolean }) {
  return (
    <div className={`${styles.chainNode} ${subject ? styles.chainNodeSubject : ''}`}>
      <span className={styles.chainName}>{entry.name}</span>
      <span className={styles.chainRole}>{entry.role}</span>
      <span className={styles.chainEmpId}>{entry.employeeNumber}</span>
    </div>
  )
}

// Profile name as a pixel heading (kept for cases where we want a
// stand-alone name rendering elsewhere; currently EntryHeader handles it).
export function ProfileNameHeading({ name }: { name: string }) {
  return (
    <PixelatedHeading
      lines={[name]}
      renderSize={16}
      scale={3}
      align="left"
      lineHeight={1.05}
    />
  )
}
