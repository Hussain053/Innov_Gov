import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Sparkles,
  Sliders,
  Send,
  MessageSquare,
  Building,
  Target,
  FileText,
} from 'lucide-react';
import submissionService from '../../services/submissionService';
import pilotService from '../../services/pilotService';
import evaluationService, { EvaluationCreateParams } from '../../services/evaluationService';
import { EvaluationRecommendation } from '../../types';
import { useToast } from '../../context/ToastContext';

export const EvaluatorWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const submissionId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: submission, isLoading: subLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionService.getSubmission(submissionId),
    enabled: !!submissionId,
  });

  const { data: pilot } = useQuery({
    queryKey: ['pilot', submission?.pilot_id],
    queryFn: () => pilotService.getPilot(submission!.pilot_id),
    enabled: !!submission?.pilot_id,
  });

  const { data: existingEvaluations } = useQuery({
    queryKey: ['evaluations-submission', submissionId],
    queryFn: () => evaluationService.getEvaluationsBySubmission(submissionId),
    enabled: !!submissionId,
  });

  const myEvaluation = existingEvaluations?.[0];

  // Scoring states (0-100)
  const [technicalScore, setTechnicalScore] = useState<number>(90);
  const [kpiScore, setKpiScore] = useState<number>(92);
  const [innovationScore, setInnovationScore] = useState<number>(88);
  const [feasibilityScore, setFeasibilityScore] = useState<number>(90);
  const [impactScore, setImpactScore] = useState<number>(94);
  const [comments, setComments] = useState(
    'Outstanding technical execution. Empirical telemetry confirms >93% microgrid efficiency and high operational resilience.'
  );
  const [recommendation, setRecommendation] = useState<EvaluationRecommendation>('RECOMMEND');

  useEffect(() => {
    if (myEvaluation) {
      if (myEvaluation.technical_score !== undefined && myEvaluation.technical_score !== null) {
        setTechnicalScore(Number(myEvaluation.technical_score));
      }
      if (myEvaluation.kpi_score !== undefined && myEvaluation.kpi_score !== null) {
        setKpiScore(Number(myEvaluation.kpi_score));
      }
      if (myEvaluation.innovation_score !== undefined && myEvaluation.innovation_score !== null) {
        setInnovationScore(Number(myEvaluation.innovation_score));
      }
      if (myEvaluation.feasibility_score !== undefined && myEvaluation.feasibility_score !== null) {
        setFeasibilityScore(Number(myEvaluation.feasibility_score));
      }
      if (myEvaluation.impact_score !== undefined && myEvaluation.impact_score !== null) {
        setImpactScore(Number(myEvaluation.impact_score));
      }
      if (myEvaluation.comments) setComments(myEvaluation.comments);
      if (myEvaluation.recommendation) setRecommendation(myEvaluation.recommendation);
    }
  }, [myEvaluation]);

  // Dynamically compute overall score
  const overallScore = (
    (technicalScore + kpiScore + innovationScore + feasibilityScore + impactScore) / 5
  ).toFixed(1);

  const isCompleted = myEvaluation?.status === 'COMPLETED';

  const evaluateMutation = useMutation({
    mutationFn: async (data: EvaluationCreateParams) => {
      // 1. Create evaluation (or update if pending)
      let evalObj;
      if (myEvaluation && myEvaluation.status === 'PENDING') {
        evalObj = await evaluationService.updateEvaluation(myEvaluation.id, {
          technical_score: data.technical_score,
          kpi_score: data.kpi_score,
          innovation_score: data.innovation_score,
          feasibility_score: data.feasibility_score,
          impact_score: data.impact_score,
          comments: data.comments,
          recommendation: data.recommendation,
        });
      } else {
        evalObj = await evaluationService.createEvaluation(data);
      }

      // 2. Complete evaluation
      return await evaluationService.completeEvaluation(evalObj.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations-submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['my-evaluator-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['evaluator-dashboard'] });
      success('Evaluation certified & completed', 'Official scorecard recorded and sent to government department.');
      navigate('/evaluator/history');
    },
    onError: (err: any) => {
      error('Evaluation failed', err.response?.data?.detail || 'An error occurred during evaluation');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    evaluateMutation.mutate({
      pilot_submission_id: submissionId,
      technical_score: technicalScore,
      kpi_score: kpiScore,
      innovation_score: innovationScore,
      feasibility_score: feasibilityScore,
      impact_score: impactScore,
      comments,
      recommendation,
    });
  };

  if (subLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading submission deliverables...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/evaluator/assignments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assignments
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-slate-400">SUBMISSION #{submissionId}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {isCompleted ? 'EVALUATION COMPLETED' : 'SCORING IN PROGRESS'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gov-navy">Technical Evaluation Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilot Ref #{submission?.pilot_id} • Startup ID #{submission?.startup_id}
          </p>
        </div>

        {/* Dynamic Overall Score Counter */}
        <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-purple-700 block">Computed Overall Score</span>
            <span className="text-2xl font-black text-purple-900">{overallScore} / 100</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Submission Deliverables Review (Read-only) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-gov-blue" />
          Startup Deliverables & Evidence Log
        </h3>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 mb-1">Results Narrative</h4>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {submission?.results || 'Telemetry dataset and benchmark summary.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-1">Empirical KPI Telemetry (JSON)</h4>
            <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(submission?.kpi_results, null, 2)}</pre>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-1">Audit Evidence & Cloud Logs (JSON)</h4>
            <div className="p-3 rounded-xl bg-slate-900 text-blue-300 font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(submission?.evidence, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Pilot Objectives & Success Criteria (For Evaluator Context) */}
      {pilot && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Original Pilot Sanction Specification
          </h3>
          <p className="text-xs text-slate-700 font-semibold">{pilot.title}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{pilot.task_description}</p>
        </div>
      )}

      {/* Evaluator Multi-Dimension Scoring Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-6">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600" />
            Evaluation Criteria Scoring (0–100 Scale)
          </h3>

          <div className="space-y-5">
            {/* 1. Technical Score */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">1. Technical Excellence & Architectural Soundness</span>
                <span className="font-bold text-purple-700">{technicalScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={isCompleted}
                value={technicalScore}
                onChange={(e) => setTechnicalScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* 2. KPI Score */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">2. KPI Benchmark Achievement & Telemetry Verification</span>
                <span className="font-bold text-purple-700">{kpiScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={isCompleted}
                value={kpiScore}
                onChange={(e) => setKpiScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* 3. Innovation Score */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">3. Technological Innovation & IP Novelty</span>
                <span className="font-bold text-purple-700">{innovationScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={isCompleted}
                value={innovationScore}
                onChange={(e) => setInnovationScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* 4. Feasibility Score */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">4. Operational Feasibility & Deployment Readiness</span>
                <span className="font-bold text-purple-700">{feasibilityScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={isCompleted}
                value={feasibilityScore}
                onChange={(e) => setFeasibilityScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* 5. Public Impact Score */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">5. Public Sector Impact & Socio-Economic Value</span>
                <span className="font-bold text-purple-700">{impactScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                disabled={isCompleted}
                value={impactScore}
                onChange={(e) => setImpactScore(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          {/* Recommendation Selection */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Procurement Recommendation *
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                disabled={isCompleted}
                onClick={() => setRecommendation('RECOMMEND')}
                className={`p-3 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  recommendation === 'RECOMMEND'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                RECOMMEND FOR SCALE
              </button>

              <button
                type="button"
                disabled={isCompleted}
                onClick={() => setRecommendation('DO_NOT_RECOMMEND')}
                className={`p-3 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  recommendation === 'DO_NOT_RECOMMEND'
                    ? 'border-red-500 bg-red-50 text-red-800 ring-2 ring-red-500/20 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <XCircle className="w-4 h-4 text-red-600" />
                DO NOT RECOMMEND
              </button>
            </div>
          </div>

          {/* Qualitative Comments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Evaluator Panel Comments & Notes
            </label>
            <textarea
              rows={3}
              required
              disabled={isCompleted}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide structured qualitative feedback on test performance, reliability, and deployment risk..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none leading-relaxed disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Action Button */}
        {!isCompleted && (
          <div className="flex items-center justify-end gap-3">
            <Link
              to="/evaluator/assignments"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={evaluateMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {evaluateMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Certified Evaluation
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default EvaluatorWorkspacePage;
