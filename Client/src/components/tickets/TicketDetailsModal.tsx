import React, { useState, useEffect } from 'react';
import { ticketsApi } from '../../api/ticketsApi';
import { usersApi } from '../../api/usersApi';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import type { Ticket, TicketMessage, TicketStatus, UserProfile } from '../../types';

interface TicketDetailsModalProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated: () => void;
}

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({
  ticketId,
  isOpen,
  onClose,
  onTicketUpdated,
}) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [specialists, setSpecialists] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Message posting state
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Status & Assignment updates
  const [newStatus, setNewStatus] = useState<TicketStatus>('New');
  const [newAssignee, setNewAssignee] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicketData(ticketId);
      loadSpecialists();
    }
  }, [isOpen, ticketId]);

  const loadTicketData = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ticketsApi.getTicketById(id);
      setTicket(data);
      setNewStatus(data.status);
      setNewAssignee(data.assignedToUserId || '');
      setResolutionSummary(data.resolutionSummary || '');

      const msgData = await ticketsApi.getMessages(id, true);
      setMessages(msgData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpecialists = async () => {
    try {
      const res = await usersApi.getUsers({ pageSize: 100 });
      setSpecialists(res.items || []);
    } catch {
      // Non-critical
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !newMessage.trim()) return;

    setIsSendingMessage(true);
    setError(null);
    try {
      const posted = await ticketsApi.addMessage(ticketId, newMessage.trim(), isInternalNote);
      setMessages((prev) => [...prev, posted]);
      setNewMessage('');
      setSuccess('Message added to ticket conversation.');
      setTimeout(() => setSuccess(null), 3000);
      onTicketUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to post message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleStatusChange = async (targetStatus: TicketStatus) => {
    if (!ticket) return;
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await ticketsApi.updateTicket(ticket.id, {
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        failureType: ticket.failureType,
        priority: ticket.priority,
        status: targetStatus,
        assignedToUserId: ticket.assignedToUserId,
        resolutionSummary: ticket.resolutionSummary,
      });
      setTicket(updated);
      setNewStatus(targetStatus);
      setSuccess(`Ticket status updated to ${targetStatus}.`);
      setTimeout(() => setSuccess(null), 3000);
      onTicketUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update ticket status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssigneeChange = async (userId: string) => {
    if (!ticket) return;
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await ticketsApi.assignTicket(ticket.id, userId);
      setTicket(updated);
      setNewAssignee(userId);
      setSuccess('Ticket assigned successfully.');
      setTimeout(() => setSuccess(null), 3000);
      onTicketUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to assign ticket.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !resolutionSummary.trim()) {
      setError('Please provide a resolution summary before resolving this ticket.');
      return;
    }
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await ticketsApi.resolveTicket(ticket.id, resolutionSummary.trim());
      setTicket(updated);
      setNewStatus('Resolved');
      setIsResolving(false);
      setSuccess('Ticket marked as resolved.');
      setTimeout(() => setSuccess(null), 3000);
      onTicketUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve ticket.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    if (p === 'Blocker') return <Badge variant="blocker" dot>Blocker</Badge>;
    if (p === 'High') return <Badge variant="danger" dot>High</Badge>;
    if (p === 'Medium') return <Badge variant="warning">Medium</Badge>;
    return <Badge variant="success">Low</Badge>;
  };

  const getStatusBadge = (s: string) => {
    if (s === 'Resolved' || s === 'Closed') return <Badge variant="success" dot>{s}</Badge>;
    if (s === 'InProgress') return <Badge variant="purple" dot>In Progress</Badge>;
    if (s === 'Assigned') return <Badge variant="info">Assigned</Badge>;
    if (s === 'PendingCustomer') return <Badge variant="warning">Pending Customer</Badge>;
    return <Badge variant="neutral">New</Badge>;
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ticket ? `${ticket.ticketNumber}: ${ticket.title}` : 'Ticket Details'}
      size="xl"
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner spinner-lg" />
          <p className="text-muted text-sm mt-2">Loading ticket conversation and SLA telemetry...</p>
        </div>
      ) : ticket ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <Alert variant="danger" message={error} />}
          {success && <Alert variant="success" message={success} />}

          {/* SLA & Status Header Strip */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: ticket.slaBreached ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.06)',
              border: `1px solid ${ticket.slaBreached ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.18)'}`,
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
              <Badge variant="navy">{ticket.categoryName}</Badge>
              <span className="text-xs text-muted">Channel: {ticket.channelName}</span>
            </div>

            {/* Ethiopian Working Hours SLA Gauge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: ticket.slaBreached ? '#ef4444' : '#10b981' }}>
                  {ticket.slaBreached ? '⚠️ SLA BREACHED' : '⏱️ SLA ACTIVE (UTC+3)'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                  Deadline: {new Date(ticket.slaDeadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {' '}({ticket.remainingWorkingHours > 0 ? `${ticket.remainingWorkingHours}h remaining` : 'Breached'})
                </div>
              </div>
              <div
                style={{
                  width: '60px',
                  height: '6px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, ticket.slaConsumedPercent)}%`,
                    backgroundColor: ticket.slaBreached ? '#ef4444' : ticket.slaConsumedPercent > 75 ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Warranty / Out of Scope Billing Banner */}
          {!ticket.isWarrantyCovered && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
              }}
            >
              <div>
                <strong>💳 Out of Warranty Window:</strong> This project's complimentary support period has expired. Standard hourly billing applies:
                <span className="font-semibold text-primary ml-1">{ticket.outOfScopeQuoteETB?.toLocaleString()} ETB / hr</span>.
              </div>
              <Badge variant="purple">{ticket.outOfScopeQuoteApproved ? 'Quote Approved' : 'Quote Pending'}</Badge>
            </div>
          )}

          {/* Proactive Touchpoint Escalation Link */}
          {ticket.escalatedFromFeedbackId && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                fontSize: '0.78rem',
                color: '#b45309',
              }}
            >
              ⚡ <strong>Proactive Escalation Bridge:</strong> This reactive ticket was automatically spawned from a high-severity proactive customer touchpoint visit.
            </div>
          )}

          {/* 2-Column Main Workspace */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px' }}>
            {/* Left Column: Metadata, Scope & Status Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Account Information */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  backgroundColor: 'var(--card-bg, #ffffff)',
                }}
              >
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Customer & Scope</h4>
                <div style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
                  <div><strong>Organization:</strong> {ticket.organizationName}</div>
                  <div><strong>Project:</strong> {ticket.projectName} {ticket.moduleName ? `(${ticket.moduleName})` : ''}</div>
                  {ticket.contactPersonName && (
                    <div style={{ marginTop: '4px' }}>
                      <strong>Contact:</strong> {ticket.contactPersonName}
                      {ticket.contactPersonPhone ? ` · ${ticket.contactPersonPhone}` : ''}
                      {ticket.contactPersonEmail ? ` · ${ticket.contactPersonEmail}` : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Ticket Description */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  backgroundColor: 'var(--card-bg, #ffffff)',
                }}
              >
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Issue Description</h4>
                <div style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', color: 'var(--text-color, #374151)' }}>
                  {ticket.description}
                </div>
              </div>

              {/* Quick Actions & Triage */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  backgroundColor: 'var(--card-bg, #ffffff)',
                }}
              >
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>Triage & Assignment</h4>

                {/* Status Dropdown */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                    Ticket Status
                  </label>
                  <select
                    className="form-input w-full"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px 10px' }}
                    value={newStatus}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    disabled={isUpdating}
                  >
                    <option value="New">New</option>
                    <option value="Assigned">Assigned</option>
                    <option value="InProgress">In Progress</option>
                    <option value="PendingCustomer">Pending Customer</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Specialist Assignment */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                    Assigned Specialist
                  </label>
                  <select
                    className="form-input w-full"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '6px 10px' }}
                    value={newAssignee}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    disabled={isUpdating}
                  >
                    <option value="">-- Unassigned --</option>
                    {specialists.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resolve Trigger */}
                {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                  <div>
                    {!isResolving ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => setIsResolving(true)}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        ✓ Mark as Resolved
                      </Button>
                    ) : (
                      <form onSubmit={handleResolveTicket} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                          className="form-input w-full"
                          placeholder="Provide a concise resolution summary for the client..."
                          rows={3}
                          value={resolutionSummary}
                          onChange={(e) => setResolutionSummary(e.target.value)}
                          style={{ fontSize: '0.8rem', resize: 'vertical' }}
                          required
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsResolving(false)}
                            style={{ flex: 1 }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={isUpdating}
                            style={{ flex: 1 }}
                          >
                            Confirm Resolution
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Interactive Conversation Timeline */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '520px',
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: '8px',
                backgroundColor: 'var(--card-bg, #ffffff)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-color, #e5e7eb)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>Conversation & Internal Notes</h4>
                <span className="text-xs text-muted">{messages.length} messages</span>
              </div>

              {/* Message Feed */}
              <div
                style={{
                  flex: 1,
                  padding: '14px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', margin: 'auto', fontSize: '0.8rem' }}>
                    No messages yet. Post a resolution update or internal team note below.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: m.isInternalNote ? 'rgba(254, 243, 199, 0.45)' : 'rgba(243, 244, 246, 0.7)',
                        border: m.isInternalNote ? '1px solid #fde68a' : '1px solid #e5e7eb',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#1f2937' }}>{m.senderName}</span>
                          <span className="text-xs text-muted">({m.senderRole})</span>
                          {m.isInternalNote && <Badge variant="warning" size="sm">Internal Note</Badge>}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>{m.message}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Box */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '10px 14px',
                  borderTop: '1px solid var(--border-color, #e5e7eb)',
                  backgroundColor: 'var(--input-bg, #f9fafb)',
                }}
              >
                <textarea
                  className="form-input w-full"
                  rows={2}
                  placeholder="Type a customer update or staff internal note..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ width: '100%', fontSize: '0.82rem', resize: 'none', marginBottom: '8px' }}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                    />
                    <span>Lock as Internal Note (Staff Only)</span>
                  </label>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSendingMessage}
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
