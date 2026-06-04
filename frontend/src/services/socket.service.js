import { io } from 'socket.io-client';


const SOCKET_URL = 'https://zoonosispotosi.site'; 

const socket = io(SOCKET_URL, {
    autoConnect: false, 
});

export default socket;