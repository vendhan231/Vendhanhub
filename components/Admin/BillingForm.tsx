import React, { useState, useEffect } from 'react';
import { useNavigate, useParams }
from 'react-router-dom';
import { 
    apiAddBillingRecord, 
    apiFetchAllUsers, 
    apiFetchProjects,
    apiUpdateBillingRecord,
    // apiGetDailyWorkReport, // Not directly used here, but similar concept for fetching single record
    apiFetchBillingRecords 
} from '../../services/api';
import { NewManualBillingRecordData, BillingStatus, User, Project, BillingRecord, UserRole as AppUserRole, ProjectBillingType } from '../../types'; 
import { THEME } from '../../constants';


interface BillingFormProps {
  // existingRecordId prop is removed, will use useParams
}

const BillingForm: React.FC<BillingFormProps> = () => {
  const navigate = useNavigate();
  const { recordId: existingRecordId } = useParams<{ recordId: string }>(); 

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [clientName, setClientName] = useState('');
  const [projectId, setProjectId] = useState(''); 
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [hoursBilled, setHoursBilled] = useState<number | ''>('');
  const [rateApplied, setRateApplied] = useState<number | ''>(''); 
  const [status, setStatus] = useState<BillingStatus>(BillingStatus.PENDING);
  const [notes, setNotes] = useState('');
  const [currentBillingType, setCurrentBillingType] = useState<ProjectBillingType | null>(null);


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(true);


  useEffect(() => {
    const loadInitialData = async () => {
      setIsFetchingInitialData(true);
      setError(null);
      try {
        const [fetchedUsers, fetchedProjects] = await Promise.all([
          apiFetchAllUsers(),
          apiFetchProjects()
        ]);
        
        setUsers(fetchedUsers.filter(u => u.role === AppUserRole.EMPLOYEE));
        setProjects(fetchedProjects);

        if (existingRecordId) {
          const allRecords = await apiFetchBillingRecords(); 
          const recordToEdit = allRecords.find(r => r.id === existingRecordId);
          if (recordToEdit) {
            setClientName(recordToEdit.clientName);
            setProjectId(recordToEdit.projectId); 
            setUserId(recordToEdit.userId);
            setDate(recordToEdit.date);
            setHoursBilled(recordToEdit.hoursBilled); // For hourly, this is key
            setStatus(recordToEdit.status);
            setNotes(recordToEdit.notes || '');

            const projectOfRecord = fetchedProjects.find(p => p.id === recordToEdit.projectId);
            if (projectOfRecord) {
                setCurrentBillingType(projectOfRecord.billingType);
                if (projectOfRecord.billingType === 'hourly') {
                    setRateApplied(recordToEdit.rateApplied !== undefined ? recordToEdit.rateApplied : (projectOfRecord.ratePerHour || ''));
                } else {
                    setRateApplied(''); // No direct rate input for count-based in this form
                }
            }
          } else {
            setError('Billing record not found for editing.');
            navigate('/admin/billing'); 
          }
        } else {
            // New record: if projects exist, projectId is empty until selected
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load initial data.');
        console.error(err);
      } finally {
        setIsFetchingInitialData(false);
      }
    };
    loadInitialData();
  }, [existingRecordId, navigate]);

  // Effect to update rateApplied and billingType when projectId changes
  useEffect(() => {
    if (projectId) {
      const selectedProject = projects.find(p => p.id === projectId);
      if (selectedProject) {
        setCurrentBillingType(selectedProject.billingType);
        if (selectedProject.billingType === 'hourly') {
            // For new records, or if project changes, set rate from project.
            // For existing hourly records, this useEffect will run after initial load,
            // but the rate should have been set from recordToEdit.rateApplied initially.
            // If user changes project for an existing record, then this update is correct.
           if (!existingRecordId || (existingRecordId && selectedProject.id !== projects.find(p => p.id === projectId)?.id) ) { // if it's a new record or project has changed
             setRateApplied(selectedProject.ratePerHour !== undefined ? selectedProject.ratePerHour : '');
           }
        } else {
          setRateApplied(''); // Clear rate for count-based projects
        }
      } else {
        setRateApplied(''); 
        setCurrentBillingType(null);
      }
    } else {
      setRateApplied('');
      setCurrentBillingType(null);
    }
  }, [projectId, projects, existingRecordId]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientName || !projectId || !userId || !date) {
      setError('Please fill in Client, Project, Employee, and Date.');
      return;
    }

    const selectedProject = projects.find(p => p.id === projectId);
    if (!selectedProject) {
      setError('Invalid project selected.');
      return;
    }

    let recordPayload: Partial<BillingRecord> = {
        clientName,
        projectId,
        userId,
        date,
        status,
        notes,
    };

    if (selectedProject.billingType === 'hourly') {
        if (hoursBilled === '' || Number(hoursBilled) <= 0) {
            setError('Valid positive hours billed are required for hourly projects.');
            return;
        }
        if (rateApplied === '' || Number(rateApplied) <= 0) {
            setError('Valid positive rate applied is required for hourly projects. It should be set by the project.');
            return;
        }
        recordPayload = {
            ...recordPayload,
            hoursBilled: Number(hoursBilled),
            rateApplied: Number(rateApplied),
            isCountBased: false,
            calculatedAmount: Number(hoursBilled) * Number(rateApplied),
        };
    } else { // Count-based - this form is not for generating these, but for viewing/minor edits if allowed
        recordPayload.hoursBilled = hoursBilled !== '' ? Number(hoursBilled) : 0;
        recordPayload.isCountBased = true;
        
        if(existingRecordId) {
            // Fetch the original record to preserve its calculatedAmount if not explicitly changed by this form.
            const allRecords = await apiFetchBillingRecords(); 
            const originalRecord = allRecords.find(r => r.id === existingRecordId);
            // This form does not provide a way to modify calculatedAmount for count-based items.
            // So, we preserve the original calculatedAmount by setting it in the payload.
            recordPayload.calculatedAmount = originalRecord?.calculatedAmount;
        } else {
            // Cannot create a count-based record with a calculated amount from this simple form
            setError("Manual creation of count-based billing records with calculated amounts is not supported via this form. Use the Billing Calculator.");
            return;
        }
    }


    setIsLoading(true);
    
    try {
      if (existingRecordId) {
        await apiUpdateBillingRecord(existingRecordId, recordPayload);
        alert('Billing record updated successfully!');
      } else {
        // Ensure NewManualBillingRecordData aligns with this payload
        const newRecordForApi: NewManualBillingRecordData = {
            clientName: recordPayload.clientName!,
            projectId: recordPayload.projectId!,
            userId: recordPayload.userId!,
            date: recordPayload.date!,
            hoursBilled: recordPayload.hoursBilled!, 
            status: recordPayload.status!,
            notes: recordPayload.notes,
        };
        await apiAddBillingRecord(newRecordForApi); 
        alert('Billing record created successfully!');
      }
      navigate('/admin/billing');
    } catch (err: any) {
      setError(err.message || 'Failed to save billing record.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm placeholder-gray-400`;
  const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const buttonPrimaryClasses = `w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition duration-150 ease-in-out`;


  if (isFetchingInitialData) {
    return (
        <div className={`p-6 bg-white rounded-xl shadow-lg max-w-2xl mx-auto text-center text-${THEME.accentText}`}>
            <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading form data...
        </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg max-w-2xl mx-auto`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6`}>
        {existingRecordId ? 'Edit Billing Record' : 'Add New Billing Record (Hourly)'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="clientName" className={`block text-sm font-medium text-${THEME.accentText}`}>Client Name</label>
          <input type="text" id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputBaseClasses} required />
        </div>

        <div>
          <label htmlFor="projectId" className={`block text-sm font-medium text-${THEME.accentText}`}>Project</label>
          <select id="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={selectBaseClasses} required>
            <option value="" disabled>Select a project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name} ({project.billingType})</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="userId" className={`block text-sm font-medium text-${THEME.accentText}`}>Assign to Employee</label>
          <select id="userId" value={userId} onChange={(e) => setUserId(e.target.value)} className={selectBaseClasses} required>
            <option value="" disabled>Select an employee</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.username})</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="date" className={`block text-sm font-medium text-${THEME.accentText}`}>Date</label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputBaseClasses} required />
            </div>
            <div>
                <label htmlFor="status" className={`block text-sm font-medium text-${THEME.accentText}`}>Status</label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value as BillingStatus)} className={selectBaseClasses} required>
                    {Object.values(BillingStatus).map(sVal => (
                        <option key={sVal} value={sVal}>{sVal.charAt(0).toUpperCase() + sVal.slice(1)}</option>
                    ))}
                </select>
            </div>
        </div>

        {currentBillingType === 'hourly' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="hoursBilled" className={`block text-sm font-medium text-${THEME.accentText}`}>Hours Billed</label>
                <input 
                    type="number" 
                    id="hoursBilled" 
                    value={hoursBilled} 
                    onChange={(e) => setHoursBilled(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                    min="0.01" step="0.01" 
                    className={inputBaseClasses} 
                    required={currentBillingType === 'hourly'} 
                />
            </div>
            <div>
                <label htmlFor="rateApplied" className={`block text-sm font-medium text-${THEME.accentText}`}>Rate Applied ($/hour)</label>
                <input 
                    type="number" 
                    id="rateApplied" 
                    value={rateApplied} 
                    onChange={(e) => setRateApplied(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className={`${inputBaseClasses} ${existingRecordId ? '' : 'bg-gray-100'}`} // Readonly for new, editable for existing
                    readOnly={!existingRecordId && currentBillingType === 'hourly'} // Rate is from project for new hourly
                    required={currentBillingType === 'hourly'} 
                    title={!existingRecordId && currentBillingType === 'hourly' ? "Rate is determined by the selected project for new records." : "Enter rate applied."}
                />
            </div>
            </div>
        )}
        {currentBillingType === 'count_based' && (
            <div>
                 <label htmlFor="hoursBilledCB" className={`block text-sm font-medium text-${THEME.accentText}`}>Hours Tracked (Optional)</label>
                 <input 
                    type="number" 
                    id="hoursBilledCB" 
                    value={hoursBilled} 
                    onChange={(e) => setHoursBilled(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                    min="0" step="0.01" 
                    className={inputBaseClasses} 
                    placeholder="Internal tracking if needed"
                />
                <p className="text-xs text-gray-500 mt-1">For count-based projects, billing is not based on hours. This field is for internal time tracking only.</p>
            </div>
        )}


        <div>
          <label htmlFor="notes" className={`block text-sm font-medium text-${THEME.accentText}`}>Notes (Optional)</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputBaseClasses}></textarea>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
            <button
                type="button"
                onClick={() => navigate('/admin/billing')}
                className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.secondary} transition`}
            >
                Cancel
            </button>
            <button type="submit" disabled={isLoading || isFetchingInitialData} className={buttonPrimaryClasses}>
            {isLoading ? (
                <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
                </>
            ) : (existingRecordId ? 'Save Changes' : 'Create Record')}
            </button>
        </div>
      </form>
    </div>
  );
};

export default BillingForm;