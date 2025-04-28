import { TouchableOpacity, Modal, View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { supabase, getRoomById, createRoom, createParticipant, updateParticipant, getParticipantsByRoomId } from '../supabase';
import { useEffect, useState } from 'react';

interface Participant {
    id: number;
    alias: string;
    role: string;
    room_id: number;
    vote: string | null;
}

export default function Room() {

    // Variables necesarias
    const { room } = useLocalSearchParams();
    const roomParam = Array.isArray(room) ? room[0] : room;
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [myId, setMyId] = useState(0)
    const [alias, setAlias] = useState("")
    const [modalVisible, setModalVisible] = useState(true);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const votingNumbers = [1, 2, 3, 4, 5, 8, 13, 20, 40];

    // Setup de la sala
    useEffect(() => {
        async function setupRoom() {

            // CREADOR DE SALA AUTOMÁTICO //////////////////////////////////////////////////////

            const roomData = await getRoomById(Number(roomParam));
            if (!roomData) {
                await createRoom(roomParam);
                const participant = await createParticipant(Number(roomParam), '', 'owner');
                if (participant) { setMyId(participant.id) }
            }

            // GESTIÓN DE PARTICIPANTES ////////////////////////////////////////////////////////

            // 1. Obtenemos los participantes
            const participantsData = await getParticipantsByRoomId(Number(roomParam));

            // 2. Almacenamos los participantes para poder ir renderizándolos
            setParticipants(participantsData || []);

            // 3. Si no hay participantes, creamos uno, pero hay que ver si es dueño o invitado
            if (participantsData?.length === 0) {

                // Dueño
                const participant = await createParticipant(Number(roomParam), '', 'owner');
                if (participant) { setMyId(participant.id) }

                // Lo agregamos al array de participantes
                if (participant) {
                    setParticipants(prev => [...prev, participant]);
                }

            } else {

                // Invitado
                const participant = await createParticipant(Number(roomParam), '', 'guest');
                if (participant) { setMyId(participant.id) }

                // Lo agregamos al array de participantes
                if (participant) {
                    setParticipants(prev => [...prev, participant]);
                }

            }

        }
        if (myId === 0) {
            setupRoom();
        }
    }, []);

    // Petición del alias
    const handleAliasAssign = async () => {
        const updatedParticipant = await updateParticipant(myId, alias, 'owner');
        if (updatedParticipant) {
            setParticipants(prev =>
                prev.map(p => (p.id === updatedParticipant.id ? updatedParticipant : p))
            );
            setModalVisible(false);
        }
    }

    // Suscripción a cambios
    useEffect(() => {
        // Suscribirse a cambios en la tabla participants para la sala actual
        const channel = supabase
            .channel('participants-room-' + roomParam)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'participants',
                    filter: `room_id=eq.${roomParam}`,
                },
                async (payload) => {
                    // Cada vez que haya un cambio, recarga los participantes
                    const participantsData = await getParticipantsByRoomId(Number(roomParam));
                    setParticipants(participantsData || []);
                }
            )
            .subscribe();

        // Limpieza al desmontar el componente
        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomParam]);

    const handleVote = async (num: number) => {
        setSelectedOption(selectedOption === num ? null : num);

        // Actualiza el voto en la base de datos
        if (myId) {
            await supabase
                .from('participants')
                .update({ vote: num })
                .eq('id', myId);

            // No necesitas actualizar el estado local de participants aquí,
            // porque la suscripción a cambios ya lo hace automáticamente.
        }
    };
    

    return (
        <>
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
                                    <Text style={styles.voteText}>
                                        {participant.vote !== null && participant.vote !== undefined ? participant.vote : '—'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.votingOptions}>
                        {votingNumbers.map(num => (
                            <TouchableOpacity
                                key={num}
                                style={[
                                    styles.votingOption,
                                    selectedOption === num && styles.votingOptionSelected
                                ]}
                                onPress={() => handleVote(num)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.votingOptionText,
                                        selectedOption === num && styles.votingOptionTextSelected
                                    ]}
                                >
                                    {num}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                statusBarTranslucent={true}
                // navigationBarTranslucent={true}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>¿Cómo te llamas?</Text>
                        <TextInput
                            style={styles.aliasInput}
                            placeholder="Alias"
                            placeholderTextColor={'grey'}
                            value={alias}
                            onChangeText={setAlias}
                        />
                        <Pressable
                            style={styles.button}
                            onPress={handleAliasAssign}>
                            <Text style={styles.textStyle}>¡Votemos!</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </>
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
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        margin: 20,
        backgroundColor: '#2B2B2B',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'grey',
        gap: 10,
    },
    button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        backgroundColor: '#212121'
    },
    // buttonOpen: {
    //     backgroundColor: '#F194FF',
    // },
    // buttonClose: {
    //     backgroundColor: '#2196F3',
    // },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        textAlign: 'center',
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold'
    },
    aliasInput: {
        height: 40,
        width: 200,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#212121',
        fontWeight: 'bold',
        color: 'white',
    },
    votingOptions: {
        width: '100%',
        // backgroundColor: '#212121',
        borderRadius: 20,
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',            // <-- permite que los hijos salten a otra fila
        justifyContent: 'center',    // <-- centra los hijos horizontalmente
        gap: 10,
        padding: 10,                 // opcional: espacio interno
        // maxHeight: 200,           // opcional: altura máxima si quieres limitarlo
    },
    votingOption: {
        backgroundColor: '#212121',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    votingOptionSelected: {
        backgroundColor: '#4caf50', // verde o el color que prefieras
        borderColor: '#388e3c',
    },
    votingOptionText: {
        color: '#464646',
        fontSize: 24,
        fontWeight: 'bold',
    },
    votingOptionTextSelected: {
        color: 'white',
    },
});
