import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Target,
  Sparkles,
  FileText,
  Save,
} from 'lucide-react';
import pilotService, { PilotCreateParams } from '../../services/pilotService';
import applicationService from '../../services/applicationService';
import challengeService from '../../services/challengeService';
import { useToast } from '../../context/ToastContext';

export const GovernmentCreatePilotPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const applicationId = parseInt(searchParams.get('application_id') || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: application } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationService.getApplication(applicationId),
    enabled: !!applicationId,
  });

  const { data: challenge } = useQuery({
    queryKey: ['challenge', application?.challenge_id],
    queryFn: () => challengeService.getChallenge(application!.challenge_id),
    enabled: !!application?.challenge_id,
  });

  const [title, setTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [requirementsStr, setRequirementsStr] = useState('');
  const [successCriteriaStr, setSuccessCriteriaStr] = useState('');
  const [kpisStr, setKpisStr] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );

  useEffect(() => {
    if (challenge) {
      setTitle(`${challenge.title} - 90-Day Municipal Field Pilot`);
      setTaskDescription(
        `Execute field trial deployment at selected municipal facilities. Validate operational resiliency, telemetry communication, and achieve target benchmark KPIs.`
      );
      setRequirementsStr(
        challenge.requirements
          ? JSON.stringify(challenge.requirements, null, 2)
          : '{\n  "hardware": "Inverter v3",\n  "capacity": "50kW",\n  "telemetry_protocol": "MQTT/TLS"\n}'
      );
      setSuccessCriteriaStr(
        '{\n  "minimum_uptime": ">=99.9%",\n  "efficiency_threshold": ">=90%",\n  "failover_seconds": "<5"\n}'
      );
      setKpisStr(
        challenge.kpis
          ? JSON.stringify(challenge.kpis, null, 2)
          : '{\n  "efficiency": "90%",\n  "uptime": "99.9%"\n}'
      );
    }
  }, [challenge]);

  const createMutation = useMutation({
    mutationFn: (data: PilotCreateParams) => pilotService.createPilot(data),
    onSuccess: (pilot) => {
      queryClient.invalidateQueries({ queryKey: ['pilots-all'] });
      queryClient.invalidateQueries({ queryKey: ['government-dashboard'] });
      success('Pilot sanctioned', `Pilot #${pilot.id} created successfully and assigned to startup.`);
      navigate(`/government/pilots/${pilot.id}`);
    },
    onError: (err: any) => {
      error('Pilot creation failed', err.response?.data?.detail || 'An error occurred');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) {
      error('Missing application ID', 'Please select a shortlisted application first');
      return;
    }

    let parsedReq: any = null;
    let parsedSuccess: any = null;
    let parsedKpis: any = null;

    try {
      if (requirementsStr.trim()) parsedReq = JSON.parse(requirementsStr);
    } catch {
      error('Invalid Requirements JSON', 'Please verify your JSON syntax');
      return;
    }

    try {
      if (successCriteriaStr.trim()) parsedSuccess = JSON.parse(successCriteriaStr);
    } catch {
      error('Invalid Success Criteria JSON', 'Please verify your JSON syntax');
      return;
    }

    try {
      if (kpisStr.trim()) parsedKpis = JSON.parse(kpisStr);
    } catch {
      error('Invalid KPIs JSON', 'Please verify your JSON syntax');
      return;
    }

    createMutation.mutate({
      application_id: applicationId,
      title,
      task_description: taskDescription,
      requirements: parsedReq,
      success_criteria: parsedSuccess,
      kpis: parsedKpis,
      start_date: startDate,
      end_date: endDate,
      status: 'ASSIGNED',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/government/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-gov-blue flex items-center justify-center font-bold">
            <PlayCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gov-navy">Sanction Pilot Project</h1>
            <p className="text-xs text-slate-500">
              Establish pilot milestones, empirical success criteria, and telemetry specifications for Application #{applicationId}.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Pilot Setup */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-gov-blue" />
            Pilot Objective & Milestones
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilot Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Description & Sandbox Deployment Scope *
            </label>
            <textarea
              rows={4}
              required
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilot Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Completion Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none"
              />
            </div>
          </div>
        </div>

        {/* Requirements, Success Criteria, and KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
            <h3 className="text-xs font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100">
              Deployment Requirements (JSON)
            </h3>
            <textarea
              rows={6}
              value={requirementsStr}
              onChange={(e) => setRequirementsStr(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none bg-slate-900 text-blue-300"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
            <h3 className="text-xs font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100">
              Success Criteria (JSON)
            </h3>
            <textarea
              rows={6}
              value={successCriteriaStr}
              onChange={(e) => setSuccessCriteriaStr(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none bg-slate-900 text-purple-300"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
            <h3 className="text-xs font-bold text-gov-navy uppercase tracking-wider pb-2 border-b border-slate-100">
              Measurable Target KPIs (JSON)
            </h3>
            <textarea
              rows={6}
              value={kpisStr}
              onChange={(e) => setKpisStr(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none bg-slate-900 text-emerald-400"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end gap-3">
          <Link
            to="/government/applications"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gov-blue hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <PlayCircle className="w-4 h-4" /> Sanction & Assign Pilot
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GovernmentCreatePilotPage;
