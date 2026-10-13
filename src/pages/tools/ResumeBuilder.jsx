import { useState } from 'react'
import { Check, FileDown, Plus, Save, Trash2, Undo2 } from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  Checkbox,
  Input,
  Select,
  Switch,
  Textarea,
} from '@/components/common'
import ToolShell from '@/components/tools/ToolShell'
import {
  RESUME_TEMPLATES,
  RESUME_FONTS,
  RESUME_SPACING,
  SECTION_DEFS,
  loadResume,
  saveResume,
  clearResume,
  exportResumeToDocx,
  exportResumeToPdf,
  recordExport,
} from '@/services/resumeService'
import { useToast } from '@/hooks/useToast'
import { downloadBlob } from '@/utils/download'

const LICENSE_ROW = 'flex flex-wrap items-center gap-2'

export default function ResumeBuilder() {
  const toast = useToast()
  const [resume, setResume] = useState(() => loadResume())

  const template = RESUME_TEMPLATES.find((item) => item.id === resume.template) ?? RESUME_TEMPLATES[0]
  const font = RESUME_FONTS.find((item) => item.id === resume.font) ?? RESUME_FONTS[0]
  const spacing = RESUME_SPACING.find((item) => item.id === resume.spacing) ?? RESUME_SPACING[1]
  const visible = (id) => resume.sections.find((section) => section.id === id)?.visible !== false

  const patch = (field, value) => setResume((current) => ({ ...current, [field]: value }))
  const patchPersonal = (key, value) =>
    setResume((current) => ({ ...current, personal: { ...current.personal, [key]: value } }))
  const updateList = (key) => (updater) =>
    setResume((current) => ({ ...current, [key]: updater(current[key]) }))

  const addRow = (key, defaults) => updateList(key)((rows) => [...rows, defaults])
  const removeRow = (key, index) => updateList(key)((rows) => rows.filter((_, i) => i !== index))
  const patchRow = (key, index, patchObj) =>
    updateList(key)((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patchObj } : row)),
    )

  const toggleSection = (id) =>
    setResume((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section,
      ),
    }))

  async function exportPdf() {
    const { bytes, fileName } = await exportResumeToPdf(resume)
    downloadBlob(bytes, fileName, 'application/pdf')
    recordExport(resume)
    toast.success('PDF downloaded')
  }

  async function exportDocx() {
    const { bytes, fileName } = await exportResumeToDocx(resume)
    downloadBlob(bytes, fileName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    recordExport(resume)
    toast.success('DOCX downloaded')
  }

  function persist() {
    saveResume(resume)
    toast.success('Resume draft saved on this device')
  }

  function resetAll() {
    const ok = typeof window === 'undefined' || window.confirm('Replace the current draft with a blank resume?')
    if (!ok) return
    setResume(clearResume())
    toast.success('Started a fresh resume')
  }

  return (
    <ToolShell
      toolId="resume-builder"
      title="Resume Builder"
      blurb="Five professional templates, live preview, and real PDF / DOCX export — all in your browser."
      icon="FilePenLine"
      badge="New"
      wide
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="success" size="sm" onClick={exportPdf}>
            <FileDown className="h-4 w-4" aria-hidden="true" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportDocx}>
            <FileDown className="h-4 w-4" aria-hidden="true" />
            DOCX
          </Button>
          <Button variant="subtle" size="sm" onClick={persist}>
            <Save className="h-4 w-4" aria-hidden="true" />
            Save draft
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* ------------------------------ editor ------------------------------ */}
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title="Design" />
            <div className="space-y-4 p-5">
              <Select
                label="Template"
                options={RESUME_TEMPLATES.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                value={resume.template}
                onChange={(event) => patch('template', event.target.value)}
                hint={template.description}
              />
              <Select
                label="Font"
                options={RESUME_FONTS.map((item) => ({ value: item.id, label: item.label }))}
                value={resume.font}
                onChange={(event) => patch('font', event.target.value)}
              />
              <Select
                label="Spacing"
                options={RESUME_SPACING.map((item) => ({ value: item.id, label: item.label }))}
                value={resume.spacing}
                onChange={(event) => patch('spacing', event.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-500">Reset the whole draft</span>
                <Button variant="ghost" size="sm" onClick={resetAll}>
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Personal details" />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Input label="Full name" value={resume.personal.name} onChange={(e) => patchPersonal('name', e.target.value)} placeholder="Adnan Khan" />
              <Input label="Title / headline" value={resume.personal.title} onChange={(e) => patchPersonal('title', e.target.value)} placeholder="Senior Software Engineer" />
              <Input label="Email" type="email" value={resume.personal.email} onChange={(e) => patchPersonal('email', e.target.value)} placeholder="you@email.com" />
              <Input label="Phone" value={resume.personal.phone} onChange={(e) => patchPersonal('phone', e.target.value)} placeholder="+91 98765 43210" />
              <Input label="Location" value={resume.personal.location} onChange={(e) => patchPersonal('location', e.target.value)} placeholder="Bengaluru, India" />
              <Input label="LinkedIn" value={resume.personal.linkedin} onChange={(e) => patchPersonal('linkedin', e.target.value)} placeholder="linkedin.com/in/…" />
              <Input label="GitHub" value={resume.personal.github} onChange={(e) => patchPersonal('github', e.target.value)} placeholder="github.com/…" />
              <Input label="Portfolio" value={resume.personal.portfolio} onChange={(e) => patchPersonal('portfolio', e.target.value)} placeholder="https://…" />
            </div>
          </Card>

          <Card>
            <CardHeader title="Sections" subtitle="Toggle what appears in the preview and exports" />
            <ul className="divide-y divide-ink-100 px-5">
              {SECTION_DEFS.map((section) => (
                <li key={section.id} className="py-2.5">
                  <Switch
                    id={`section-${section.id}`}
                    checked={resume.sections.find((item) => item.id === section.id)?.visible !== false}
                    onChange={() => toggleSection(section.id)}
                    label={section.label}
                  />
                </li>
              ))}
            </ul>
          </Card>

          {visible('summary') && (
            <Card>
              <CardHeader title="Professional Summary" />
              <div className="p-5">
                <Textarea
                  rows={4}
                  value={resume.summary}
                  onChange={(e) => patch('summary', e.target.value)}
                  placeholder="Senior engineer with 6+ years building distributed systems at scale…"
                />
              </div>
            </Card>
          )}

          {visible('skills') && (
            <Card>
              <CardHeader title="Skills" />
              <div className="p-5">
                <Textarea
                  rows={4}
                  value={resume.skills.join('\n')}
                  onChange={(e) =>
                    patch('skills', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))
                  }
                  hint="One skill per line."
                  placeholder={'Java\nSpring Boot\nKafka\nKubernetes'}
                />
              </div>
            </Card>
          )}

          {visible('experience') && (
            <Card>
              <CardHeader
                title="Work Experience"
                action={
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() =>
                      addRow('experience', {
                        company: '',
                        role: '',
                        location: '',
                        start: '',
                        end: '',
                        current: false,
                        bullets: [''],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add role
                  </Button>
                }
              />
              <div className="space-y-4 p-5">
                {resume.experience.map((row, index) => (
                  <div key={index} className="space-y-3 rounded-lg border border-ink-200 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Role" value={row.role} onChange={(e) => patchRow('experience', index, { role: e.target.value })} placeholder="Backend Engineer" />
                      <Input label="Company" value={row.company} onChange={(e) => patchRow('experience', index, { company: e.target.value })} placeholder="Acme Technologies" />
                      <Input label="Location" value={row.location} onChange={(e) => patchRow('experience', index, { location: e.target.value })} placeholder="Bengaluru" />
                      <div />
                      <Input label="Start (e.g. Jan 2021)" value={row.start} onChange={(e) => patchRow('experience', index, { start: e.target.value })} placeholder="Jan 2021" />
                      {row.current ? (
                        <Input label="End" value="Present" disabled />
                      ) : (
                        <Input label="End (e.g. Jun 2023)" value={row.end} onChange={(e) => patchRow('experience', index, { end: e.target.value })} placeholder="Jun 2023" />
                      )}
                    </div>
                    <Checkbox
                      label="I currently work here"
                      checked={row.current}
                      onChange={(e) => patchRow('experience', index, { current: e.target.checked })}
                    />
                    <Textarea
                      label="Bullets (one per line)"
                      rows={3}
                      value={row.bullets.join('\n')}
                      onChange={(e) =>
                        patchRow('experience', index, {
                          bullets: e.target.value.split('\n').map((b) => b.trim()).filter(Boolean),
                        })
                      }
                      placeholder={'Reduced p95 latency by 40% during the 2021 sale season\nBuilt the payments reconciliation pipeline in Java + Kafka'}
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeRow('experience', index)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Remove role
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {visible('education') && (
            <Card>
              <CardHeader
                title="Education"
                action={
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() =>
                      addRow('education', { school: '', degree: '', start: '', end: '', grade: '' })
                    }
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add entry
                  </Button>
                }
              />
              <div className="space-y-4 p-5">
                {resume.education.map((row, index) => (
                  <div key={index} className="space-y-3 rounded-lg border border-ink-200 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="School" value={row.school} onChange={(e) => patchRow('education', index, { school: e.target.value })} placeholder="IIT Bombay" />
                      <Input label="Degree" value={row.degree} onChange={(e) => patchRow('education', index, { degree: e.target.value })} placeholder="B.Tech in Computer Science" />
                      <Input label="Start" value={row.start} onChange={(e) => patchRow('education', index, { start: e.target.value })} placeholder="2014" />
                      <Input label="End" value={row.end} onChange={(e) => patchRow('education', index, { end: e.target.value })} placeholder="2018" />
                      <Input label="Grade / CGPA" value={row.grade} onChange={(e) => patchRow('education', index, { grade: e.target.value })} placeholder="8.6 CGPA" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeRow('education', index)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Remove entry
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {visible('projects') && (
            <Card>
              <CardHeader
                title="Projects"
                action={
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => addRow('projects', { name: '', tech: '', link: '', description: '' })}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add project
                  </Button>
                }
              />
              <div className="space-y-4 p-5">
                {resume.projects.map((row, index) => (
                  <div key={index} className="space-y-3 rounded-lg border border-ink-200 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Name" value={row.name} onChange={(e) => patchRow('projects', index, { name: e.target.value })} placeholder="JobKhoj" />
                      <Input label="Link" value={row.link} onChange={(e) => patchRow('projects', index, { link: e.target.value })} placeholder="github.com/…" />
                      <Input label="Tech stack" value={row.tech} onChange={(e) => patchRow('projects', index, { tech: e.target.value })} placeholder="React, Node.js, PostgreSQL" />
                    </div>
                    <Textarea
                      label="Description"
                      rows={2}
                      value={row.description}
                      onChange={(e) => patchRow('projects', index, { description: e.target.value })}
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeRow('projects', index)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Remove project
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {visible('certifications') && (
            <Card>
              <CardHeader
                title="Certifications"
                action={
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => addRow('certifications', { name: '', year: '' })}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add
                  </Button>
                }
              />
              <div className="space-y-3 p-5">
                {resume.certifications.map((row, index) => (
                  <div key={index} className={LICENSE_ROW}>
                    <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_140px]">
                      <Input value={row.name} onChange={(e) => patchRow('certifications', index, { name: e.target.value })} placeholder="AWS Solutions Architect" />
                      <Input value={row.year} onChange={(e) => patchRow('certifications', index, { year: e.target.value })} placeholder="2023" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow('certifications', index)}
                      aria-label="Remove certification"
                      className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-danger-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {visible('achievements') && (
            <Card>
              <CardHeader title="Achievements" />
              <div className="p-5">
                <Textarea
                  rows={3}
                  value={resume.achievements.join('\n')}
                  onChange={(e) =>
                    patch('achievements', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))
                  }
                  hint="One achievement per line."
                  placeholder="Winner, Smart India Hackathon 2022"
                />
              </div>
            </Card>
          )}

          {visible('languages') && (
            <Card>
              <CardHeader title="Languages" />
              <div className="p-5">
                <Textarea
                  rows={2}
                  value={resume.languages.join('\n')}
                  onChange={(e) =>
                    patch('languages', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))
                  }
                  placeholder={'English\nHindi\nKannada'}
                />
              </div>
            </Card>
          )}

          {visible('interests') && (
            <Card>
              <CardHeader title="Interests" />
              <div className="p-5">
                <Textarea
                  rows={2}
                  value={resume.interests.join('\n')}
                  onChange={(e) =>
                    patch('interests', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))
                  }
                  placeholder={'Open source\nCycling\nTechnical writing'}
                />
              </div>
            </Card>
          )}

          <Card>
            <div className="grid grid-cols-2 gap-3 p-5">
              <Button variant="success" onClick={exportPdf}>
                <FileDown className="h-4 w-4" aria-hidden="true" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={exportDocx}>
                <FileDown className="h-4 w-4" aria-hidden="true" />
                Download DOCX
              </Button>
              <Button variant="subtle" onClick={persist}>
                <Save className="h-4 w-4" aria-hidden="true" />
                Save draft
              </Button>
              <Button variant="ghost" onClick={resetAll}>
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Reset
              </Button>
            </div>
          </Card>
        </div>

        {/* ------------------------------ preview ------------------------------ */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-600">
              Live preview — {template.name}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-700">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Auto-syncs as you type
            </span>
          </div>

          <div
            className="rounded-xl border border-ink-200 bg-white p-8 shadow-card"
            style={{ fontFamily: font.stack, lineHeight: spacing.lineHeight }}
          >
            {template.id === 'modern' && (
              <div className="-mx-8 -mt-8 mb-6 border-b-4" style={{ borderColor: template.accent }} />
            )}
            <div style={{ color: template.accent }}>
              <p className="text-2xl font-bold tracking-tight">
                {resume.personal.name || 'Your Name'}
              </p>
              <p className="mt-0.5 text-sm">{resume.personal.title || 'Professional title'}</p>
              <p className="mt-2 text-xs" style={{ opacity: 0.75 }}>
                {[
                  resume.personal.email,
                  resume.personal.phone,
                  resume.personal.location,
                  resume.personal.linkedin,
                  resume.personal.github,
                  resume.personal.portfolio,
                ]
                  .filter(Boolean)
                  .join('  ·  ')}
              </p>
            </div>

            <div className="mt-6 space-y-5" style={{ rowGap: spacing.gap }}>
              {visible('summary') && resume.summary.trim() && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: template.accent }}>
                    Professional Summary
                  </h2>
                  <p className="mt-1.5 text-sm whitespace-pre-line">{resume.summary}</p>
                </div>
              )}

              {visible('skills') && resume.skills.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: template.accent }}>
                    Skills
                  </h2>
                  <p className="mt-1.5 text-sm">{resume.skills.join(' · ')}</p>
                </div>
              )}

              {visible('experience') && resume.experience.some((row) => row.role || row.company) && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: template.accent }}>
                    Work Experience
                  </h2>
                  <div className="mt-2 space-y-4">
                    {resume.experience
                      .filter((row) => row.role || row.company)
                      .map((row, index) => (
                        <div key={index}>
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-bold">{row.role || row.company}</p>
                            <p className="text-xs" style={{ opacity: 0.65 }}>
                              {[row.start, row.current ? 'Present' : row.end].filter(Boolean).join(' – ')}
                            </p>
                          </div>
                          <p className="text-xs font-medium" style={{ opacity: 0.75 }}>
                            {[row.company, row.location].filter(Boolean).join(' · ')}
                          </p>
                          {row.bullets.length > 0 && (
                            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">
                              {row.bullets.map((bullet) => (
                                <li key={bullet}>{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {visible('education') && resume.education.some((row) => row.school || row.degree) && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: template.accent }}>
                    Education
                  </h2>
                  <div className="mt-2 space-y-2">
                    {resume.education
                      .filter((row) => row.school || row.degree)
                      .map((row, index) => (
                        <div key={index} className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm">
                            <strong>{row.degree}</strong>
                            {row.school ? ` — ${row.school}` : ''}
                          </p>
                          <p className="text-xs" style={{ opacity: 0.65 }}>
                            {[row.start, row.end].filter(Boolean).join(' – ')}
                            {row.grade ? ` · ${row.grade}` : ''}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {visible('projects') && resume.projects.some((row) => row.name) && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: template.accent }}>
                    Projects
                  </h2>
                  <div className="mt-2 space-y-3">
                    {resume.projects
                      .filter((row) => row.name)
                      .map((row, index) => (
                        <div key={index}>
                          <p className="text-sm font-bold">
                            {row.name}
                            {row.link ? (
                              <span className="ml-2 font-normal" style={{ opacity: 0.65 }}>
                                <a href={row.link} target="_blank" rel="noreferrer noopener">
                                  {row.link}
                                </a>
                              </span>
                            ) : null}
                          </p>
                          {row.tech && <p className="text-xs font-medium" style={{ opacity: 0.75 }}>Tech: {row.tech}</p>}
                          {row.description && <p className="mt-0.5 text-sm">{row.description}</p>}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {visible('certifications') && resume.certifications.some((row) => row.name) && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: template.accent }}>
                    Certifications
                  </h2>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">
                    {resume.certifications
                      .filter((row) => row.name)
                      .map((row, index) => (
                        <li key={index}>
                          {row.name}
                          {row.year ? ` (${row.year})` : ''}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {visible('achievements') && resume.achievements.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: template.accent }}>
                    Achievements
                  </h2>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">
                    {resume.achievements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {visible('languages') && resume.languages.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: template.accent }}>
                    Languages
                  </h2>
                  <p className="mt-1.5 text-sm">{resume.languages.join(' · ')}</p>
                </div>
              )}

              {visible('interests') && resume.interests.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: template.accent }}>
                    Interests
                  </h2>
                  <p className="mt-1.5 text-sm">{resume.interests.join(' · ')}</p>
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-ink-400">
            The PDF download uses a clean ATS-friendly layout so your final file scores well in
            every tracker. The on-screen preview reflects your template and spacing choices for
            the DOCX/print look.
          </p>
        </aside>
      </div>
    </ToolShell>
  )
}