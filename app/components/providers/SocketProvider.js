'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/app/context/AuthContext';
import API_BASE_URL from '@/lib/apiConfig';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

// Seconds left on an access token, or 0 when it cannot be read. Access tokens are short-lived (an hour), so a reconnect
// after a while would otherwise present one that has run out.
const secondsLeft = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.exp - Date.now() / 1000;
    } catch {
        return 0;
    }
};

export const SocketProvider = ({ children }) => {
    const { user, refreshSession } = useAuth();
    const refreshRef = useRef(refreshSession);
    refreshRef.current = refreshSession;
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // Live updates are private to the signed-in user, so the connection exists only while someone is signed in
    // and presents their token. The backend puts the connection in that user's own room.
    const signedIn = !!user;

    useEffect(() => {
        if (!signedIn) return undefined;

        const socketUrl = API_BASE_URL || 'http://localhost:5000';

        const socketInstance = io(socketUrl, {
            transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
            // A function, so every (re)connect sends the current token, including one that was just refreshed. A token
            // about to run out is renewed first.
            auth: (cb) => {
                (async () => {
                    let token = localStorage.getItem('token');
                    if (token && secondsLeft(token) < 60) {
                        try {
                            await refreshRef.current?.();
                            token = localStorage.getItem('token');
                        } catch {
                            // the connection attempt below fails the same way a bad token always did
                        }
                    }
                    cb({ token });
                })();
            },
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            autoConnect: true,
        });

        socketInstance.on('connect', () => setIsConnected(true));
        socketInstance.on('disconnect', (reason) => {
            setIsConnected(false);
            // The server closes a user's sockets when their account changes (password, role, sign out everywhere). The
            // client does not reconnect by itself after that, so ask once: with a still-valid token it simply works.
            if (reason === 'io server disconnect') setTimeout(() => socketInstance.connect(), 500);
        });
        socketInstance.on('connect_error', (err) => {
            console.warn('Live updates unavailable, falling back to polling:', err.message);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [signedIn]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
