import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { supabase, getRoomById, createRoom, createParticipant, updateParticipant, getParticipantsByRoomId } from '../supabase';
import { useEffect, useState } from 'react';

interface Participant {
    id: number;
    alias: string;
    role: string;
    room_id: number;
}

export default function Room() {

    // Obtener el parámetro dinámico de la URL con expo-router
    const { room } = useLocalSearchParams();

    // Estado para almacenar los participantes
    const [participants, setParticipants] = useState<Participant[]>([]);

    useEffect(() => {

        async function setupRoom() {

            // Comprobar si la sala existe
            const roomData = await getRoomById(Number(room));

            if (!roomData) {
                // Si no existe, se crea en este momento
                await createRoom();
            }

            // Obtener los participantes de la sala
            const participants = await getParticipantsByRoomId(Number(room));

            // Añadir los participantes al estado
            if (participants) {
                setParticipants(participants);
            }

            // Si no hay ninguno, se crea un participante en este momento, sin alias y con el rol 'owner'
            if (!participants) {

                const participant = await createParticipant(Number(room), '', 'owner');
                // Con esto conseguimos no tener que esperar a que el creador de la sala nos diga su
                // alias, el ya es el dueño de la sala, con lo cual nadie que entre a partir de este
                // momento tendrá el rol de dueño, sino de invitado

                // Ahora sí, se le pregunta al usuario por un alias
                const alias = 'Héctor'; // TODO: Crear una modal y ejecutarla aquí para pedir el alias, por ahora una constante

                if (participant) {
                    const updatedParticipant = await updateParticipant(participant.id, alias, 'owner');
                    if (updatedParticipant) {
                        setParticipants(prev => [...prev, updatedParticipant]);
                    }
                }

            } else {

                // Si ya hay participantes, significa que el usuario es un invitado, se pregunta por un alias
                // y hasta que no responda, no se crea el participante
                const alias = 'Héctor'; // TODO: Crear una modal y ejecutarla aquí para pedir el alias, por ahora una constante

                // Se crea un participante en este momento, con el alias y el rol 'guest'
                const participant = await createParticipant(Number(room), alias, 'guest');

                // Se añade el nuevo participante al array de participantes
                if (participant) {
                    setParticipants(prev => [...prev, participant]);
                }

            }
        }
        setupRoom();
    }, []);



    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.roomData}>
                    <Text style={styles.roomLabel}>ID de la sala</Text>
                    <View style={styles.idContainer}>
                        <Text style={styles.id}>{room}</Text>
                        <Ionicons name="share-social" size={50} color="grey" />
                    </View>
                </View>
                <View style={styles.votingBoard}>
                    <View style={styles.headerBoard}>
                        <Text style={styles.headerBoardText}>Nombre</Text>
                        <Text style={styles.headerBoardText}>Voto</Text>
                    </View>
                    <View style={styles.voteList}>

                        {participants.map(participant => (
                            <View style={styles.vote} key={participant.id}>
                                <Text style={styles.voteText}>{participant.alias}</Text>
                                <Text style={styles.voteText}>...</Text>
                            </View>
                        ))}

                        {/* Ejemplo para el mapeo */}
                        {/* <View style={styles.vote}>
                            <Text style={styles.voteText}>Héctor</Text>
                            <Text style={styles.voteText}>...</Text>
                        </View> */}

                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        gap: 25,
    },
    roomData: {
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    roomLabel: {
        color: 'grey',
        fontSize: 24,
        fontWeight: 'bold',
    },
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    id: {
        color: '#FFFFFF',
        fontSize: 64,
        fontWeight: '900',
    },
    votingBoard: {
        backgroundColor: '#464646',
        borderRadius: 20,
        padding: 20,
        gap: 10,
    },
    headerBoard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    headerBoardText: {
        color: 'grey',
        fontSize: 16,
        fontWeight: 'bold',
    },
    voteList: {
        gap: 10,
    },
    vote: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    voteText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
})
