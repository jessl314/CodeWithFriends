import {useState, useEffect} from 'react';

/*
pass in the current state object holding my html, css, and js which changes everytime someone types something and a delay of 300 ms

every time a user strikes a key, main component re-renders and calls useDebounce (thus useEffect)

it sets timer, clears previous timers 
*/

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedVal, setDebouncedVal] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedVal(value);
        }, delay);

        // kills pending timers from previous keystrokes/renders before setting new countdown of 300 ms
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedVal;
}
