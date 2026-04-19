'use client';

import { useState } from 'react';
import {
  User, Mail, Phone, MapPin, Link2, Briefcase, GraduationCap, Wrench,
  Award, Sparkles, Plus, Trash2, Download, ArrowLeft, Palette,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createCV, downloadCVPdf, type CreateCVData } from '@/lib/api';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import TemplatePicker from './TemplatePicker';
import PhotoUpload from './PhotoUpload';
import CVPreview from './CVPreview';
import QuickEditBox from './QuickEditBox';
import { TEMPLATES, type TemplateId } from './templates';

const glass = {
  background: 'rgba(0,0,0,0.30)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const;

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.85)',
} as const;

const inputClass = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none';

type Experience = { title: string; company: string; duration: string; bullets: string[] };
type Education  = { degree: string; institution: string; year: string };

const emptyExperience = (): Experience => ({ title: '', company: '', duration: '', bullets: [''] });
const emptyEducation  = (): Education  => ({ degree: '', institution: '', year: '' });

export default function CreateCVForm() {
  const router = useRouter();
  const { subscription, bumpLocalUsage, fetchSubscription } = useSubscriptionStore();
  const isPro = subscription?.plan === 'pro' || subscription?.plan === 'pro_plus';

  /* ─── Form fields ─── */
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [summary, setSummary]   = useState('');
  const [experience, setExperience] = useState<Experience[]>([emptyExperience()]);
  const [education, setEducation]   = useState<Education[]>([emptyEducation()]);
  const [skillsInput, setSkillsInput] = useState('');
  const [certifications, setCertifications] = useState<string[]>(['']);

  /* ─── Preview-phase state (template + photo picked AFTER generation) ─── */
  const [template, setTemplate] = useState<TemplateId>('harvard');
  const [photo, setPhoto] = useState<string | null>(null);

  /* ─── Flow state ─── */
  const [phase, setPhase] = useState<'form' | 'preview'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [cvRecordId, setCvRecordId] = useState<string | null>(null);
  const [generatedCV, setGeneratedCV] = useState<any>(null);

  /* ─── Experience handlers ─── */
  const addExperience = () => setExperience((xs) => [...xs, emptyExperience()]);
  const removeExperience = (i: number) =>
    setExperience((xs) => (xs.length <= 1 ? xs : xs.filter((_, idx) => idx !== i)));
  const updateExperience = (i: number, patch: Partial<Experience>) =>
    setExperience((xs) => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const addBullet = (i: number) =>
    setExperience((xs) => xs.map((x, idx) => (idx === i ? { ...x, bullets: [...x.bullets, ''] } : x)));
  const removeBullet = (i: number, bIdx: number) =>
    setExperience((xs) =>
      xs.map((x, idx) =>
        idx === i && x.bullets.length > 1
          ? { ...x, bullets: x.bullets.filter((_, bi) => bi !== bIdx) }
          : x
      )
    );
  const updateBullet = (i: number, bIdx: number, value: string) =>
    setExperience((xs) =>
      xs.map((x, idx) =>
        idx === i ? { ...x, bullets: x.bullets.map((b, bi) => (bi === bIdx ? value : b)) } : x
      )
    );

  /* ─── Education handlers ─── */
  const addEducation = () => setEducation((xs) => [...xs, emptyEducation()]);
  const removeEducation = (i: number) =>
    setEducation((xs) => (xs.length <= 1 ? xs : xs.filter((_, idx) => idx !== i)));
  const updateEducation = (i: number, patch: Partial<Education>) =>
    setEducation((xs) => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  /* ─── Cert handlers ─── */
  const addCert = () => setCertifications((cs) => [...cs, '']);
  const removeCert = (i: number) =>
    setCertifications((cs) => (cs.length <= 1 ? cs : cs.filter((_, idx) => idx !== i)));
  const updateCert = (i: number, value: string) =>
    setCertifications((cs) => cs.map((c, idx) => (idx === i ? value : c)));

  const canSubmit = fullName.trim().length > 0 && !submitting;

  const handleGenerate = async () => {
    if (!canSubmit) {
      if (!fullName.trim()) toast.error('Full name is required');
      return;
    }

    const cv: CreateCVData = {
      full_name: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      location: location.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      summary: summary.trim() || undefined,
      experience: experience
        .map((e) => ({
          title: e.title.trim(),
          company: e.company.trim(),
          duration: e.duration.trim(),
          bullets: e.bullets.map((b) => b.trim()).filter(Boolean),
        }))
        .filter((e) => e.title || e.company || e.bullets.length),
      education: education
        .map((e) => ({
          degree: e.degree.trim(),
          institution: e.institution.trim(),
          year: e.year.trim(),
        }))
        .filter((e) => e.degree || e.institution || e.year),
      skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
      certifications: certifications.map((c) => c.trim()).filter(Boolean),
    };

    setSubmitting(true);
    try {
      // Template is picked at preview stage — we save the record with the default
      // and let the download endpoint override per request.
      const res = await createCV(cv);
      setCvRecordId(res.data.cv_record_id);
      setGeneratedCV(res.data.final_cv);
      bumpLocalUsage('cv');
      fetchSubscription();
      setPhase('preview');
      toast.success('CV generated — pick a template and preview below.');
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { error?: string } } };
      if (axErr.response?.status === 429) fetchSubscription();
      const msg = axErr.response?.data?.error || 'Failed to create CV';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefine = (updatedCV: any) => {
    setGeneratedCV(updatedCV);
  };

  const handleDownload = async () => {
    if (!cvRecordId) return;
    setDownloading(true);
    try {
      await downloadCVPdf(cvRecordId, {
        template,
        photo: template === 'european' ? photo : null,
      });
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleBackToEdit = () => {
    setPhase('form');
  };

  /* ═════════════════════════════════════════════════════════════════════ */
  /*                              PREVIEW PHASE                             */
  /* ═════════════════════════════════════════════════════════════════════ */
  if (phase === 'preview' && generatedCV && cvRecordId) {
    return (
      <div className="mx-auto max-w-5xl">
        {/* Back button */}
        <button
          type="button"
          onClick={handleBackToEdit}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white/55 hover:text-white mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to edit
        </button>

        {/* Preview */}
        <div className="rounded-2xl p-4 sm:p-5" style={glass}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4" style={{ color: '#a78bfa' }} />
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Preview</p>
          </div>
          <CVPreview cv={generatedCV} template={template} photo={template === 'european' ? photo : null} />
        </div>

        {/* Template picker */}
        <div className="rounded-2xl p-4 sm:p-5 mt-4" style={glass}>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4" style={{ color: '#a78bfa' }} />
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">
              Template — {TEMPLATES[template].name}
            </p>
          </div>
          <TemplatePicker
            value={template}
            onChange={setTemplate}
            isPro={isPro}
            onUpgrade={() => router.push('/pricing')}
          />
          {template === 'european' && (
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                Photo (optional — European CV only)
              </p>
              <PhotoUpload value={photo} onChange={setPhoto} />
            </div>
          )}
        </div>

        {/* AI edits */}
        <div className="mt-4">
          <QuickEditBox cvRecordId={cvRecordId} onRefine={handleRefine} />
        </div>

        {/* Download */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg,#764DF0,#5b21b6)',
            color: 'white',
            boxShadow: !downloading ? '0 8px 24px rgba(118,77,240,0.35)' : 'none',
          }}
        >
          {downloading ? (
            <>
              <span className="lds-roller-sm"><span /><span /><span /><span /><span /><span /><span /><span /></span>
              Preparing PDF…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download CV (PDF)
            </>
          )}
        </button>

        <p className="text-[11px] text-white/35 mt-3 text-center">
          Your CV is already saved to History — you can come back and re-download it later in any template.
        </p>
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════ */
  /*                                FORM PHASE                              */
  /* ═════════════════════════════════════════════════════════════════════ */
  return (
    <div className="mx-auto max-w-3xl">
      {/* Personal info */}
      <div className="rounded-2xl p-4 sm:p-5" style={glass}>
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4" style={{ color: '#a78bfa' }} />
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Personal info</p>
        </div>

        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name (required)"
          className={`${inputClass} mb-3`}
          style={inputStyle}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LabeledInput icon={<Mail className="h-3.5 w-3.5" />} value={email} onChange={setEmail} placeholder="Email" />
          <LabeledInput icon={<Phone className="h-3.5 w-3.5" />} value={phone} onChange={setPhone} placeholder="Phone" />
          <LabeledInput icon={<MapPin className="h-3.5 w-3.5" />} value={location} onChange={setLocation} placeholder="Location (e.g. Berlin, DE)" />
          <LabeledInput icon={<Link2 className="h-3.5 w-3.5" />} value={linkedin} onChange={setLinkedin} placeholder="LinkedIn URL" />
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl p-4 sm:p-5 mt-4" style={glass}>
        <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">
          Professional summary
        </p>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="2–4 sentences: who you are, what you do, and what makes you strong."
          rows={4}
          className={`${inputClass} resize-y`}
          style={{ ...inputStyle, minHeight: 100 }}
        />
      </div>

      {/* Experience */}
      <div className="rounded-2xl p-4 sm:p-5 mt-4" style={glass}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" style={{ color: '#a78bfa' }} />
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Work experience</p>
          </div>
          <AddButton onClick={addExperience} label="Add role" />
        </div>

        {experience.map((exp, i) => (
          <div
            key={i}
            className="rounded-xl p-3 mb-3 last:mb-0"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              <input
                type="text"
                value={exp.title}
                onChange={(e) => updateExperience(i, { title: e.target.value })}
                placeholder="Job title"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="text"
                value={exp.company}
                onChange={(e) => updateExperience(i, { company: e.target.value })}
                placeholder="Company"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="text"
                value={exp.duration}
                onChange={(e) => updateExperience(i, { duration: e.target.value })}
                placeholder="Duration (e.g. 2022 – Present)"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-3 mb-1.5">
              Key achievements
            </p>
            {exp.bullets.map((b, bIdx) => (
              <div key={bIdx} className="flex items-center gap-2 mb-1.5">
                <span className="text-white/35 text-xs">•</span>
                <input
                  type="text"
                  value={b}
                  onChange={(e) => updateBullet(i, bIdx, e.target.value)}
                  placeholder="Started with a verb — shipped X, grew Y, led Z…"
                  className={inputClass}
                  style={inputStyle}
                />
                {exp.bullets.length > 1 && (
                  <IconButton onClick={() => removeBullet(i, bIdx)} icon={<Trash2 className="h-3.5 w-3.5" />} />
                )}
              </div>
            ))}
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => addBullet(i)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-white/50 hover:text-white/80"
              >
                <Plus className="h-3 w-3" /> Add bullet
              </button>
              {experience.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExperience(i)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold"
                  style={{ color: '#f87171' }}
                >
                  <Trash2 className="h-3 w-3" /> Remove role
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="rounded-2xl p-4 sm:p-5 mt-4" style={glass}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" style={{ color: '#a78bfa' }} />
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Education</p>
          </div>
          <AddButton onClick={addEducation} label="Add education" />
        </div>

        {education.map((edu, i) => (
          <div
            key={i}
            className="rounded-xl p-3 mb-3 last:mb-0"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateEducation(i, { degree: e.target.value })}
                placeholder="Degree"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => updateEducation(i, { institution: e.target.value })}
                placeholder="Institution"
                className={inputClass}
                style={inputStyle}
              />
              <input
                type="text"
                value={edu.year}
                onChange={(e) => updateEducation(i, { year: e.target.value })}
                placeholder="Year (e.g. 2024)"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            {education.length > 1 && (
              <button
                type="button"
                onClick={() => removeEducation(i)}
                className="inline-flex items-center gap-1 text-[11px] font-bold mt-2"
                style={{ color: '#f87171' }}
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="rounded-2xl p-4 sm:p-5 mt-4" style={glass}>
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="h-4 w-4" style={{ color: '#a78bfa' }} />
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Skills</p>
        </div>
        <input
          type="text"
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
          placeholder="Comma-separated — e.g. React, TypeScript, Node.js, PostgreSQL"
          className={inputClass}
          style={inputStyle}
        />
        <p className="text-[11px] text-white/35 mt-2">Separate each skill with a comma.</p>
      </div>

      {/* Certifications */}
      <div className="rounded-2xl p-4 sm:p-5 mt-4" style={glass}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4" style={{ color: '#a78bfa' }} />
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Certifications</p>
          </div>
          <AddButton onClick={addCert} label="Add cert" />
        </div>
        {certifications.map((c, i) => (
          <div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
            <input
              type="text"
              value={c}
              onChange={(e) => updateCert(i, e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect"
              className={inputClass}
              style={inputStyle}
            />
            {certifications.length > 1 && (
              <IconButton onClick={() => removeCert(i)} icon={<Trash2 className="h-3.5 w-3.5" />} />
            )}
          </div>
        ))}
      </div>

      {/* Generate — takes user to the preview phase, where they pick template and download */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canSubmit}
        className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all disabled:opacity-40"
        style={{
          background: 'linear-gradient(135deg,#764DF0,#5b21b6)',
          color: 'white',
          boxShadow: canSubmit ? '0 8px 24px rgba(118,77,240,0.35)' : 'none',
        }}
      >
        {submitting ? (
          <>
            <span className="lds-roller-sm"><span /><span /><span /><span /><span /><span /><span /><span /></span>
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate CV
          </>
        )}
      </button>

      <p className="text-[11px] text-white/35 mt-3 text-center">
        You&apos;ll preview the CV next, pick a template, fine-tune with AI, then download.
      </p>
    </div>
  );
}

/* ─── Small shared widgets ─── */

function LabeledInput({
  icon, value, onChange, placeholder,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">{icon}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-9`}
        style={inputStyle}
      />
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold"
      style={{
        background: 'rgba(118,77,240,0.18)',
        border: '1px solid rgba(118,77,240,0.35)',
        color: '#c4b5fd',
      }}
    >
      <Plus className="h-3 w-3" /> {label}
    </button>
  );
}

function IconButton({ onClick, icon }: { onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg"
      style={{
        background: 'rgba(248,113,113,0.10)',
        border: '1px solid rgba(248,113,113,0.25)',
        color: '#f87171',
      }}
    >
      {icon}
    </button>
  );
}
