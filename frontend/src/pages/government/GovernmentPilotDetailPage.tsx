import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Award,
  FileText,
  Building,
  Target,
} from 'lucide-react';
import pilotService from '../../services/pilotService';
import challengeService from '../../services/challengeService';
import submissionService from '../../services/submissionService';
import PilotTimeline from '../../components/timeline/PilotTimeline';
import { useToast } from '../../context/ToastContext';

export const GovernmentPilotDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const pilotId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: pilot, isLoading } = useQuery({
    queryKey: ['pilot', pilotId],
    queryFn: () => pilotService.getPilot(pilotId),
    enabled: !!pilotId,
  });

  const { data: challenge } = useQuery({
    queryKey: ['challenge', pilot?.challenge_id],
    queryFn: () => challengeService.getChallenge(pilot!.challenge_id),
    enabled: !!pilot?.challenge_id,
  });

  const { data: submissions } = useQuery({
    queryKey: ['pilot-submissions', pilotId],
    queryFn: () => submissionService.listSubmissions({ pilot_id: pilotId }),
    enabled: !!pilotId,
  });

  const completeMutation = useMutation({
    mutationFn: () => pilotService.completePilot(pilotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot', pilotId] });
      queryClient.invalidateQueries({ queryKey: ['pilots-all'] });
      success('Pilot marked completed', 'Ready to finalize contract and scale-up award.');
    },
    onError: (err: any) => {
      error('Failed to complete pilot', err.response?.data?.detail || 'An error occurred');
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading pilot...</p>
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <h3 className="text-base font-bold text-slate-800">Pilot Not Found</h3>
        <Link to="/government/pilots" className="text-xs text-gov-blue hover:underline mt-2 inline-block">
          ← Back to Pilots
        </Link>
      </div>
    );
  }

  const submission = submissions?.[0];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/government/pilots"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pilots
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-gov-blue">
                PILOT #{pilot.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  pilot.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-gov-blue border border-blue-200'
                }`}
              >
                STATUS: {pilot.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">Startup ID #{pilot.startup_id}</span>
            </div>

            <h1 className="text-2xl font-black text-gov-navy">{pilot.title}</h1>
            <p className="text-xs text-slate-500">Associated Challenge: {challenge?.title}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pilot.status === 'IN_PROGRESS' && (
              <button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Mark Completed
              </button>
            )}

            <Link
              to="/government/evaluations"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-sm"
            >
              <Award className="w-4 h-4 text-purple-600" /> Evaluations Workspace
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px]">Start Date</span>
            <span className="font-semibold text-slate-800">{pilot.start_date || 'Immediate'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Target End Date</span>
            <span className="font-semibold text-slate-800">{pilot.end_date || '90-day sandbox'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Submission State</span>
            <span className="font-semibold text-slate-800">{submission?.status || 'Pending Delivery'}</span>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <PilotTimeline
        applicationStatus="SHORTLISTED"
        pilotStatus={pilot.status}
        submissionStatus={submission?.status}
        hasEvaluations={false}
      />

      {/* Submission Evidence Review (If startup has submitted) */}
      {submission && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider">
                Startup Delivered Pilot Results & Telemetry
              </h3>
              <p className="text-xs text-slate-500">Submission ID #{submission.id} • Status: {submission.status}</p>
            </div>
            <Link
              to="/government/evaluations"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
            >
              Assign Evaluator →
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 mb-1">Results Narrative</h4>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{submission.results}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-1">Empirical KPI Results</h4>
              <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                <pre>{JSON.stringify(submission.kpi_results, null, 2)}</pre>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-1">Evidence & Telemetry Links</h4>
              <div className="p-3 rounded-xl bg-slate-900 text-blue-300 font-mono text-xs overflow-x-auto">
                <pre>{JSON.stringify(submission.evidence, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task & Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-gov-blue" /> Pilot Scope & Tasks
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{pilot.task_description}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Success Criteria
          </h3>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
            <pre>{JSON.stringify(pilot.success_criteria, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernmentPilotDetailPage;
