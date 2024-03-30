import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, CircularProgress } from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import styled from '@emotion/styled';


const defaultNotificationContext = {
  addNotification: () => {},
  updateNotification: () => {},
  removeNotification: () => {}
};

const NotificationContext = createContext(defaultNotificationContext);

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />;
});

export const useNotification = () => useContext(NotificationContext);

const StyledCircularProgress = styled(CircularProgress)`
    width: 15px !important;
    height: 15px !important;
    margin-left: 1em;
`;

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback(({ message, severity = 'info', duration = 6000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications((prevNotifications) => [...prevNotifications, { id, message, severity, duration }]);
        return id;
    }, []);

    const updateNotification = useCallback(
        (id, updates) => {
            let notificationExists = false;

            const updatedNotifications = notifications.map((notification) => {
                if (notification.id === id) {
                    notificationExists = true;
                    return { ...notification, ...updates };
                }
                return notification;
            });

            if (!notificationExists) {
                const newId = Math.random().toString(36).substr(2, 9);
                const newNotification = {
                    id: newId,
                    ...updates,
                };
                updatedNotifications.push(newNotification);
            }

            setNotifications(updatedNotifications);
        },
        [notifications]
    );

    const removeNotification = useCallback((id) => {
        setNotifications((prevNotifications) => prevNotifications.filter(notification => notification.id !== id));
    }, []);

    const calculateMargin = (index, arrayLength) => {
        const baseMargin = 20;
        const marginIncrement = 60;
        return baseMargin + (arrayLength - index - 1) * marginIncrement;
    };

    return (
        <NotificationContext.Provider value={{ addNotification, updateNotification, removeNotification }}>
            {children}
            {notifications.map((notification, index) => (
                <Snackbar
                    key={notification.id}
                    open
                    autoHideDuration={notification.duration}
                    style={{ bottom: calculateMargin(index, notifications.length) }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    <Alert onClose={() => removeNotification(notification.id)} severity={notification.severity} sx={{ width: '100%' }}>
                        {notification.message}
                        {notification.severity === 'info' && <StyledCircularProgress color='inherit' />}
                    </Alert>
                </Snackbar>
            ))}
        </NotificationContext.Provider>
    );
};
