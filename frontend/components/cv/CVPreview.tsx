'use client';

export default function CVPreview({ cv }: { cv: any }) {
  if (!cv) return null;

  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  return (
    <div className="rounded-xl bg-white p-4 sm:p-6 md:p-8 ring-1 ring-zinc-800 break-words" style={{ fontFamily: 'Calibri, sans-serif', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      {/* Name */}
      <h1 className="text-center text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{cv.full_name}</h1>

      {/* Contact */}
      {contactParts.length > 0 && (
        <p className="text-center text-xs md:text-sm text-gray-500 mt-1 break-all">{contactParts.join(' | ')}</p>
      )}

      <hr className="my-4 border-gray-900" />

      {/* Summary */}
      {cv.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{cv.summary}</p>
        </section>
      )}

      {/* Experience */}
      {cv.experience && cv.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Work Experience
          </h2>
          {cv.experience.map((role: any, i: number) => (
            <div key={i} className="mb-3">
              <p className="font-semibold text-sm text-gray-900">{role.title}</p>
              <p className="text-sm italic text-gray-500">
                {role.company} | {role.duration}
              </p>
              {role.bullets && role.bullets.length > 0 && (
                <ul className="mt-1 ml-4 list-disc space-y-0.5">
                  {role.bullets.map((bullet: string, j: number) => (
                    <li key={j} className="text-sm text-gray-700">{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {cv.skills && cv.skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Skills
          </h2>
          <p className="text-sm text-gray-700">{cv.skills.join(', ')}</p>
        </section>
      )}

      {/* Education */}
      {cv.education && cv.education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Education
          </h2>
          {cv.education.map((edu: any, i: number) => (
            <p key={i} className="text-sm text-gray-700">
              {[edu.degree, edu.institution, edu.year].filter(Boolean).join(' \u2014 ')}
            </p>
          ))}
        </section>
      )}

      {/* Certifications */}
      {cv.certifications && cv.certifications.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Certifications
          </h2>
          {cv.certifications.map((cert: any, i: number) => (
            <p key={i} className="text-sm text-gray-700">
              {typeof cert === 'string' ? cert : cert.name || JSON.stringify(cert)}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
