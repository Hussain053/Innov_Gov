import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  ArrowRight,
  Award,
  Sparkles,
} from 'lucide-react';
import evaluatorAssignmentService from '../../services/evaluatorAssignmentService';
import submissionService from '../../services/submissionService';
import { EvaluatorAssignment } from '../../types';

export const EvaluatorAssignmentsPage: React.FC = () => {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['my-evaluator-assignments'],
    queryFn: () => evaluatorAssignmentService.listAssignments(),
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <h1 className="text-xl font-bold text-gov-navy flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-purple-600" />
          Assigned Pilot Submissions
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Submissions assigned by government departments for empirical KPI evaluation and procurement recommendation.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading assigned submissions...</p>
        </div>
      ) : assignments?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No Assignments Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            When government tender departments assign pilot submissions to your evaluator profile, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments?.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Assignment #{assignment.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      assignment.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {assignment.status}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">
                    Submission #{assignment.pilot_submission_id}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Pilot Submission Technical Review #{assignment.pilot_submission_id}
                </h3>

                <p className="text-xs text-slate-500">
                  Assigned date: {new Date(assignment.assigned_at).toLocaleDateString()}
                  {assignment.completed_at && (
                    <span> • Completed on {new Date(assignment.completed_at).toLocaleDateString()}</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/evaluator/evaluate/${assignment.pilot_submission_id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <span>
                    {assignment.status === 'COMPLETED' ? 'View Evaluation' : 'Score Submission'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvaluatorAssignmentsPage;
