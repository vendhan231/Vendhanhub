
import React, { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiFetchAllUsers, apiAdminUpdateUser, apiAdminResetPassword, apiDeleteUser } from '../../services/api';
import { User, UserRole, AdminUserUpdateData, ChangePasswordData } from '../../types';
import { THEME } from '../../constants';
import { UserPlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, UserCircleIcon, KeyIcon } from '@heroicons/react/24/outline';
import ImageUpload from '../Common/ImageUpload'; 
import { useAuth } from '../../hooks/useAuth';

const ManageEmployees: React.FC = () => {
  const { user: loggedInAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<AdminUserUpdateData | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(null);


  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await apiFetchAllUsers();
      setUsers(fetchedUsers);
      // setFilteredUsers(fetchedUsers); // This will be handled by useEffect for search
    } catch (err: any) { 
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = users.filter(user =>
      user.firstName.toLowerCase().includes(lowercasedFilter) ||
      user.lastName.toLowerCase().includes(lowercasedFilter) ||
      user.username.toLowerCase().includes(lowercasedFilter) ||
      user.email.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredUsers(filteredData);
  }, [searchTerm, users]);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      department: user.department || '',
      joinDate: user.joinDate || '',
      role: user.role,
      profilePictureUrl: user.profilePictureUrl || null,
    });
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordResetError(null);
    setPasswordResetSuccess(null);
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditFormData(null);
    setEditFormError(null);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [e.target.name]: e.target.value,
      });
    }
  };
  
  const handleEditImageSelected = (base64Image: string | null) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, profilePictureUrl: base64Image });
    }
  };

  const handleEditFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editFormData) return;
    setEditFormError(null);
    setIsSavingUser(true);

    try {
      const updatedUser = await apiAdminUpdateUser(editingUser.id, editFormData);
      setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
      alert("User details updated successfully!");
      // Optionally close modal here if desired, or keep open for password reset
      // For this flow, assume admin might want to do both, so keep open
      // closeEditModal(); 
    } catch (err: any) {
      setEditFormError(err.message || 'Failed to update user details.');
    } finally {
      setIsSavingUser(false);
    }
  };
  
  const handlePasswordResetSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      setPasswordResetError(null);
      setPasswordResetSuccess(null);

      if (newPassword !== confirmNewPassword) {
          setPasswordResetError("New passwords do not match.");
          return;
      }
      if (!newPassword || newPassword.length < 6) {
          setPasswordResetError("Password must be at least 6 characters long.");
          return;
      }
      setIsSavingUser(true); 
      try {
          await apiAdminResetPassword(editingUser.id, newPassword);
          setPasswordResetSuccess("Password reset successfully for user " + editingUser.username);
          setNewPassword(''); // Clear fields after success
          setConfirmNewPassword('');
      } catch (err: any) {
          setPasswordResetError(err.message || "Failed to reset password.");
      } finally {
          setIsSavingUser(false);
      }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!loggedInAdmin) {
        alert("Error: Admin user not identified.");
        return;
    }
    if (userId === loggedInAdmin.id) {
        alert("Admins cannot delete their own account.");
        return;
    }
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        try {
            await apiDeleteUser(userId, loggedInAdmin.id);
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
            alert(`User ${username} deleted successfully.`);
        } catch (err: any) {
            setError(err.message || 'Failed to delete user.');
            alert(`Error: ${err.message || 'Failed to delete user.'}`);
        }
    }
  };


  const UserRow: React.FC<{ user: User }> = ({ user }) => (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-3 px-4 text-sm text-gray-700">
        <div className="flex items-center">
          {user.profilePictureUrl ? (
            <img src={user.profilePictureUrl} alt={`${user.firstName} ${user.lastName}`} className="w-8 h-8 rounded-full object-cover mr-3" />
          ) : (
            <UserCircleIcon className={`w-8 h-8 text-gray-400 mr-3`} />
          )}
          {user.firstName} {user.lastName}
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-700">{user.username}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{user.email}</td>
      <td className="py-3 px-4 text-sm text-gray-700">
        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.ADMIN ? `bg-red-100 text-red-800` : `bg-green-100 text-green-800`}`}>
          {user.role}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-gray-700">{user.department || 'N/A'}</td>
      <td className="py-3 px-4 text-sm text-gray-700 text-right">
        <button 
            onClick={() => openEditModal(user)}
            className={`p-1.5 text-gray-500 hover:text-${THEME.secondary} transition-colors mr-2`}
            title="Edit User"
        >
            <PencilSquareIcon className="h-5 w-5" />
        </button>
        <button 
            onClick={() => handleDeleteUser(user.id, user.username)}
            disabled={user.id === loggedInAdmin?.id}
            className={`p-1.5 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            title={user.id === loggedInAdmin?.id ? "Cannot delete self" : "Delete User"}
        >
            <TrashIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );

  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm placeholder-gray-400`;
  const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;


  if (loading && users.length === 0) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading users...
      </div>
    );
  }

  if (error) {
    return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>Manage Employees</h2>
        <input
            type="text"
            placeholder="Filter by name, username, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputBaseClasses} sm:w-64 w-full`}
        />
        <Link
          to="/register"
          className={`inline-flex items-center px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} w-full sm:w-auto justify-center`}
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add New User
        </Link>
      </div>
      
      {loading && <p className={`text-sm text-${THEME.accentText} my-2`}>Refreshing user list...</p>}
      {filteredUsers.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>{searchTerm ? 'No users match your search.' : 'No users found.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => <UserRow key={user.id} user={user} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold text-${THEME.primary}`}>Edit User: {editingUser.username}</h3>
              <button onClick={closeEditModal} className={`text-gray-400 hover:text-gray-600`}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* User Details Form */}
            <form onSubmit={handleEditFormSubmit} className="space-y-4 max-h-[calc(70vh-100px)] overflow-y-auto pr-2"> {/* Adjusted max-height */}
              <h4 className={`text-md font-semibold text-${THEME.secondary} border-b pb-1 mb-3`}>User Details</h4>
              <div className="text-center mb-4">
                 <ImageUpload 
                    onImageSelected={handleEditImageSelected} 
                    currentImageUrl={editFormData.profilePictureUrl}
                    label="User Profile Picture"
                 />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editFirstName" className={`block text-sm font-medium text-${THEME.accentText}`}>First Name</label>
                  <input type="text" name="firstName" id="editFirstName" value={editFormData.firstName} onChange={handleEditFormChange} className={inputBaseClasses} required />
                </div>
                <div>
                  <label htmlFor="editLastName" className={`block text-sm font-medium text-${THEME.accentText}`}>Last Name</label>
                  <input type="text" name="lastName" id="editLastName" value={editFormData.lastName} onChange={handleEditFormChange} className={inputBaseClasses} required />
                </div>
              </div>
              <div>
                <label htmlFor="editEmail" className={`block text-sm font-medium text-${THEME.accentText}`}>Email</label>
                <input type="email" name="email" id="editEmail" value={editFormData.email} onChange={handleEditFormChange} className={inputBaseClasses} required />
              </div>
              <div>
                <label htmlFor="editPhone" className={`block text-sm font-medium text-${THEME.accentText}`}>Phone</label>
                <input type="tel" name="phone" id="editPhone" value={editFormData.phone || ''} onChange={handleEditFormChange} className={inputBaseClasses} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editDepartment" className={`block text-sm font-medium text-${THEME.accentText}`}>Department</label>
                  <input type="text" name="department" id="editDepartment" value={editFormData.department || ''} onChange={handleEditFormChange} className={inputBaseClasses} />
                </div>
                <div>
                  <label htmlFor="editJoinDate" className={`block text-sm font-medium text-${THEME.accentText}`}>Join Date</label>
                  <input type="date" name="joinDate" id="editJoinDate" value={editFormData.joinDate || ''} onChange={handleEditFormChange} className={inputBaseClasses} />
                </div>
              </div>
              <div>
                <label htmlFor="editRole" className={`block text-sm font-medium text-${THEME.accentText}`}>Role</label>
                <select name="role" id="editRole" value={editFormData.role} onChange={handleEditFormChange} className={selectBaseClasses} required>
                  <option value={UserRole.EMPLOYEE}>Employee</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              
              {editFormError && <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{editFormError}</div>}
              
              <div className="flex justify-end space-x-3 pt-2">
                <button type="submit" disabled={isSavingUser} className={`px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} rounded-md text-sm font-medium hover:bg-opacity-85 disabled:opacity-50`}>
                  {isSavingUser ? 'Saving Details...' : 'Save Details'}
                </button>
              </div>
            </form>

            {/* Password Reset Form */}
            <form onSubmit={handlePasswordResetSubmit} className="space-y-4 mt-6 pt-4 border-t max-h-[calc(70vh-100px)] overflow-y-auto pr-2"> {/* Adjusted max-height */}
                <h4 className={`text-md font-semibold text-${THEME.secondary} border-b pb-1 mb-3 flex items-center`}>
                    <KeyIcon className="h-5 w-5 mr-2"/> Reset Password
                </h4>
                 <div>
                    <label htmlFor="newPassword" className={`block text-sm font-medium text-${THEME.accentText}`}>New Password</label>
                    <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputBaseClasses} placeholder="Min. 6 characters"/>
                </div>
                <div>
                    <label htmlFor="confirmNewPassword" className={`block text-sm font-medium text-${THEME.accentText}`}>Confirm New Password</label>
                    <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputBaseClasses} />
                </div>
                {passwordResetError && <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{passwordResetError}</div>}
                {passwordResetSuccess && <div className="p-2 bg-green-100 text-green-700 rounded text-sm">{passwordResetSuccess}</div>}
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="submit" disabled={isSavingUser} className={`px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 disabled:opacity-50`}>
                        {isSavingUser ? 'Resetting...' : 'Reset Password'}
                    </button>
                </div>
            </form>
            <div className="mt-6 text-right">
                 <button type="button" onClick={closeEditModal} className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50`}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEmployees;
