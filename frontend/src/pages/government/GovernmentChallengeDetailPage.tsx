import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  ArrowLeft,
  Calendar,
  MapPin,
  IndianRupee,
  Sparkles,
  FileCheck2,
  Send,
  Users,
  Building,
} from 'lucide-react';
import challengeService from '../../services/challengeService';
import applicationService from '../../services/applicationService';
import { useToast } from '../../context/ToastContext';

export const GovernmentChallengeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const challengeId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => challengeService.getChallenge(challengeId),
    enabled: !!challengeId,
  });

  const { data: applications } = useQuery({
    queryKey: ['applications-challenge', challengeId],
    queryFn: () => applicationService.listApplications({ challenge_id: challengeId }),
    enabled: !!challengeId,
  });

  const publishMutation = useMutation({
    mutationFn: () => challengeService.publishChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['challenges-all'] });
      success('Challenge published', 'Status changed to OPEN.');
    },
    onError: (err: any) => {
      error('Publish failed', err.response?.data?.detail || 'An error occurred');
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading challenge...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <h3 className="text-base font-bold text-slate-800">Challenge Not Found</h3>
        <Link to="/government/challenges" className="text-xs text-gov-blue hover:underline mt-2 inline-block">
          ← Back to Challenges
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/government/challenges"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Challenges
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-gov-blue uppercase">
                {challenge.category || 'Tender'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  challenge.status === 'OPEN'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                STATUS: {challenge.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID #{challenge.id}</span>
            </div>

            <h1 className="text-2xl font-black text-gov-navy">{challenge.title}</h1>
            <p className="text-xs text-slate-500">
              Applications received: <strong className="text-slate-800 font-bold">{applications?.length || 0}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {challenge.status === 'DRAFT' && (
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Publish Challenge (OPEN)
              </button>
            )}

            <Link
              to={`/government/matching/${challenge.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-purple-600" /> AI Startup Match Engine
            </Link>

            <Link
              to={`/government/challenges/${challenge.id}/applications`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gov-blue text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FileCheck2 className="w-4 h-4" /> Review Received Applications
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Budget</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              ₹{challenge.budget ? (challenge.budget / 100000).toFixed(1) + ' Lakhs' : 'Pilot Grant'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Location</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{challenge.location || 'Pan-India'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Application Deadline</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{challenge.application_deadline || 'Rolling'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Created At</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{new Date(challenge.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Problem & Scope */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100">
            Core Problem Statement
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{challenge.problem_statement}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100">
            Description & Scope of Work
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{challenge.description}</p>
        </div>
      </div>

      {challenge.requirements?.assigned_evaluator && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100">
            Assigned Evaluator
          </h3>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-base font-bold text-slate-900">{challenge.requirements.assigned_evaluator.name}</p>
              <p className="text-xs text-slate-500">{challenge.requirements.assigned_evaluator.organization || challenge.requirements.assigned_evaluator.email}</p>
            </div>
            <div className="rounded-xl bg-purple-50 border border-purple-200 px-3 py-2 text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-purple-700">Evaluator Match</p>
              <p className="text-lg font-black text-purple-900">{challenge.requirements.assigned_evaluator.match_score || 0}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernmentChallengeDetailPage;
