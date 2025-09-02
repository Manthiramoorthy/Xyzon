import React, { createContext, useContext, useState, useCallback } from 'react';

const MenuContext = createContext({ items: [], setItems: () => { }, clearItems: () => { } });

export function MenuProvider({ children }) {
    const [items, setItemsInternal] = useState([]);
    const setItems = useCallback((next) => setItemsInternal(Array.isArray(next) ? next : []), []);
    const clearItems = useCallback(() => setItemsInternal([]), []);
    return (
        <MenuContext.Provider value={{ items, setItems, clearItems }}>
            {children}
        </MenuContext.Provider>
    );
}

export function useMenu() { return useContext(MenuContext); }
