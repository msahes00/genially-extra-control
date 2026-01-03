import { createClient } from '@supabase/supabase-js';

/**
 * The supabase instance to send the telemetry.
 */
const supabase = createClient(
    "https://yezpvgmtcbamrgedrgvm.supabase.co", 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllenB2Z210Y2JhbXJnZWRyZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MDUyNzksImV4cCI6MjA2Njk4MTI3OX0.bvFE_d-pt6fSrvDB7P8odus5-w9h6D2IHC265dZfi7c"
);

/**
 * The key used to store and retrieve the user ID in local storage.
 */
const USER_KEY = "userId";

/**
 * The base timeout in milliseconds before retrying a failed telemetry request.
 */
const RETRY_TIMEOUT = 1000;

/**
 * The maximum number of times to retry sending telemetry data after a failure.
 */
const MAX_RETRIES = 10;

/**
 * The factor by which the retry timeout increases with each subsequent retry.
 */
const BACKOFF_FACTOR = 1.5;

/**
 * Sends telemetry data to database.
 * Implements exponential backoff with retries in case of failure.
 * @param data    The actual telemetry data object to send.
 * @param type    The type of exercise or event the telemetry relates to.
 * @param attempt The current retry attempt number (internal parameter).
 */
export const send = async (
    data: object,
    type: string,
    attempt = 0
): Promise<void> => {

    try {

        // Serialize the data before sending it
        const serialized = JSON.parse(JSON.stringify(data));

        const row = {
            userId: localStorage.getItem(USER_KEY) ?? "",
            exerciseType: type,
            currentDate: new Date().toISOString(),
            
            // Flatten the serialized data
            ...serialized,
        };
        
        const { error } = await supabase
            .from('telemetrycontrol')
            .insert(row);

        if (error) throw error;

    } catch (err) {

        console.warn(`Telemetry attempt ${attempt + 1} failed:`, err);

        if (attempt >= MAX_RETRIES) {
            console.error(`Telemetry gave up after ${attempt + 1} attempts.`);
            return;
        }

        // Apply the exponential backoff and retry
        const delay = RETRY_TIMEOUT * Math.pow(BACKOFF_FACTOR, attempt);
        setTimeout(
            () => send(data, type, attempt + 1),
            delay
        );
    }
};

/**
 * Sets the user ID in local storage.
 * @param user The user ID to store.
 */
export const login = (user: string): void => {
    localStorage.setItem(USER_KEY, user);
};

/**
 * Gets the user ID in local storage.
 * @param The current user ID or an empty string.
 */
export const getUser = (): string => {
    return localStorage.getItem(USER_KEY) || "";
};