import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://drfjhoblltatuzqqckik.supabase.co'
// const supabaseKey = process.env.SUPABASE_KEY
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZmpob2JsbHRhdHV6cXFja2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Njc0ODIsImV4cCI6MjA2MTM0MzQ4Mn0.xTqkdOSZ7o4frUdcxR4zYp20L9j5eh8ML1zJIZ3_O7o'
export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getRoomById(roomId: number) {
    const { data, error } = await supabase
        .from('rooms')
        .select('id')
        .eq('id', roomId)
        .single();
    if (error) {
        console.error('Error getting room:', error);
        return null;
    }
    return data;
}

export async function getRoomByName(name: string) {
    const { data, error } = await supabase
        .from('rooms')
        .select('id')
        .eq('name', name)
        .single();

    if (error) {
        console.error('Error getting room:', error);
        return null;
    }
    return data;
}

export async function createRoom(name?: string) {
    if (name) {
        const room = await getRoomByName(name);
        if (room) {
            return null; // Room already exists
        }
    }
    const { data: room, error } = await supabase
        .from('rooms')
        .insert({ name })
        .select('id')
        .single();
    if (error) {
        console.error('Error creating room:', error);
        return null;
    }
    return room;
}

export async function createParticipant(roomId: number, alias: string, role: string) {
    const { data: participant, error } = await supabase
        .from('participants')
        .insert({ room_id: roomId, alias, role })
        .select('id, alias, role, room_id')
        .single();
    if (error) {
        console.error('Error creating participant:', error);
        return null;
    }
    return participant;
}

export async function updateParticipant(id: number, alias: string, role: string) {
    const { data: participant, error } = await supabase
        .from('participants')
        .update({ alias, role })
        .eq('id', id)
        .select('id, alias, role, room_id')
        .single();
    if (error) {
        console.error('Error updating participant:', error);
        return null;
    }
    return participant;
}

export async function getParticipantsByRoomId(roomId: number) {
    const { data, error } = await supabase
        .from('participants')
        .select('id, alias, role, room_id')
        .eq('room_id', roomId);
    if (error) {
        console.error('Error getting participants:', error);
        return null;
    }
    return data;
}
