import React, { useState } from 'react';
import { 
  Calendar, 
  Check, 
  Copy, 
  Download, 
  ExternalLink, 
  Sparkles, 
  ToggleLeft, 
  ToggleRight,
  Info
} from 'lucide-react';

interface CalendarSyncPanelProps {
  opportunities: any[];
}

export default function CalendarSyncPanel({ opportunities }: CalendarSyncPanelProps) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [syncSolo, setSyncSolo] = useState(true);
  const [syncSquad, setSyncSquad] = useState(true);
  const [reminderAdvance, setReminderAdvance] = useState('3'); // days
  const [copiedFeed, setCopiedFeed] = useState(false);

  // Filters opportunities based on user preferences
  const getFilteredOps = () => {
    return opportunities.filter(op => {
      if (op.isPublic) return syncSquad;
      return syncSolo;
    });
  };

  // Generate and download a standard .ics calendar file
  const handleExportICS = () => {
    const filtered = getFilteredOps();
    if (filtered.length === 0) {
      alert('No opportunities match your sync filters to export.');
      return;
    }

    let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//KaLi//Opportunity Tracker//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n";
    
    filtered.forEach(op => {
      // Formats: 2026-07-20 -> 20260720
      const dateStr = op.deadline ? op.deadline.replace(/-/g, "") : "";
      if (!dateStr) return;

      icsContent += "BEGIN:VEVENT\r\n";
      icsContent += `UID:kali_op_${op.id}@kali.app\r\n`;
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z\r\n`;
      icsContent += `DTSTART;VALUE=DATE:${dateStr}\r\n`;
      icsContent += `DTEND;VALUE=DATE:${dateStr}\r\n`;
      icsContent += `SUMMARY:Deadline: ${op.title} [${op.organisation}]\r\n`;
      
      const cleanNotes = op.notes ? op.notes.replace(/\n/g, "\\n") : "No notes.";
      const link = op.applicationLink || "None";
      icsContent += `DESCRIPTION:Category: ${op.category}\\nStage: ${op.status}\\nApplication Link: ${link}\\nReminder: ${reminderAdvance} days in advance\\nNotes: ${cleanNotes}\r\n`;
      
      // Add VALARM
      const advanceDays = parseInt(reminderAdvance, 10) || 3;
      icsContent += "BEGIN:VALARM\r\n";
      icsContent += "ACTION:DISPLAY\r\n";
      icsContent += `DESCRIPTION:Reminder: ${op.title} deadline in ${advanceDays} days!\r\n`;
      icsContent += `TRIGGER:-P${advanceDays}D\r\n`;
      icsContent += "END:VALARM\r\n";
      
      icsContent += "END:VEVENT\r\n";
    });

    icsContent += "END:VCALENDAR\r\n";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kali_deadlines_${new Date().toISOString().split('T')[0]}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copySubscriptionLink = () => {
    const queryParams = `solo=${syncSolo}&squad=${syncSquad}&remind=${reminderAdvance}`;
    const subscriptionUrl = `webcal://${window.location.host}/api/calendar/feed?${queryParams}`;
    navigator.clipboard.writeText(subscriptionUrl);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2500);
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-kali-cream-200 shadow-xs space-y-6 text-left">
      <div>
        <span className="text-[10px] uppercase font-mono tracking-widest text-kali-rose-500 font-semibold bg-kali-rose-50 px-2.5 py-1 rounded-md border border-kali-rose-100">Workflow Sync</span>
        <h3 className="font-serif text-xl text-gray-900 mt-2">Calendar Integration</h3>
        <p className="text-xs text-gray-500 mt-0.5">Keep track of your deadlines in your daily workspace.</p>
      </div>

      {/* Sync Preferences */}
      <div className="space-y-4 pt-2 border-t border-kali-cream-100">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">1. Sync Preferences</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-xl border border-kali-cream-100 bg-kali-cream-50/20">
            <div>
              <span className="text-xs font-semibold text-gray-800 block">Personal (Solo) Deadlines</span>
              <span className="text-[10px] text-gray-400">Sync confidential trackings</span>
            </div>
            <button
              onClick={() => setSyncSolo(!syncSolo)}
              className="text-kali-rose-500 cursor-pointer transition-colors"
            >
              {syncSolo ? <ToggleRight className="w-8 h-8 text-kali-rose-500" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-kali-cream-100 bg-kali-cream-50/20">
            <div>
              <span className="text-xs font-semibold text-gray-800 block">Squad Deadlines</span>
              <span className="text-[10px] text-gray-400">Sync collective/shared goals</span>
            </div>
            <button
              onClick={() => setSyncSquad(!syncSquad)}
              className="text-kali-rose-500 cursor-pointer transition-colors"
            >
              {syncSquad ? <ToggleRight className="w-8 h-8 text-kali-sage-500" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-600 block">Reminder Window</label>
          <select
            value={reminderAdvance}
            onChange={(e) => setReminderAdvance(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-kali-cream-200 bg-white text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-kali-rose-500/30"
          >
            <option value="1">1 day in advance</option>
            <option value="3">3 days in advance (Recommended)</option>
            <option value="5">5 days in advance</option>
            <option value="7">1 week in advance</option>
          </select>
        </div>
      </div>

      {/* Cloud Calendar Providers */}
      <div className="space-y-3 pt-4 border-t border-kali-cream-100">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">2. External Calendar Connect</h4>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Google Calendar */}
          <button
            onClick={() => setGoogleConnected(!googleConnected)}
            className={`flex-1 flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
              googleConnected 
                ? 'border-kali-rose-200 bg-kali-rose-50/30 text-gray-900' 
                : 'border-kali-cream-200 hover:bg-kali-cream-50/50 text-gray-600'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold">Google Calendar</span>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${googleConnected ? 'bg-kali-rose-500 text-white shadow-xs' : 'bg-kali-cream-100 text-gray-500'}`}>
              {googleConnected ? 'Connected' : 'Connect'}
            </span>
          </button>

          {/* Outlook Calendar */}
          <button
            onClick={() => setOutlookConnected(!outlookConnected)}
            className={`flex-1 flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
              outlookConnected 
                ? 'border-kali-sage-200 bg-kali-sage-50/30 text-gray-900' 
                : 'border-kali-cream-200 hover:bg-kali-cream-50/50 text-gray-600'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold">Outlook Calendar</span>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${outlookConnected ? 'bg-kali-sage-500 text-white shadow-xs' : 'bg-kali-cream-100 text-gray-500'}`}>
              {outlookConnected ? 'Connected' : 'Connect'}
            </span>
          </button>
        </div>
      </div>

      {/* Manual Export & Subscription Feed */}
      <div className="space-y-3 pt-4 border-t border-kali-cream-100 bg-kali-cream-50/25 p-4 rounded-2xl border border-kali-cream-200/50">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-kali-rose-500" />
          Live Calendar Feed & Subscription
        </h4>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Subscribe to your personalized calendar feed in Google Calendar or Outlook to keep deadlines synchronized automatically. Alternatively, export an `.ics` file below.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
          <button
            onClick={copySubscriptionLink}
            className="flex-1 px-4 py-2.5 bg-[#1e1e1d] hover:bg-[#313130] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            {copiedFeed ? (
              <>
                <Check className="w-3.5 h-3.5 text-kali-rose-200" /> Copied Feed Link!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Calendar Feed
              </>
            )}
          </button>

          <button
            onClick={handleExportICS}
            className="flex-1 px-4 py-2.5 bg-white border border-kali-cream-200 hover:bg-kali-cream-50 text-gray-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            Export Static .ics File
          </button>
        </div>
      </div>
    </div>
  );
}
