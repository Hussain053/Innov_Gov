import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  UploadCloud,
  FileText,
  Building,
  Target,
  Clock,
} from 'lucide-react';
import pilotService from '../../services/pilotService';
import challengeService from '../../services/challengeService';
import submissionService from '../../services/submissionService';
import PilotTimeline from '../../components/timeline/PilotTimeline';
import { useToast } from '../../context/ToastContext';

export const StartupPilotDetailPage: React.FC = () => {
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

  const existingSubmission = submissions?.[0];

  const startMutation = useMutation({
    mutationFn: () => pilotService.startPilot(pilotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot', pilotId] });
      queryClient.invalidateQueries({ queryKey: ['my-pilots'] });
      success('Pilot started', 'Status transitioned to IN_PROGRESS.');
    },
    onError: (err: any) => {
      error('Failed to start pilot', err.response?.data?.detail || 'An error occurred');
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading pilot specifications...</p>
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <h3 className="text-base font-bold text-slate-800">Pilot Not Found</h3>
        <Link to="/startup/pilots" className="text-xs text-gov-blue hover:underline mt-2 inline-block">
          ← Back to Pilots
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/startup/pilots"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pilots List
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-gov-blue">
                PILOT #{pilot.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                STATUS: {pilot.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-gov-navy">{pilot.title}</h1>
            <p className="text-xs text-slate-500">Associated Challenge: {challenge?.title}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pilot.status === 'ASSIGNED' && (
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4" /> Start Pilot Deployment
              </button>
            )}

            {pilot.status === 'IN_PROGRESS' && (
              <Link
                to={`/startup/pilots/${pilot.id}/submit`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <UploadCloud className="w-4 h-4" />
                {existingSubmission ? 'Update / View Submission' : 'Submit KPI Evidence'}
              </Link>
            )}
          </div>
        </div>

        {/* Timeline Dates */}
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
            <span className="text-slate-400 block text-[11px]">Sanction Date</span>
            <span className="font-semibold text-slate-800">{new Date(pilot.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <PilotTimeline
        applicationStatus="SHORTLISTED"
        pilotStatus={pilot.status}
        submissionStatus={existingSubmission?.status}
        hasEvaluations={false}
      />

      {/* Task Description & Success Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Target className="w-4 h-4 text-gov-blue" />
            Task Description & Milestones
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {pilot.task_description}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Success Criteria
          </h3>
          {pilot.success_criteria ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto">
              <pre>{JSON.stringify(pilot.success_criteria, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Demonstrate agreed baseline improvements under sandbox conditions.</p>
          )}
        </div>
      </div>

      {/* Requirements & Target KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 mb-3">
            Hardware / Operational Requirements
          </h3>
          {pilot.requirements ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto">
              <pre>{JSON.stringify(pilot.requirements, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Follow standard government sandbox security guidelines.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 mb-3">
            Mandatory Target KPIs
          </h3>
          {pilot.kpis ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-emerald-700 overflow-x-auto">
              <pre>{JSON.stringify(pilot.kpis, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Benchmark telemetry to be recorded during field trial.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartupPilotDetailPage;
