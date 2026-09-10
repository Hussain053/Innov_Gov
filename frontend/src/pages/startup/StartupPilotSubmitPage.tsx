import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  ArrowLeft,
  CheckCircle2,
  FileText,
  FileCheck2,
  Paperclip,
  Sparkles,
  AlertCircle,
  Link2,
} from 'lucide-react';
import pilotService from '../../services/pilotService';
import submissionService from '../../services/submissionService';
import { useToast } from '../../context/ToastContext';

export const StartupPilotSubmitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const pilotId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: pilot } = useQuery({
    queryKey: ['pilot', pilotId],
    queryFn: () => pilotService.getPilot(pilotId),
    enabled: !!pilotId,
  });

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['pilot-submissions', pilotId],
    queryFn: () => submissionService.listSubmissions({ pilot_id: pilotId }),
    enabled: !!pilotId,
  });

  const existingSubmission = submissions?.[0];

  const [resultsText, setResultsText] = useState('');
  const [kpiResultsStr, setKpiResultsStr] = useState('');
  const [evidenceStr, setEvidenceStr] = useState('');
  const [mockFileName, setMockFileName] = useState('field_telemetry_dataset_90days.csv');

  useEffect(() => {
    if (existingSubmission) {
      setResultsText(existingSubmission.results || '');
      setKpiResultsStr(
        existingSubmission.kpi_results
          ? JSON.stringify(existingSubmission.kpi_results, null, 2)
          : '{\n  "efficiency": "93.4%",\n  "uptime": "99.92%",\n  "failure_rate": "0.02%"\n}'
      );
      setEvidenceStr(
        existingSubmission.evidence
          ? JSON.stringify(existingSubmission.evidence, null, 2)
          : '{\n  "scada_log_url": "https://solartech.io/telemetry/pilot-04.log",\n  "audit_report": "https://solartech.io/reports/third-party-audit.pdf",\n  "photo_proof": "https://solartech.io/evidence/installation-facility-4.jpg"\n}'
      );
    } else {
      setResultsText(
        'Successfully completed 90-day micro-grid pilot at Municipal Facility #4. Peak inverter efficiency exceeded 93% with zero unscheduled downtime across the entire observation window.'
      );
      setKpiResultsStr(
        '{\n  "efficiency": "93.4%",\n  "uptime": "99.92%",\n  "peak_capacity_kw": 52.4,\n  "grid_loss_reduction": "28%"\n}'
      );
      setEvidenceStr(
        '{\n  "scada_log_url": "https://solartech.io/telemetry/pilot-04.log",\n  "audit_report": "https://solartech.io/reports/third-party-audit.pdf",\n  "hardware_serial": "ST-INV-2026-X99",\n  "facility_endorsement": "https://solartech.io/evidence/superintendent-signoff.pdf"\n}'
      );
    }
  }, [existingSubmission]);

  const saveAndSubmitMutation = useMutation({
    mutationFn: async () => {
      let parsedKpi: any = null;
      let parsedEvidence: any = null;

      try {
        if (kpiResultsStr.trim()) parsedKpi = JSON.parse(kpiResultsStr);
      } catch {
        throw new Error('Invalid KPI Results JSON format');
      }

      try {
        if (evidenceStr.trim()) parsedEvidence = JSON.parse(evidenceStr);
      } catch {
        throw new Error('Invalid Evidence JSON format');
      }

      let subId = existingSubmission?.id;

      if (!subId) {
        // Create draft submission first
        const created = await submissionService.createSubmission({
          pilot_id: pilotId,
          results: resultsText,
          kpi_results: parsedKpi,
          evidence: parsedEvidence,
        });
        subId = created.id;
      } else if (existingSubmission && existingSubmission.status === 'DRAFT') {
        // Update draft submission
        await submissionService.updateSubmission(subId, {
          results: resultsText,
          kpi_results: parsedKpi,
          evidence: parsedEvidence,
        });
      }

      // Transition to SUBMITTED
      return await submissionService.submitSubmission(subId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot-submissions', pilotId] });
      queryClient.invalidateQueries({ queryKey: ['my-pilots'] });
      queryClient.invalidateQueries({ queryKey: ['startup-dashboard'] });
      success('Pilot evidence submitted successfully', 'Your submission is now waiting for evaluator review.');
      navigate('/startup/submissions');
    },
    onError: (err: any) => {
      error('Submission failed', err.message || err.response?.data?.detail || 'An error occurred during submission');
    },
  });

  const isAlreadySubmitted = existingSubmission && existingSubmission.status !== 'DRAFT';

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/startup/pilots/${pilotId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-navy"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pilot #{pilotId}
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gov-navy">Pilot Evidence & KPI Submission</h1>
            <p className="text-xs text-slate-500">
              Submit empirical telemetry, field validation benchmarks, and verifiable audit evidence.
            </p>
          </div>
        </div>

        {isAlreadySubmitted && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-gov-blue">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>
              This pilot submission is already in <strong>{existingSubmission.status}</strong> status and cannot be edited.
            </span>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveAndSubmitMutation.mutate();
        }}
        className="space-y-6"
      >
        {/* Results Narrative */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-gov-blue" />
            Detailed Pilot Results & Deliverables Summary
          </h3>
          <p className="text-xs text-slate-500">
            Explain outcomes against the pilot's success criteria and task description.
          </p>
          <textarea
            rows={4}
            required
            disabled={isAlreadySubmitted}
            value={resultsText}
            onChange={(e) => setResultsText(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none leading-relaxed disabled:bg-slate-50"
          />
        </div>

        {/* KPI Results JSON */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Measured KPI Benchmark Results (JSON)
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Evaluator Scored
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Recorded performance benchmarks that will be scored by the appointed evaluation panel.
          </p>
          <textarea
            rows={5}
            required
            disabled={isAlreadySubmitted}
            value={kpiResultsStr}
            onChange={(e) => setKpiResultsStr(e.target.value)}
            className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none bg-slate-900 text-emerald-400 disabled:opacity-80"
          />
        </div>

        {/* Evidence & Telemetry Links */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4 text-purple-600" />
              Structured Evidence & Telemetry Logs (JSON)
            </h3>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              Verification Proof
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Provide URLs to verified telemetry logs, cloud telemetry endpoints, or independent test lab certifications.
          </p>
          <textarea
            rows={5}
            required
            disabled={isAlreadySubmitted}
            value={evidenceStr}
            onChange={(e) => setEvidenceStr(e.target.value)}
            className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-blue outline-none bg-slate-900 text-blue-300 disabled:opacity-80"
          />

          {/* Prototype File Attachment UI Representation */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                  <Paperclip className="w-4 h-4 text-gov-blue" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{mockFileName}</p>
                  <p className="text-[11px] text-slate-500">14.2 MB • SHA-256 Telemetry Hash Verified</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Attached
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              * Prototype representation compatible with existing evidence schema. Ready for future S3/Supabase binary bucket integration.
            </p>
          </div>
        </div>

        {/* Submit Actions */}
        {!isAlreadySubmitted && (
          <div className="flex items-center justify-end gap-3">
            <Link
              to={`/startup/pilots/${pilotId}`}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saveAndSubmitMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {saveAndSubmitMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> Finalize & Submit Evidence
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default StartupPilotSubmitPage;
