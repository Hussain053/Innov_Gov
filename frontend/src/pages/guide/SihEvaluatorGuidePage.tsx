import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  Rocket,
  Scale,
  Search,
  ShieldCheck,
  Settings,
  Target,
  Users,
} from 'lucide-react';

const stages = [
  {
    number: '01',
    title: 'Identify',
    description: 'Government departments publish outcome-based challenges with clear goals, KPIs, eligibility criteria, and budgets.',
    icon: Search,
  },
  {
    number: '02',
    title: 'Discover',
    description: 'Verified startups are matched to challenges using sector, capability, eligibility, and track-record signals.',
    icon: Target,
  },
  {
    number: '03',
    title: 'Pilot',
    description: 'Selected startups execute controlled pilots with milestones, evidence requirements, timelines, and contracts.',
    icon: FileCheck2,
  },
  {
    number: '04',
    title: 'Evaluate',
    description: 'Independent evaluators review pilot evidence and score technical rigor, KPI adherence, feasibility, innovation, and public impact.',
    icon: Award,
  },
  {
    number: '05',
    title: 'Procure',
    description: 'Government teams use transparent evaluation summaries to make compliant contracting and procurement decisions.',
    icon: Scale,
  },
  {
    number: '06',
    title: 'Scale',
    description: 'Successful pilots move toward milestone-based payments, validated procurement, and expansion across departments or districts.',
    icon: ArrowRight,
  },
];

const roleSteps = [
  {
    title: 'Government',
    sectionLabel: 'Government Portal',
    description: 'Creates the challenge and takes procurement decisions.',
    icon: Building2,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    steps: [
      'Create a problem statement with outcomes, KPIs, budget, timeline, and eligibility rules.',
      'Review matched startups and shortlist suitable solutions for a pilot.',
      'Create pilot milestones, assign evaluators, and monitor submitted evidence.',
      'Review evaluation summaries and approve procurement, rejection, or scale-up decisions.',
    ],
  },
  {
    title: 'Startup',
    sectionLabel: 'Startup Portal',
    description: 'Presents an eligible solution and delivers the pilot.',
    icon: Rocket,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    steps: [
      'Register the organization, solution capabilities, documents, and contact details.',
      'Browse government challenges and submit applications for relevant opportunities.',
      'Respond to selection, accept pilot terms, and complete assigned milestones.',
      'Upload telemetry, KPI evidence, reports, and payment documentation on time.',
    ],
  },
  {
    title: 'Evaluator',
    sectionLabel: 'Evaluator Portal',
    description: 'Independently validates evidence and scores pilot performance.',
    icon: Award,
    color: 'text-violet-700 bg-violet-50 border-violet-200',
    steps: [
      'Open assigned pilot submissions from the evaluator dashboard.',
      'Review technical documents, telemetry, milestone evidence, and KPI results.',
      'Score technical rigor, KPI adherence, innovation, feasibility, and public impact.',
      'Submit a reasoned evaluation so government can make an evidence-based decision.',
    ],
  },
  {
    title: 'Admin',
    sectionLabel: 'Admin Portal',
    description: 'Governs trust, access, and platform-wide accountability.',
    icon: Settings,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    steps: [
      'Verify startup profiles and manage government, evaluator, and startup accounts.',
      'Assign roles and evaluator responsibilities with role-based access control.',
      'Monitor activity logs, notifications, contracts, and platform health.',
      'Maintain an auditable record of decisions and support compliant procurement operations.',
    ],
  },
];

const features = [
  'Structured challenge and problem-statement templates',
  'Verified startup profiles and eligibility screening',
  'Transparent startup-to-challenge matching',
  'Controlled pilots with milestones and telemetry evidence',
  'Independent multi-criteria evaluator scorecards',
  'Data, intellectual property, cybersecurity, and risk controls',
  'Milestone-based contracting and payment tracking',
  'Evidence-based procurement and scale-up decisions',
];

export const SihEvaluatorGuidePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <header className="bg-gov-navy text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
            <div className="w-10 h-10 rounded-xl bg-gov-blue flex items-center justify-center font-black text-lg">IG</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight">InnoGov</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 border border-blue-300/40 rounded px-1.5 py-0.5">SIH 26136</span>
              </div>
              <p className="text-[11px] text-slate-300">Public Procurement Innovation Platform</p>
            </div>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-gov-blue border border-blue-200">
                <ShieldCheck className="w-4 h-4" /> SIH Evaluator Guide
              </div>
              <h1 className="mt-5 text-4xl sm:text-5xl font-black leading-tight text-gov-navy">
                From a public problem to a validated innovation.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
                InnoGov is a transparent, competitive, and legally compliant pathway for government departments to identify,
                pilot, procure, and scale eligible startup solutions.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                  <Users className="w-4 h-4 text-gov-blue" /> Team: TechYuva
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                  <LockKeyhole className="w-4 h-4 text-gov-blue" /> Problem Statement ID: 26136
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-bold uppercase tracking-wider text-gov-blue">Role-based platform guide</p>
              <h2 className="mt-3 text-3xl font-extrabold text-gov-navy">Four portals, one accountable workflow</h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Each portal has a defined responsibility in the journey from public challenge to validated innovation.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-5">
              {roleSteps.map((roleStep) => {
                const Icon = roleStep.icon;
                return (
                  <article
                    key={roleStep.title}
                    aria-labelledby={`${roleStep.title.toLowerCase()}-portal-heading`}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${roleStep.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gov-blue">{roleStep.sectionLabel}</p>
                        <h3 id={`${roleStep.title.toLowerCase()}-portal-heading`} className="mt-1 text-xl font-extrabold text-gov-navy">
                          {roleStep.title} steps
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">{roleStep.description}</p>
                      </div>
                    </div>
                    <ol className="mt-5 space-y-3">
                      {roleStep.steps.map((step, index) => (
                        <li key={step} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                          <span className="flex w-6 h-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-gov-blue">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
            <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gov-blue">Challenge brief</p>
              <h2 className="mt-3 text-2xl font-extrabold text-gov-navy">Startup-friendly public procurement</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Conventional procurement is often designed for standardized goods and established vendors. Departments can
                struggle to formulate outcome-based problems, discover suitable startups, evaluate novel technologies, manage
                data and intellectual property, measure pilots, and move successful pilots into compliant procurement.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Startups may face prior-turnover or experience requirements, long sales cycles, unclear payment milestones,
                and limited visibility of departmental demand. InnoGov addresses these barriers with a structured,
                evidence-led workflow.
              </p>
            </article>

            <aside className="bg-gov-navy text-white rounded-2xl p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Submission context</p>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-slate-400">Problem Statement Title</dt>
                  <dd className="mt-1 font-semibold leading-relaxed">Startup friendly public procurement mechanism that enables government departments to identify, pilot, procure, and scale innovative solutions from eligible startups</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Organization</dt>
                  <dd className="mt-1 font-semibold">Government of Maharashtra</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Department</dt>
                  <dd className="mt-1 font-semibold leading-relaxed">Maharashtra State Innovation Society, Department of Skills, Employment, Entrepreneurship and Innovation</dd>
                </div>
                <div className="flex gap-6">
                  <div><dt className="text-slate-400">Category</dt><dd className="mt-1 font-semibold">Software</dd></div>
                  <div><dt className="text-slate-400">Theme</dt><dd className="mt-1 font-semibold">Miscellaneous</dd></div>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        <section className="bg-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-bold uppercase tracking-wider text-gov-blue">The platform workflow</p>
              <h2 className="mt-3 text-3xl font-extrabold text-gov-navy">Six stages from challenge to scale</h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">Each stage creates the evidence and governance needed for the next decision.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stages.map((stage) => {
                const Icon = stage.icon;
                return (
                  <article key={stage.number} className="p-5 rounded-xl bg-[#F8FAFC] border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-blue-200">{stage.number}</span>
                      <Icon className="w-5 h-5 text-gov-blue" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-gov-navy">{stage.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{stage.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="bg-gov-navy rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Optional platform access</p>
                <h2 className="mt-2 text-2xl font-extrabold">Review the platform without registering</h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Evaluators who do not want to create an account can use these review credentials to access each portal.
                  Select the matching role on the sign-in page.
                </p>
              </div>
            </div>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['Startup', 'navya@gmail.com', 'Password123'],
                ['Evaluator', 'neel@gmail.com', 'Password123'],
                ['Government', 'dd@gmail.com', 'Password123!'],
                ['Admin', 'ayush@gmail.com', 'password123'],
              ].map(([role, email, password]) => (
                <div key={role} className="rounded-xl bg-white/10 border border-white/10 p-4">
                  <p className="text-sm font-bold text-white">{role}</p>
                  <p className="mt-3 text-xs text-slate-300">Email</p>
                  <p className="text-sm font-mono text-blue-100 break-all">{email}</p>
                  <p className="mt-2 text-xs text-slate-300">Password</p>
                  <p className="text-sm font-mono text-blue-100">{password}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid lg:grid-cols-2 gap-6">
            <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-gov-blue">Expected outcome</p>
              <h2 className="mt-3 text-2xl font-extrabold text-gov-navy">A lower-risk path to innovation</h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                The mechanism enables faster discovery and testing, higher-quality pilots, reduced departmental risk, timely
                startup payments, independent validation, evidence-based procurement decisions, and successful scaling across
                departments or districts.
              </p>
            </article>
            <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-gov-blue">Platform features</p>
              <h2 className="mt-3 text-2xl font-extrabold text-gov-navy">Built for accountable decisions</h2>
              <ul className="mt-5 grid sm:grid-cols-2 gap-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </main>

      <footer className="bg-gov-navy text-slate-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">TechYuva</p>
            <p className="text-xs mt-1">InnoGov | SIH Problem Statement 26136</p>
          </div>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-200">
            Explore the platform <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default SihEvaluatorGuidePage;
