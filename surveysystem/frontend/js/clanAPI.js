// OBB Baseline Survey System - Clan API Service

window.ClanAPI = {
    // Base URL for API calls
    baseUrl: 'http://127.0.0.1:8000/api',
    
    // Get all clans
    getAllClans: async function() {
        try {
            console.log('ClanAPI: Fetching all clans...');
            const response = await API.get('/clans/');
            console.log('ClanAPI: Response received:', response);
            return response;
        } catch (error) {
            console.error('ClanAPI: Get all clans error:', error);
            
            // Provide more specific error information
            let errorMessage = 'Failed to connect to backend';
            let errorDetails = error.message;
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network connection failed - please check your internet connection';
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                errorMessage = 'Backend server is not responding - please try again later';
            } else if (error.status === 401) {
                errorMessage = 'Authentication required - please log in again';
            } else if (error.status === 403) {
                errorMessage = 'Access denied - insufficient permissions';
            } else if (error.status >= 500) {
                errorMessage = 'Server error - please try again later';
            }
            
            return { success: false, error: errorMessage, details: errorDetails, status: error.status || 0 };
        }
    },
    
    // Get clan data for current user
    getClan: async function() {
        try {
            return await API.get('/clans/current/');
        } catch (error) {
            console.error('Get clan error:', error);
            return { success: false, error: 'Failed to connect to backend' };
        }
    },
    
    // Create new clan
    createClan: async function(clanData) {
        try {
            return await API.post('/clans/', clanData);
        } catch (error) {
            console.error('Create clan error:', error);
            return { success: false, error: 'Failed to connect to backend' };
        }
    },
    
    // Create new sub-clan
    createSubClan: async function(subClanData) {
        try {
            return await API.post('/subclans/', subClanData);
        } catch (error) {
            console.error('Create sub-clan error:', error);
            return { success: false, error: 'Failed to connect to backend' };
        }
    },
    
    // Create new ridge
    createRidge: async function(ridgeData) {
        try {
            return await API.post('/ridges/', ridgeData);
        } catch (error) {
            console.error('Create ridge error:', error);
            return { success: false, error: 'Failed to connect to backend' };
        }
    },
    
    // Get all sub-clans for a clan
    getSubClans: async function(clanId) {
        try {
            return await API.get(`/clans/${clanId}/subclans/`);
        } catch (error) {
            console.error('Get sub-clans error:', error);
            return { success: false, error: 'Failed to connect to backend' };
        }
    },
    
    // Get all ridges for a sub-clan
    getRidges: async function(subClanId) {
        try {
            return await API.get(`/subclans/${subClanId}/ridges/`);
        } catch (error) {
            console.error('Get ridges error:', error);
            return { success: false, error: 'Failed to connect to backend' };
        }
    }
};
    
    
