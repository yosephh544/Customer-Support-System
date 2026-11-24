import React, { useState, useEffect } from 'react';
import { portalApi } from '../../api/portalApi';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import type { Ticket, TicketMessage } from '../../types';

interface ClientTicketDetailModalProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated: () => void;
}

export const ClientTicketDetailModal: React.FC<ClientTicketDetailModalProps> = ({
  ticketId,
  isOpen,
  onClose,
  onTicketUpdated,
}) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicket(ticketId);
    }
  }, [isOpen, ticketId]);

  const loadTicket = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await portalApi.getTicketById(id);
      setTicket(data);
      setMessages(data.recentMessages || []);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to load ticket information.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !newMessage.trim()) return;

    try {
      setIsSending(true);
      setError(null);
      const createdMsg = await portalApi.addTicketMessage(ticketId, newMessage.trim());
      setMessages((prev) => [...prev, createdMsg]);
      setNewMessage('');
      onTicketUpdated();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to submit reply. Please try again.';
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return <Badge variant="success">{status}</Badge>;
      case 'InProgress':
      case 'PendingClient':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ticket ? `${ticket.ticketNumber}: ${ticket.title}` : 'Ticket Details'}
      size="lg"
    >
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          Loading ticket discussion...
        </div>
      ) : ticket ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Ticket Metadata Bar */}
          <div
            style={{
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>System:</span>
              <strong style={{ color: '#1e293b' }}>{ticket.projectName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Status:</span>
              <div>{getStatusBadge(ticket.status)}</div>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Priority:</span>
              <strong style={{ color: '#1e293b' }}>{ticket.priority}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Warranty Status:</span>
              <strong style={{ color: ticket.isWarrantyCovered ? '#15803d' : '#b45309' }}>
                {ticket.isWarrantyCovered ? '✅ Warranty Active' : '⚠️ Standard Queue'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Created:</span>
              <span style={{ color: '#475569' }}>
                {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Issue Description */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Issue Description
            </h4>
            <p style={{ margin: 0, fontSize: '0.925rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {ticket.description}
            </p>
          </div>

          {/* Resolution Summary (if resolved) */}
          {ticket.resolutionSummary && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '0.5rem', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#065f46' }}>
                🎉 Engineering Resolution Summary
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#047857', whiteSpace: 'pre-wrap' }}>
                {ticket.resolutionSummary}
              </p>
            </div>
          )}

          {/* Conversation Thread */}
          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#1e293b', fontWeight: 600 }}>
              Discussion Thread ({messages.length})
            </h4>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxHeight: '300px',
                overflowY: 'auto',
                padding: '0.5rem 0',
              }}
            >
              {messages.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.875rem' }}>
                  No messages yet. Our support engineering desk will review and reply shortly.
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      background: msg.senderRole === 'ClientPortalUser' ? '#f0fdf4' : '#f8fafc',
                      border: `1px solid ${msg.senderRole === 'ClientPortalUser' ? '#bbf7d0' : '#e2e8f0'}`,
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      alignSelf: msg.senderRole === 'ClientPortalUser' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#0f172a' }}>
                        {msg.senderName || 'Representative'}
                        <span style={{ fontWeight: 400, color: '#64748b', marginLeft: '0.35rem', fontSize: '0.75rem' }}>
                          ({msg.senderRole === 'ClientPortalUser' ? 'Your Team' : 'DAFTECH Support'})
                        </span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reply Form */}
          {ticket.status !== 'Closed' && (
            <form onSubmit={handleSendReply} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type an update or follow-up question..."
                  disabled={isSending}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                  }}
                />
                <Button variant="primary" type="submit" disabled={isSending || !newMessage.trim()}>
                  {isSending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </Modal>
  );
};
