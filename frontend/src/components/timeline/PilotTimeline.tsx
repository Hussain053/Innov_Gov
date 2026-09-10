import React from 'react';
import { CheckCircle2, Clock, PlayCircle, FileCheck, Award, FileText, ChevronRight, XCircle } from 'lucide-react';
import { PilotStatus, ApplicationStatus, PilotSubmissionStatus, ContractStatus } from '../../types';

interface PilotTimelineProps {
  applicationStatus?: ApplicationStatus;
  pilotStatus?: PilotStatus;
  submissionStatus?: PilotSubmissionStatus;
  contractStatus?: ContractStatus;
  hasEvaluations?: boolean;
  isAwarded?: boolean;
}

export const PilotTimeline: React.FC<PilotTimelineProps> = ({
  applicationStatus = 'SHORTLISTED',
  pilotStatus,
  submissionStatus,
  contractStatus,
  hasEvaluations = false,
  isAwarded = false,
}) => {
  // Compute stage statuses
  const stages = [
    {
      id: 'app',
      label: '1. Application',
      sublabel: applicationStatus === 'SHORTLISTED' ? 'Shortlisted' : applicationStatus,
      isDone: applicationStatus === 'SHORTLISTED',
      isCurrent: ['SUBMITTED', 'UNDER_REVIEW'].includes(applicationStatus),
      icon: CheckCircle2,
    },
    {
      id: 'pilot_init',
      label: '2. Pilot Setup',
      sublabel: pilotStatus ? 'Pilot Created' : 'Pending Setup',
      isDone: !!pilotStatus,
      isCurrent: applicationStatus === 'SHORTLISTED' && !pilotStatus,
      icon: Clock,
    },
    {
      id: 'pilot_prog',
      label: '3. In Progress',
      sublabel: pilotStatus === 'IN_PROGRESS' || pilotStatus === 'COMPLETED' ? 'Started' : 'Assigned',
      isDone: pilotStatus === 'IN_PROGRESS' || pilotStatus === 'COMPLETED',
      isCurrent: pilotStatus === 'ASSIGNED',
      icon: PlayCircle,
    },
    {
      id: 'evidence',
      label: '4. Evidence Submitted',
      sublabel: submissionStatus === 'SUBMITTED' || submissionStatus === 'UNDER_EVALUATION' || submissionStatus === 'ACCEPTED'
        ? 'Submitted'
        : 'Telemetry & KPIs',
      isDone: ['SUBMITTED', 'UNDER_EVALUATION', 'ACCEPTED'].includes(submissionStatus || ''),
      isCurrent: pilotStatus === 'IN_PROGRESS' && !submissionStatus,
      icon: FileCheck,
    },
    {
      id: 'eval',
      label: '5. Evaluation',
      sublabel: hasEvaluations ? 'Evaluated' : 'Panel Review',
      isDone: hasEvaluations,
      isCurrent: submissionStatus === 'SUBMITTED' || submissionStatus === 'UNDER_EVALUATION',
      icon: Award,
    },
    {
      id: 'contract',
      label: '6. Contract & Award',
      sublabel: contractStatus ? `Contract ${contractStatus}` : isAwarded ? 'Procurement Awarded' : 'Pending Decision',
      isDone: !!contractStatus || isAwarded,
      isCurrent: hasEvaluations && !contractStatus && !isAwarded,
      icon: FileText,
    },
    {
      id: 'scale',
      label: '7. Scale-Up',
      sublabel: contractStatus === 'ACTIVE' || contractStatus === 'COMPLETED' ? 'Scaling Nationwide' : 'Public Scale',
      isDone: contractStatus === 'ACTIVE' || contractStatus === 'COMPLETED',
      isCurrent: contractStatus === 'AWARDED',
      icon: ChevronRight,
    },
  ];

  const isFailed = pilotStatus === 'FAILED';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gov-navy tracking-tight uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gov-blue"></span>
            SIH Procurement State Timeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stage transitions synchronized with backend FastAPI state machine
          </p>
        </div>
        {isFailed ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Pilot Terminated / Failed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-gov-blue border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Active Procurement Track
          </span>
        )}
      </div>

      {/* Stepper container */}
      <div className="relative">
        <div className="overflow-x-auto pb-2">
          <div className="flex items-start justify-between min-w-[720px] relative">
            {/* Connecting line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div key={stage.id} className="relative z-10 flex flex-col items-center text-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      stage.isDone
                        ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                        : stage.isCurrent
                        ? 'bg-gov-blue text-white shadow-md ring-4 ring-blue-100 animate-bounce-subtle'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <p
                      className={`text-xs font-semibold leading-tight ${
                        stage.isDone ? 'text-emerald-800' : stage.isCurrent ? 'text-gov-blue' : 'text-slate-500'
                      }`}
                    >
                      {stage.label}
                    </p>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{stage.sublabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PilotTimeline;
