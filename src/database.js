
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration missing. Please set up your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);


export const busAPI = {
 
    async getAllBuses() {
        try {
            const { data, error } = await supabase
                .from('buses')
                .select('*')
                .order('s_no', { ascending: true });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching buses:', error);
            return { success: false, error: error.message };
        }
    },

 
    async getBusByVehicleNumber(vehicleNumber) {
        try {
            const { data, error } = await supabase
                .from('buses')
                .select('*')
                .eq('v_no', vehicleNumber)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching bus:', error);
            return { success: false, error: error.message };
        }
    },

 
    async getBusesByRoute(source, destination) {
        try {
            const { data, error } = await supabase
                .from('buses')
                .select('*')
                .ilike('src', `%${source}%`)
                .ilike('des', `%${destination}%`)
                .order('s_no', { ascending: true });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error searching buses by route:', error);
            return { success: false, error: error.message };
        }
    },

    
    async updateBusStatus(vehicleNumber, location, status, authorityId) {
        try {
            const { data: busData, error: busError } = await supabase
                .from('buses')
                .update({
                    current_location: location,
                    st: status || 'Active',
                    last_update: new Date().toISOString()
                })
                .eq('v_no', vehicleNumber)
                .select()
                .single();

            if (busError) throw busError;
            const { data: updateData, error: updateError } = await supabase
                .from('bus_updates')
                .insert({
                    bus_id: busData.s_no,
                    location: location,
                    status: status || 'Active',
                    update_time: new Date().toISOString(),
                    updated_by: authorityId
                })
                .select()
                .single();

            if (updateError) throw updateError;

            return { success: true, data: { bus: busData, update: updateData } };
        } catch (error) {
            console.error('Error updating bus status:', error);
            return { success: false, error: error.message };
        }
    },

   
    async getBusUpdateHistory(vehicleNumber, limit = 10) {
        try {
            const { data, error } = await supabase
                .from('bus_updates')
                .select(`
                    *,
                    buses!inner(v_no)
                `)
                .eq('buses.v_no', vehicleNumber)
                .order('update_time', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching bus update history:', error);
            return { success: false, error: error.message };
        }
    },

  
    async getRecentUpdates(limit = 20) {
        try {
            const { data, error } = await supabase
                .from('bus_updates')
                .select(`
                    *,
                    buses!inner(v_no, src, des)
                `)
                .order('update_time', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching recent updates:', error);
            return { success: false, error: error.message };
        }
    },


    async getActiveBuses() {
        try {
            const { data, error } = await supabase
                .from('buses')
                .select('*')
                .eq('st', 'Active')
                .order('last_update', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching active buses:', error);
            return { success: false, error: error.message };
        }
    },

   
    async addNewBus(busData) {
        try {
            const { data, error } = await supabase
                .from('buses')
                .insert({
                    v_no: busData.vehicleNumber,
                    src: busData.source,
                    des: busData.destination,
                    st: busData.status || 'Scheduled',
                    current_location: busData.currentLocation
                })
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error adding new bus:', error);
            return { success: false, error: error.message };
        }
    }
};


export const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

export const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const getTimeDifference = (timestamp) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - updateTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};