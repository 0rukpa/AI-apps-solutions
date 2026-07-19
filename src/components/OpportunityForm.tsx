import React, { useState, useEffect } from 'react';
import { Squad } from '../types.ts';
import { X, Calendar, Link, FileText, Check, Globe, EyeOff, Loader2, Save, Sparkles, Trash2 } from 'lucide-react';

interface OpportunityFormProps {
  squads: Squad[];
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

interface OpportunityTemplate {
  id: string;
  name: string;
  category: string;
  status: string;
  notes: string;
  applicationLinkPlaceholder: string;
  isCustom?: boolean;
}

const DEFAULT_TEMPLATES: OpportunityTemplate[] = [
  {
    id: 'job_app',
    name: 'Job Application (Default)',
    category: 'Job',
    status: 'In Progress',
    notes: '• Target resume tailored to key job descriptions\n• Custom Cover Letter prepared highlighting key achievements\n• Preparation Checklist:\n  [ ] Study company website and values\n  [ ] Review recent industry news\n  [ ] Connect with current team members on LinkedIn',
    applicationLinkPlaceholder: 'https://careers.company.com/apply'
  },
  {
    id: 'scholarship',
    name: 'Scholarship (Default)',
    category: 'Scholarship',
    status: 'Ready to Apply',
    notes: '• Personal Statement polished and peer-reviewed\n• Letter of Recommendation requests sent\n• Preparation Checklist:\n  [ ] Order official transcript\n  [ ] Compile financial aid worksheets if requested',
    applicationLinkPlaceholder: 'https://university.edu/scholarships'
  },
  {
    id: 'grant_funding',
    name: 'Grant or Funding (Default)',
    category: 'Grant',
    status: 'Manifesting',
    notes: '• Clear project roadmap defined\n• Fully itemized budget sheet prepared\n• Preparation Checklist:\n  [ ] Double-check funding alignment guidelines\n  [ ] Finalize pitch deck presentation',
    applicationLinkPlaceholder: 'https://grants.org/apply'
  },
  {
    id: 'fellowship',
    name: 'Fellowship (Default)',
    category: 'Fellowship',
    status: 'Manifesting',
    notes: '• Comprehensive research abstract written\n• Advisor/Mentor signature secured\n• Preparation Checklist:\n  [ ] Gather references and publication files\n  [ ] Check award duration and travel guidelines',
    applicationLinkPlaceholder: 'https://fellowships.org'
  }
];

export default function OpportunityForm({
  squads,
  initialData,
  onSubmit,
  onCancel,
  isSaving
}: OpportunityFormProps) {
  const [title, setTitle] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [category, setCategory] = useState('Job');
  const [deadline, setDeadline] = useState('');
  const [applicationLink, setApplicationLink] = useState('');
  const [status, setStatus] = useState('Manifesting');
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isAppOpen, setIsAppOpen] = useState(true);
  const [dateOpens, setDateOpens] = useState('');
  const [squadId, setSquadId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Custom templates states
  const [customTemplates, setCustomTemplates] = useState<OpportunityTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [saveAsTemplateName, setSaveAsTemplateName] = useState('');
  const [showSaveTemplateForm, setShowSaveTemplateForm] = useState(false);
  const [templateSaveSuccess, setTemplateSaveSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kali_custom_templates');
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse templates', e);
      }
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setOrganisation(initialData.organisation || '');
      setCategory(initialData.category || 'Job');
      setDeadline(initialData.deadline || '');
      setApplicationLink(initialData.applicationLink || '');
      setStatus(initialData.status || 'Manifesting');
      setNotes(initialData.notes || '');
      setIsPublic(initialData.isPublic || false);
      setIsAppOpen(initialData.isAppOpen !== undefined ? initialData.isAppOpen : true);
      setDateOpens(initialData.dateOpens || '');
      setSquadId(initialData.squadId ? String(initialData.squadId) : '');
    }
  }, [initialData]);

  const templatesList = [...DEFAULT_TEMPLATES, ...customTemplates];

  const handleApplyTemplate = (id: string) => {
    setSelectedTemplateId(id);
    if (!id) return;
    const template = templatesList.find(t => t.id === id);
    if (template) {
      setCategory(template.category);
      setStatus(template.status);
      setNotes(template.notes);
      setApplicationLink(template.applicationLinkPlaceholder);
      setIsAppOpen(template.status !== 'Waiting Room');
    }
  };

  const handleSaveAsTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!saveAsTemplateName.trim()) return;

    const newTemplate: OpportunityTemplate = {
      id: 'custom_' + Date.now(),
      name: saveAsTemplateName.trim(),
      category,
      status,
      notes,
      applicationLinkPlaceholder: applicationLink,
      isCustom: true
    };

    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem('kali_custom_templates', JSON.stringify(updated));
    setSaveAsTemplateName('');
    setShowSaveTemplateForm(false);
    setTemplateSaveSuccess(true);
    setTimeout(() => setTemplateSaveSuccess(false), 3000);
  };

  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem('kali_custom_templates', JSON.stringify(updated));
    if (selectedTemplateId === id) {
      setSelectedTemplateId('');
    }
  };

  // Handle application open toggle
  const handleAppOpenToggle = (val: boolean) => {
    setIsAppOpen(val);
    if (!val) {
      setStatus('Waiting Room');
    } else {
      if (status === 'Waiting Room') {
        setStatus('Ready to Apply');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) return setValidationError('Title is required');
    if (!organisation.trim()) return setValidationError('Organisation is required');
    if (!deadline) return setValidationError('Deadline is required');
    if (!isAppOpen && !dateOpens) {
      return setValidationError('When application is not open, you must provide a "Date Opens"');
    }

    const payload = {
      title: title.trim(),
      organisation: organisation.trim(),
      category,
      deadline,
      applicationLink: applicationLink.trim() || null,
      status: !isAppOpen ? 'Waiting Room' : status,
      notes: notes.trim() || null,
      isPublic,
      isAppOpen,
      dateOpens: !isAppOpen ? dateOpens : null,
      squadId: isPublic && squadId ? parseInt(squadId, 10) : null
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setValidationError(err.message || 'An error occurred while saving.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-kali-cream-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-kali-cream-100 flex justify-between items-center bg-kali-rose-50/50">
          <div>
            <span className="text-xs text-kali-rose-600 uppercase font-mono tracking-widest">🌸 Opportunity Space</span>
            <h2 className="font-serif text-2xl text-gray-900 mt-1">
              {initialData ? 'Update Opportunity' : 'Create New Opportunity'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-kali-rose-100 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {validationError && (
            <div className="p-3.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
              {validationError}
            </div>
          )}

          {/* Template Selection Dropdown */}
          {!initialData && (
            <div className="p-4 bg-kali-rose-50/30 rounded-2xl border border-kali-cream-200 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-kali-rose-500" /> Apply Reusable Template
                </label>
                <span className="text-[10px] text-gray-400">Pre-fill fields instantly</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-kali-cream-200 bg-white text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-kali-rose-500/30"
                >
                  <option value="">-- Apply a Template --</option>
                  {templatesList.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                {selectedTemplateId && templatesList.find(t => t.id === selectedTemplateId)?.isCustom && (
                  <button
                    onClick={(e) => handleDeleteCustomTemplate(selectedTemplateId, e)}
                    className="p-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                    title="Delete custom template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Title */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Opportunity Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Product Designer, Tech-for-Good Grant"
                className="w-full px-4 py-3 rounded-xl border border-kali-cream-200 focus:outline-none focus:ring-2 focus:ring-kali-rose-500/30 focus:border-kali-rose-500 bg-kali-cream-50/30 text-sm"
              />
            </div>

            {/* Organisation */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Organisation *</label>
              <input
                type="text"
                required
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                placeholder="e.g., Google, Female Founders Trust"
                className="w-full px-4 py-3 rounded-xl border border-kali-cream-200 focus:outline-none focus:ring-2 focus:ring-kali-rose-500/30 focus:border-kali-rose-500 bg-kali-cream-50/30 text-sm"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-kali-cream-200 focus:outline-none focus:ring-2 focus:ring-kali-rose-500/30 focus:border-kali-rose-500 bg-white text-sm cursor-pointer"
              >
                <option value="Job">Job</option>
                <option value="Grant">Grant</option>
                <option value="Scholarship">Scholarship</option>
                <option value="Fellowship">Fellowship</option>
                <option value="Event">Event</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Application Link */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider inline-flex items-center gap-1">
                <Link className="w-3 h-3" /> Application Link
              </label>
              <input
                type="text"
                value={applicationLink}
                onChange={(e) => setApplicationLink(e.target.value)}
                placeholder="https://example.com/apply, portal link, or custom reference"
                className="w-full px-4 py-3 rounded-xl border border-kali-cream-200 focus:outline-none focus:ring-2 focus:ring-kali-rose-500/30 focus:border-kali-rose-500 bg-kali-cream-50/30 text-sm"
              />
            </div>

            {/* Is Application Open Toggle */}
            <div className="p-4 rounded-2xl border border-kali-cream-200 bg-kali-rose-50/30 md:col-span-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Is this application currently open?</h4>
                <p className="text-xs text-gray-500 mt-0.5">Toggle off if applications open at a future date.</p>
              </div>
              <div className="flex bg-kali-cream-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleAppOpenToggle(true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${isAppOpen ? 'bg-white text-kali-rose-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Yes, Active
                </button>
                <button
                  type="button"
                  onClick={() => handleAppOpenToggle(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${!isAppOpen ? 'bg-kali-rose-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  No, Coming Soon
                </button>
              </div>
            </div>

            {/* Conditionally Render opens date or standard status selection */}
            {!isAppOpen ? (
              <div className="space-y-1 md:col-span-2 p-4 bg-amber-50/40 border border-amber-200/50 rounded-2xl space-y-3">
                <div className="flex gap-2">
                  <div className="text-kali-rose-500 font-bold">ℹ️</div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    The system will place this opportunity in your <strong className="text-gray-800 font-medium">Waiting Room</strong>. Once the opening date arrives, KaLi will automatically transition it to <strong className="text-gray-800 font-medium">Ready to Apply</strong> and dispatch an email alert!
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Expected Opening Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-amber-600" />
                    <input
                      type="date"
                      required
                      value={dateOpens}
                      onChange={(e) => setDateOpens(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm text-gray-700"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tracking Stage</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Manifesting', 'Ready to Apply', 'In Progress', 'Submitted', 'Interviewing', 'Secured', 'Next Time'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setStatus(col)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${status === col ? 'bg-kali-rose-500 text-white border-kali-rose-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-kali-cream-50'}`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Deadline */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">Application Deadline *</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-kali-cream-200 focus:outline-none focus:ring-2 focus:ring-kali-rose-500/30 focus:border-kali-rose-500 bg-kali-cream-50/30 text-sm text-gray-700"
                />
              </div>
            </div>

            {/* Accountability Visibility Toggle */}
            <div className="p-4 rounded-2xl border border-kali-cream-200 bg-kali-sage-50/30 md:col-span-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1.5">
                  {isPublic ? <Globe className="w-4 h-4 text-kali-sage-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                  Squad Visibility
                </h4>
                <p className="text-xs text-gray-500">Should this opportunity be shared with your Squad for peer accountability?</p>
              </div>
              <div className="flex bg-kali-cream-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${!isPublic ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Solo Private
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  disabled={squads.length === 0}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${isPublic ? 'bg-kali-sage-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Share with Squad
                </button>
              </div>
            </div>

            {/* Select Squad to Share with */}
            {isPublic && (
              <div className="space-y-1 md:col-span-2 p-4 bg-kali-sage-50/40 border border-kali-sage-100 rounded-2xl animate-fade-in space-y-3">
                {squads.length === 0 ? (
                  <p className="text-xs text-red-600">You are not in any Squad yet. Please create or join a Squad first to share opportunities!</p>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-kali-sage-600 uppercase tracking-wider block">Choose Squad *</label>
                    <select
                      value={squadId}
                      required={isPublic}
                      onChange={(e) => setSquadId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-kali-sage-200 focus:outline-none focus:ring-2 focus:ring-kali-sage-500/30 bg-white text-sm cursor-pointer"
                    >
                      <option value="">-- Select Squad --</option>
                      {squads.map((sq) => (
                        <option key={sq.id} value={sq.id}>{sq.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Notes & Aspirations
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What excites you about this role? Notes, preparation checklist, or links go here..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-kali-cream-200 focus:outline-none focus:ring-2 focus:ring-kali-rose-500/30 focus:border-kali-rose-500 bg-kali-cream-50/30 text-sm"
              />
            </div>

            {/* Save Current Values as Reusable Template */}
            <div className="md:col-span-2 p-4 bg-kali-cream-100/50 rounded-2xl border border-kali-cream-200 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-semibold text-gray-800">Save Configuration as Template</h4>
                  <p className="text-[10px] text-gray-500">Save Category, Status, and Notes as a template for future opportunities.</p>
                </div>
                {!showSaveTemplateForm ? (
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateForm(true)}
                    className="px-3 py-1 rounded-lg bg-white border border-kali-cream-200 text-xs font-medium text-gray-700 hover:bg-kali-cream-50 cursor-pointer"
                  >
                    Save Template
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateForm(false)}
                    className="text-xs font-medium text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {templateSaveSuccess && (
                <div className="text-[11px] text-green-600 font-medium flex items-center gap-1">
                  ✓ Template saved successfully and added to your options above!
                </div>
              )}

              {showSaveTemplateForm && (
                <div className="flex gap-2 items-center animate-fade-in">
                  <input
                    type="text"
                    value={saveAsTemplateName}
                    onChange={(e) => setSaveAsTemplateName(e.target.value)}
                    placeholder="e.g., Summer Internships, Seed Grants"
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-kali-cream-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAsTemplate}
                    disabled={!saveAsTemplateName.trim()}
                    className="px-4 py-2 rounded-lg bg-kali-rose-600 hover:bg-kali-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-kali-cream-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-kali-cream-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-kali-rose-600 hover:bg-kali-rose-700 text-white text-sm font-semibold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {initialData ? 'Update Opportunity' : 'Create Opportunity'}
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
