import React, { useState } from 'react';
import { Opportunity } from '../types.ts';
import { Kanban, List, Calendar, Link, FileText, Globe, EyeOff, Edit3, Trash2, Search, ArrowRight, ArrowLeft } from 'lucide-react';

interface KanbanBoardProps {
  opportunities: Opportunity[];
  onEdit: (opp: Opportunity) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, newStatus: string) => Promise<void>;
  cardTreatment?: string;
}

const COLUMNS = [
  'Manifesting',
  'Waiting Room',
  'Ready to Apply',
  'In Progress',
  'Submitted',
  'Interviewing',
  'Secured',
  'Next Time'
];

const CATEGORY_COLORS: { [key: string]: string } = {
  Job: 'bg-[#e4ece3] text-[#425d46] border-[#c4dbc7]', // sage
  Grant: 'bg-[#fbe6de] text-[#a65645] border-[#f2ccc0]', // blush
  Scholarship: 'bg-amber-50 text-amber-700 border-amber-200', // gold
  Fellowship: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Event: 'bg-purple-50 text-purple-700 border-purple-200',
  Other: 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function KanbanBoard({
  opportunities,
  onEdit,
  onDelete,
  onStatusChange,
  cardTreatment = 'classic'
}: KanbanBoardProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [draggingId, setDraggingId] = useState<number | null>(null);

  // Dynamic visual classes generators
  const getHeaderClass = () => {
    switch (cardTreatment) {
      case 'elevated':
        return 'flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-5 rounded-2xl border border-kali-cream-100 shadow-md';
      case 'brutalist':
        return 'flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-none border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
      case 'glass':
        return 'flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white/40 backdrop-blur-lg p-4 rounded-2xl border border-white/20 shadow-xs';
      case 'classic':
      default:
        return 'flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-kali-cream-200 shadow-xs';
    }
  };

  const getColumnClass = (colName: string) => {
    const isDragging = draggingId !== null;
    switch (cardTreatment) {
      case 'elevated':
        return `flex-1 min-w-[260px] bg-kali-cream-50/50 rounded-2xl p-3.5 border transition-all flex flex-col min-h-[60vh] ${
          isDragging ? 'border-dashed border-kali-rose-300 bg-kali-rose-50/20' : 'border-kali-cream-100'
        }`;
      case 'brutalist':
        return `flex-1 min-w-[260px] bg-[#FDF8F5] border-2 border-gray-900 rounded-none p-4 transition-all flex flex-col min-h-[60vh] ${
          isDragging ? 'bg-amber-50/40 border-dashed' : ''
        }`;
      case 'glass':
        return `flex-1 min-w-[260px] bg-white/20 backdrop-blur-md border rounded-2xl p-3 transition-all flex flex-col min-h-[60vh] ${
          isDragging ? 'border-dashed border-white/60 bg-white/30' : 'border-white/10'
        }`;
      case 'classic':
      default:
        return `flex-1 min-w-[260px] bg-kali-cream-100/40 rounded-2xl p-3 border transition-colors flex flex-col min-h-[60vh] ${
          isDragging ? 'border-dashed border-kali-rose-200 bg-kali-rose-50/10' : 'border-kali-cream-200'
        }`;
    }
  };

  const getCardClass = () => {
    switch (cardTreatment) {
      case 'elevated':
        return 'bg-white p-4 rounded-2xl border border-kali-cream-100 shadow-md hover:shadow-xl hover:-translate-y-0.5 duration-300 transition-all cursor-grab active:cursor-grabbing space-y-3 relative group';
      case 'brutalist':
        return 'bg-white p-4 rounded-none border-2 border-gray-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 duration-150 transition-all cursor-grab active:cursor-grabbing space-y-3 relative group';
      case 'glass':
        return 'bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-xs hover:bg-white/95 duration-300 transition-all cursor-grab active:cursor-grabbing space-y-3 relative group';
      case 'classic':
      default:
        return 'bg-white p-4 rounded-xl border border-kali-cream-200 hover:border-kali-rose-200 shadow-xs hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing space-y-3 relative group';
    }
  };

  const getTableClass = () => {
    switch (cardTreatment) {
      case 'elevated':
        return 'bg-white rounded-2xl border border-kali-cream-100 shadow-md overflow-hidden';
      case 'brutalist':
        return 'bg-white border-2 border-gray-900 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden';
      case 'glass':
        return 'bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-xs overflow-hidden';
      case 'classic':
      default:
        return 'bg-white rounded-2xl border border-kali-cream-200 shadow-xs overflow-hidden';
    }
  };

  // Filter opportunities
  const filteredOpps = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          opp.organisation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (opp.notes && opp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter ? opp.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  // Calculate days remaining helper
  const getDeadlineBadge = (deadlineStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadlineStr);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', className: 'bg-red-50 text-red-600 border border-red-100' };
    } else if (diffDays === 0) {
      return { text: 'Due Today ⚠️', className: 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse font-semibold' };
    } else if (diffDays === 1) {
      return { text: 'Due Tomorrow', className: 'bg-amber-50 text-amber-700 border border-amber-200' };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} days left`, className: 'bg-orange-50 text-orange-700 border border-orange-100' };
    } else {
      return { text: `${diffDays} days left`, className: 'bg-gray-50 text-gray-500 border border-gray-100' };
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', String(id));
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain');
    const id = parseInt(idStr, 10);
    if (!isNaN(id)) {
      await onStatusChange(id, targetStatus);
    }
    setDraggingId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      
      {/* Control bar */}
      <div className={getHeaderClass()}>
        
        {/* Left Side: Search and filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunity, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl border border-kali-cream-200 focus:outline-none focus:ring-2 focus:ring-kali-rose-500/20 text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-kali-cream-200 bg-white text-sm focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="Job">Job</option>
            <option value="Grant">Grant</option>
            <option value="Scholarship">Scholarship</option>
            <option value="Fellowship">Fellowship</option>
            <option value="Event">Event</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Right Side: View Toggles */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between sm:justify-end">
          <div className="text-xs text-gray-400 font-mono">
            {filteredOpps.length} tracked
          </div>
          <div className="flex bg-kali-cream-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'kanban' ? 'bg-white text-kali-rose-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-kali-rose-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List View</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Board Area */}
      {viewMode === 'kanban' ? (
        
        /* ------------------ KANBAN BOARD ------------------ */
        <div className="overflow-x-auto pb-4 -mx-6 px-6">
          <div className="flex gap-4 min-w-[1400px]">
            {COLUMNS.map((colName) => {
              const columnOpps = filteredOpps.filter(o => o.status === colName);
              
              return (
                <div
                  key={colName}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, colName)}
                  className={getColumnClass(colName)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-semibold text-gray-700 tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-kali-rose-500"></span>
                      {colName}
                    </span>
                    <span className="text-[10px] font-semibold font-mono bg-white text-gray-500 px-2 py-0.5 rounded-full border border-kali-cream-200">
                      {columnOpps.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[60vh] pr-1">
                    {columnOpps.length === 0 ? (
                      <div className="h-full flex items-center justify-center border border-dashed border-kali-cream-200 rounded-xl p-4 text-center">
                        <span className="text-[10px] text-gray-400 italic">Drag opportunities here</span>
                      </div>
                    ) : (
                      columnOpps.map((opp) => {
                        const dl = getDeadlineBadge(opp.deadline);
                        return (
                          <div
                            key={opp.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, opp.id)}
                            className={getCardClass()}
                          >
                            
                            {/* Card Top: Category badge and squad toggle */}
                            <div className="flex justify-between items-center">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${CATEGORY_COLORS[opp.category] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {opp.category}
                              </span>
                              <div className="flex gap-1">
                                {opp.isPublic ? (
                                  <Globe className="w-3.5 h-3.5 text-kali-sage-500" title="Shared with Squad" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5 text-gray-400" title="Private Solo Space" />
                                )}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-1">
                              <h4 className="font-serif text-sm font-semibold text-gray-900 group-hover:text-kali-rose-600 transition-colors line-clamp-2">
                                {opp.title}
                              </h4>
                              <p className="text-xs text-gray-500">{opp.organisation}</p>
                            </div>

                            {/* Deadline Display */}
                            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-kali-cream-100">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-400 inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {opp.deadline}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] ${dl.className}`}>
                                  {dl.text}
                                </span>
                              </div>
                              
                              {/* Open Info */}
                              {!opp.isAppOpen && opp.dateOpens && (
                                <div className="p-1.5 bg-amber-50 rounded-md border border-amber-100 text-[9px] text-amber-700">
                                  Opens: {opp.dateOpens}
                                </div>
                              )}
                            </div>

                            {/* Hover Actions */}
                            <div className="flex justify-end gap-1.5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {opp.applicationLink && (
                                <a
                                  href={
                                    opp.applicationLink.includes('://') || opp.applicationLink.startsWith('mailto:')
                                      ? opp.applicationLink
                                      : `https://${opp.applicationLink}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md hover:bg-kali-rose-50 text-kali-rose-500 transition-colors"
                                  title="Visit application link"
                                >
                                  <Link className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => onEdit(opp)}
                                className="p-1 rounded-md hover:bg-kali-rose-50 text-gray-500 hover:text-gray-900 transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDelete(opp.id)}
                                className="p-1 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Manual column movement buttons for mobile */}
                            <div className="flex justify-between sm:hidden pt-2 border-t border-gray-100 text-[10px]">
                              <button
                                disabled={COLUMNS.indexOf(colName) === 0}
                                onClick={() => onStatusChange(opp.id, COLUMNS[COLUMNS.indexOf(colName) - 1])}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 inline-flex items-center"
                              >
                                <ArrowLeft className="w-3 h-3 mr-0.5" /> Prev
                              </button>
                              <button
                                disabled={COLUMNS.indexOf(colName) === COLUMNS.length - 1}
                                onClick={() => onStatusChange(opp.id, COLUMNS[COLUMNS.indexOf(colName) + 1])}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 inline-flex items-center"
                              >
                                Next <ArrowRight className="w-3 h-3 ml-0.5" />
                              </button>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        
        /* ------------------ LIST VIEW ------------------ */
        <div className={getTableClass()}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-kali-cream-200 bg-kali-cream-100/30 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Opportunity</th>
                  <th className="py-4 px-6">Organisation</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Stage</th>
                  <th className="py-4 px-6">Deadline</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kali-cream-100 text-sm">
                {filteredOpps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 italic">No opportunities found match search parameters.</td>
                  </tr>
                ) : (
                  filteredOpps.map((opp) => {
                    const dl = getDeadlineBadge(opp.deadline);
                    return (
                      <tr key={opp.id} className="hover:bg-kali-cream-50/40 transition-colors">
                        {/* Title */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {opp.isPublic ? (
                              <Globe className="w-3.5 h-3.5 text-kali-sage-500" title="Shared with Squad" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-gray-400" title="Solo Private" />
                            )}
                            {opp.title}
                          </div>
                          {opp.notes && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic max-w-sm">"{opp.notes}"</p>
                          )}
                        </td>

                        {/* Organisation */}
                        <td className="py-4 px-6 text-gray-600">
                          {opp.organisation}
                        </td>

                        {/* Category */}
                        <td className="py-4 px-6">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${CATEGORY_COLORS[opp.category] || 'bg-gray-100 text-gray-700'}`}>
                            {opp.category}
                          </span>
                        </td>

                        {/* Status / Stage */}
                        <td className="py-4 px-6">
                          <select
                            value={opp.status}
                            onChange={(e) => onStatusChange(opp.id, e.target.value)}
                            className="bg-kali-cream-50 text-gray-700 text-xs px-2.5 py-1.5 rounded-lg border border-kali-cream-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-kali-rose-500"
                          >
                            {COLUMNS.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </td>

                        {/* Deadline */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {opp.deadline}
                            </span>
                            <span className={`w-fit px-2 py-0.5 rounded-full text-[9px] ${dl.className}`}>
                              {dl.text}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            {opp.applicationLink && (
                              <a
                                href={
                                  opp.applicationLink.includes('://') || opp.applicationLink.startsWith('mailto:')
                                    ? opp.applicationLink
                                    : `https://${opp.applicationLink}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg hover:bg-kali-rose-50 text-kali-rose-500 transition-colors"
                                title="Apply"
                              >
                                <Link className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => onEdit(opp)}
                              className="p-2 rounded-lg hover:bg-kali-rose-50 text-gray-500 hover:text-gray-900 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(opp.id)}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
