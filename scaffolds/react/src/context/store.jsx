import {useState, createContext} from 'react'


export const Store = createContext({})


export const StoreProvider = props => {
    const [exampleStoreValue, setExampleStoreValue] = useState('Some Value')

    return (
        <Store.Provider value={{
            exampleStoreValue, setExampleStoreValue
        }}>
            {props.children}
        </Store.Provider>
    )
}