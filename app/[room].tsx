import { Alert, TouchableOpacity, Modal, View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import Clipboard from '@react-native-clipboard/clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { supabase, getRoomById, createRoom, createParticipant, updateParticipant, getParticipantsByRoomId } from '../supabase';
import { useEffect, useState } from 'react';
import { Hoverable } from 'react-native-web-hover';

interface Participant {
    id: number;
    alias: string;
    role: string;
    room_id: number;
    vote: string | null;
    created_at: string;
}

// Función para obtener el alias guardado
const getSavedAlias = () => {
    return localStorage.getItem('voteit_alias');
};

// Función para guardar el alias
const saveAlias = (alias: string) => {
    localStorage.setItem('voteit_alias', alias);
};

export default function Room() {

    // Variables necesarias
    const { room } = useLocalSearchParams();
    const roomParam = Array.isArray(room) ? room[0] : room;
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [myId, setMyId] = useState(0)
    // const [alias, setAlias] = useState("")
    const [role, setRole] = useState("")
    const [modalVisible, setModalVisible] = useState(true);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [showingVotes, setShowingVotes] = useState(false);
    const votingNumbers = [1, 2, 3, 4, 5, 8, 13, 20, 40];

    // En el estado inicial
    const [alias, setAlias] = useState(() => {
        // Intentamos obtener el alias guardado
        const savedAlias = getSavedAlias();
        return savedAlias || ""; // Si no hay alias guardado, usamos una cadena vacía
    });



    // Setup de la sala
    useEffect(() => {
        async function setupRoom() {

            // CREADOR DE SALA AUTOMÁTICO //////////////////////////////////////////////////////

            const roomData = await getRoomById(Number(roomParam));
            if (!roomData) {
                await createRoom(roomParam);
                // Establecer showing_votes a false por defecto
                await supabase
                    .from('rooms')
                    .update({ showing_votes: false })
                    .eq('id', Number(roomParam));
                const participant = await createParticipant(Number(roomParam), '', 'owner');
                if (participant) { setMyId(participant.id); setRole('owner') }
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
                if (participant) { setMyId(participant.id); setRole('owner') }

                // Lo agregamos al array de participantes
                if (participant) {
                    setParticipants(prev => [...prev, participant]);
                }

            } else {

                // Invitado
                const participant = await createParticipant(Number(roomParam), '', 'guest');
                if (participant) { setMyId(participant.id); setRole('guest') }

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
        const updatedParticipant = await updateParticipant(myId, alias, role);
        if (updatedParticipant) {
            setParticipants(prev =>
                prev.map(p => (p.id === updatedParticipant.id ? updatedParticipant : p))
            );
            setModalVisible(false);            saveAlias(alias);
        }
    }

    // Suscripción a cambios
    useEffect(() => {
        // Suscribirse a cambios en la tabla rooms para la sala actual
        const roomChannel = supabase
            .channel('room-changes-' + roomParam)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomParam}`,
                },
                async (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const updatedRoom = payload.new;
                        setShowingVotes(updatedRoom.showing_votes);
                    }
                }
            )
            .subscribe();

        // Suscribirse a cambios en la tabla participants
        const participantsChannel = supabase
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

                    // Si el voto del usuario cambia a null, reiniciamos selectedOption
                    const currentUser = participantsData?.find(p => p.id === myId);
                    if (currentUser?.vote === null) {
                        setSelectedOption(null);
                        setHasVoted(false);
                        setShowingVotes(false);
                    }
                }
            )
            .subscribe();
    }, [roomParam]);

    const handleVote = async (num: number) => {
        // Si ya ha votado y no ha seleccionado una opción, no permitir desmarcar
        if (hasVoted && !num) {
            return;
        }

        // Actualizar el estado de si ha votado
        if (num) {
            setHasVoted(true);
        }

        setSelectedOption(num);

        // Actualización optimista: actualizamos el estado local inmediatamente
        if (myId) {
            setParticipants(prev =>
                prev.map(p =>
                    p.id === myId ? { ...p, vote: num ? num.toString() : null } : p
                )
            );

            // Luego actualizamos la base de datos
            await supabase
                .from('participants')
                .update({ vote: num ? num : null })
                .eq('id', myId);
        }
    };

    const handleReset = async () => {
        setSelectedOption(null);

        // Actualización optimista: reestablecemos los votos de todos los participantes
        setParticipants(prev =>
            prev.map(p => ({ ...p, vote: null }))
        );

        // Actualizamos la base de datos para todos los participantes de esta sala
        await supabase
            .from('participants')
            .update({ vote: null })
            .eq('room_id', Number(roomParam));

        // Reiniciar el estado de si ha votado
        setHasVoted(false);
    };


    return (
        <>
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.roomData}>
                        <Text style={styles.roomLabel}>ID de la sala</Text>
                        <View style={styles.idContainer}>
                            <Text style={styles.id}>{room}</Text>
                            <TouchableOpacity
                                style={styles.shareButton}
                                onPress={() => {
                                    Clipboard.setString(`letsvote.expo.app/${room}`);
                                    console.log("llego");
                                    Alert.alert('Enlace copiado', 'El enlace de la sala ha sido copiado al portapapeles');
                                }}>
                                <Ionicons name="share-social" size={50} color="grey" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.votingBoard}>
                        <View style={styles.headerBoard}>
                            <Text style={styles.headerBoardText}>Nombre</Text>
                            <Text style={styles.headerBoardText}>Voto</Text>
                        </View>
                        <View style={styles.voteList}>
                            {participants.map(participant => (
                                <Hoverable>
                                    {({ hovered }) => (
                                        <View style={[styles.vote, hovered && styles.voteHovered]} key={participant.id}>
                                            <View style={styles.identification}>
                                                <Text style={[styles.voteText, styles.aliasText]}>{participant.alias}</Text>
                                                <Text
                                                    style={[
                                                        styles.roleText,
                                                        participant.role === 'owner' && styles.ownerRole,
                                                        participant.role === 'guest' && styles.guestRole,
                                                    ]}
                                                >
                                                    {participant.role === 'owner' ? 'PROPIETARIO' : 'INVITADO'}
                                                </Text>
                                                {participant.id === myId && (
                                                    <Text
                                                        style={[
                                                            styles.roleText,
                                                            styles.meRole
                                                        ]}
                                                    >
                                                        YO
                                                    </Text>
                                                )}
                                            </View>
                                            {showingVotes || participant.id === myId
                                                ? (participant.vote !== null && participant.vote !== undefined ?
                                                    <Text style={styles.voteText}>{participant.vote}</Text> :
                                                    <Text style={styles.voteText}>—</Text>)
                                                : <Ionicons name="eye-off" size={24} color="#fff" />}
                                        </View>
                                    )}
                                </Hoverable>
                            ))}
                        </View>

                        {role === 'owner' && (

                            <View style={styles.actionsBoard}>
                                <Hoverable style={styles.hoverable}>
                                    {({ hovered }) => (
                                        <Pressable style={[styles.action, hovered && styles.actionHovered]} onPress={handleReset}>
                                            <Ionicons name="reload-circle" size={26} color="white" />
                                        </Pressable>
                                    )}
                                </Hoverable>
                                <Hoverable style={styles.hoverable}>
                                    {({ hovered }) => (
                                        <Pressable
                                            style={[styles.action, hovered && styles.actionHovered]}
                                            onPress={async () => {
                                                await supabase
                                                    .from('rooms')
                                                    .update({ showing_votes: !showingVotes })
                                                    .eq('id', Number(roomParam));
                                            }}
                                        >
                                            <Ionicons name={showingVotes ? "eye" : "eye-off"} size={26} color="white" />
                                        </Pressable>
                                    )}
                                </Hoverable>
                            </View>

                        )}
                    </View>
                    <View style={styles.votingOptions}>
                        {votingNumbers.map(num => (
                            <Hoverable>
                                {({ hovered }) => (
                                    <TouchableOpacity
                                        key={num}
                                        style={[
                                            styles.votingOption,
                                            selectedOption === num && styles.votingOptionSelected,
                                            hovered && (selectedOption === num ? styles.votingOptionSelectedHovered : styles.votingOptionHovered)
                                        ]}
                                        onPress={() => handleVote(num)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.votingOptionText,
                                                selectedOption === num && styles.votingOptionTextSelected,
                                            ]}
                                        >
                                            {num}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </Hoverable>
                        ))}
                    </View>
                </View>
            </View>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
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
    shareButton: {
        padding: 10,
    },
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
        fontWeight: '900',
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
        borderRadius: 20,
        overflow: 'hidden',
    },
    headerBoard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#393939',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    actionsBoard: {
        flexDirection: 'row',
        backgroundColor: '#393939',
    },
    headerBoardText: {
        color: '#B6B6B6',
        fontSize: 16,
        fontWeight: '900',
    },
    voteList: {
        backgroundColor: '#464646',
        paddingVertical: 5,
    },
    vote: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    voteHovered: {
        backgroundColor: '#565656',
    },
    voteText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
    aliasText: {
        // backgroundColor: '#393939',
        borderRadius: 7,
        paddingHorizontal: 8,
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
        gap: 10,
    },
    button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        backgroundColor: '#212121'
    },
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
        borderRadius: 20,
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',   
        gap: 10,
        padding: 10,
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
        backgroundColor: '#4caf50',
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
    votingOptionHovered: {
        backgroundColor: '#2B2B2B',
        borderColor: '#464646',
    },
    votingOptionSelectedHovered: {
        backgroundColor: '#4caf50',
        borderColor: '#388e3c',
    },
    hoverable: {
        flex: 1,
    },
    action: {
        backgroundColor: '#212121',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    actionHovered: {
        backgroundColor: '#4caf50',
        borderColor: '#388e3c',
    },
    roleText: {
        marginTop: 5,
        borderRadius: 5,
        paddingHorizontal: 5,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        alignContent: 'center',
        backgroundColor: 'grey',
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
        // opacity: 0.7,
    },
    ownerRole: {
        backgroundColor: '#F9B600',
        color: '#A77A00',
    },
    guestRole: {
        backgroundColor: '#0070F9',
        color: '#004AA4',
    },
    meRole: {
        backgroundColor: '#4caf50',
        color: '#306C32',
    },
    identification: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
});
