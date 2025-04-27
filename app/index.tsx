import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { supabase } from "../supabase";
import { useState } from "react";

export default function Index() {

    const [room, setRoom] = useState('');

    const handleCreateRoom = async () => {

        // Create a new room
        const { data: room, error } = await supabase
            .from('rooms')
            .insert({})
            .select('id')
            .single();
        if (error) {
            console.error('Error creating room:', error);
            return;
        }

        console.log('Room created with ID:', room.id);

        router.navigate(`/${room.id}`)
        
    };

    const handleJoinRoom = async (id: number) => {
        
        const { data, error } = await supabase
            .from('rooms')
            .select('id')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error joining room:', error);
            return;
        }

        console.log('Joined room with ID:', data.id);
        router.navigate(`/${data.id}`)
    };



    return (

        <View style={styles.container}>
            <View style={styles.content}>

                <View style={styles.joinContainer}>

                    <TextInput style={styles.roomID} placeholder="ID de la sala" placeholderTextColor="#5C5C5C" value={room} onChangeText={setRoom} keyboardType="numeric"></TextInput>

                    <Pressable style={styles.joinButton} onPress={() => { handleJoinRoom(parseInt(room)) }}>
                        <Ionicons name="arrow-forward" size={24} color="#5C5C5C" />
                    </Pressable>

                </View>

                <Pressable style={styles.createButton} onPress={() => { handleCreateRoom() }}>
                    <Text style={[styles.text, styles.createText]}>Crear una sala</Text>
                </Pressable>

            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    text: {
        color: '#FFFFFF',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        // flex: 1,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    joinContainer: {
        width: '100%',
        height: 60,
        flexDirection: 'row',
        gap: 10,
    },
    roomID: {
        // width: '80%',
        flex: 1,
        height: '100%',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#474747',
        color: '#BABABA',
        fontSize: 24,
        fontWeight: '600',
    },
    joinButton: {
        width: '20%',
        height: '100%',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#373737',
        color: '#5C5C5C',
        fontSize: 24,
        fontWeight: '600',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButton: {
        width: '100%',
        height: 60,
        backgroundColor: '#373737',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    createText: {
        color: '#474747',
        fontSize: 24,
        fontWeight: '900',
    },
});