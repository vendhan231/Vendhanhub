
import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiSendInternalMessage, apiFetchAllUsers } from '../../services/api';
import { User, MessageRecipient } from '../../types';
import { THEME } from '../../constants';
import { XMarkIcon, PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[]; // Users available for selection
  onMessageSent: () => void;
  onError: (errorMessage: string) => void;
  initialRecipientId?: MessageRecipient; // Can be userId or 'ALL_USERS'
  initialContent?: string;
  allowRecipientChange?: boolean;
  forceBroadcast?: boolean; // If true, recipient is fixed to 'ALL_USERS'
}

const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onMessageSent,
  onError,
  initialRecipientId = '',
  initialContent = '',
  allowRecipientChange = true,
  forceBroadcast = false,
}) => {
  const [recipientId, setRecipientId] = useState<MessageRecipient>(initialRecipientId);
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Reset form when modal opens or initial props change significantly
    if (isOpen) {
      setRecipientId(forceBroadcast ? 'ALL_USERS' : initialRecipientId || '');
      setContent(initialContent || '');
      onError(''); // Clear previous modal errors
    }
  }, [isOpen, initialRecipientId, initialContent, forceBroadcast, onError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onError(''); // Clear previous errors on new submit attempt

    if (!content.trim()) {
      onError('Message content cannot be empty.');
      return;
    }
    if (!forceBroadcast && recipientId === '') {
      onError('Please select a recipient.');
      return;
    }
    
    setIsLoading(true);
    try {
      await apiSendInternalMessage({
        senderId: currentUser.id,
        recipientId: forceBroadcast ? 'ALL_USERS' : recipientId,
        content: content.trim(),
      });
      onMessageSent();
      onClose(); 
    } catch (err: any) {
      onError(err.message || 'Failed to send message.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const buttonPrimaryClasses = `flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition`;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg my-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-semibold text-${THEME.primary}`}>Compose Message</h3>
          <button onClick={onClose} className={`text-gray-400 hover:text-gray-600`}>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="recipient" className={`block text-sm font-medium text-${THEME.accentText}`}>To:</label>
            {forceBroadcast ? (
                 <input
                    type="text"
                    value="ALL USERS (Broadcast)"
                    readOnly
                    className={`${selectBaseClasses} bg-gray-100 cursor-not-allowed`}
                />
            ) : allowRecipientChange ? (
              <select
                id="recipient"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className={selectBaseClasses}
                required={!forceBroadcast}
              >
                <option value="" disabled>Select a recipient</option>
                {currentUser.role === 'admin' && <option value="ALL_USERS">ALL USERS (Broadcast)</option>}
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            ) : ( // Recipient is fixed but not broadcast (e.g., a reply)
                <input
                    type="text"
                    value={allUsers.find(u => u.id === recipientId)?.email || (recipientId === 'ALL_USERS' ? 'ALL_USERS' : 'Specific User')}
                    readOnly
                    className={`${selectBaseClasses} bg-gray-100 cursor-not-allowed`}
                />
            )}
          </div>
          <div>
            <label htmlFor="messageContent" className={`block text-sm font-medium text-${THEME.accentText}`}>Message:</label>
            <textarea
              id="messageContent"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
              required
              placeholder="Type your message here..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50`}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className={buttonPrimaryClasses}>
              {isLoading ? 'Sending...' : <><PaperAirplaneIcon className="h-5 w-5 mr-2 transform rotate-45" /> Send Message</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeMessageModal;
